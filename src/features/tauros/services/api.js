// La URL del backend se obtiene de la variable de entorno REACT_APP_API_URL.
//
// - En produccion es obligatoria: no adivinamos protocolo ni puerto porque
//   esta app se sirve por HTTPS (ver server.js) y un fallback a "http://"
//   quedaria bloqueado por el navegador como mixed content, dejando la app
//   muerta sin ningun error visible.
// - En desarrollo, si falta, asumimos el mismo protocolo y host que la app
//   (nunca "http://" a secas) y el puerto por defecto del backend NestJS
//   (ver .env.example y tauros-backend/src/main.ts).
const isProduction = process.env.NODE_ENV === 'production';
const DEV_FALLBACK_PORT = 3000;

const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (isProduction) {
    return null;
  }

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:${DEV_FALLBACK_PORT}`;
};

export const API_BASE_URL = getApiBaseUrl();

// El JWT (access/refresh) ya no pasa por el frontend: el backend lo entrega
// via cookies httpOnly (tauros_access_token / tauros_refresh_token) que el
// navegador maneja solo. Lo unico que seguimos persistiendo es el usuario
// (nombre, correo, rol - no es secreto).
export const TAUROS_USER_KEY = 'tauros_user';

const CSRF_HEADER_NAME = 'X-CSRF-Token';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Endpoints de autenticacion: nunca se les aplica el flujo de refresh-and-retry
// (evita loops y evita disparar un refresh mientras se hace login/logout), y
// tampoco necesitan (ni pueden esperar) un csrfToken previo en memoria — son
// justo los que lo generan/renuevan.
const AUTH_ENDPOINTS = new Set(['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']);

// El token CSRF vive en memoria, no en una cookie legible por JS: el backend
// setea la cookie `tauros_csrf` con httpOnly:false, pero eso solo sirve para
// que el propio navegador la reenvie sola en requests futuras al backend. Si
// el frontend corre en un dominio distinto al backend (como en produccion:
// tauros-front-web.onrender.com vs tauros-backend.onrender.com), document.cookie
// JAMAS puede leer esa cookie desde el frontend — es una restriccion de origen
// del navegador, no del flag httpOnly. Por eso login/refresh/2fa-verify
// devuelven el mismo valor en el body de la respuesta (ver auth.controller.ts
// del backend), y ese valor es el que se guarda y reenvia como header acá.
let csrfToken = null;

function captureCsrfToken(payload) {
  if (payload && typeof payload === 'object' && typeof payload.csrfToken === 'string') {
    csrfToken = payload.csrfToken;
  }
}

// Se llama al cerrar sesion: el backend ya invalido su cookie/token CSRF, asi
// que la copia en memoria del frontend queda obsoleta.
export function clearCsrfToken() {
  csrfToken = null;
}

function buildCsrfHeaders(method) {
  if (!MUTATING_METHODS.has(method) || !csrfToken) {
    return {};
  }

  return { [CSRF_HEADER_NAME]: csrfToken };
}

// Si vamos a mandar una request mutante y todavia no tenemos ningun csrfToken
// en memoria (tipico despues de recargar la pagina: el estado de React se
// reinicia pero la sesion sigue viva en las cookies httpOnly), lo conseguimos
// llamando a /auth/refresh primero — esa ruta esta exenta de CSRF justo para
// poder resolver este arranque en frio. Definida mas abajo, junto al resto
// del flujo de refresh, para compartir la misma promesa/deduplicacion.
async function ensureCsrfToken() {
  if (csrfToken) {
    return csrfToken;
  }

  await refreshAccessToken();
  return csrfToken;
}

function clearSession() {
  localStorage.removeItem(TAUROS_USER_KEY);
  clearCsrfToken();
}

function redirectToLogin() {
  if (window.location.hash !== '#/login') {
    window.location.hash = '/login';
  }
}

function handleSessionExpired() {
  clearSession();
  // useTaurosApp escucha este evento para limpiar tambien el estado en
  // memoria (user, etc.), ya que aca solo tenemos acceso a localStorage.
  window.dispatchEvent(new Event('tauros:session-expired'));
  redirectToLogin();
}

async function performRequest(path, options) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    ...(options.headers || {}),
    ...buildCsrfHeaders(method),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    headers,
    // La cookie httpOnly con el access token viaja sola, pero solo si el
    // browser tiene permiso explicito para mandarla/recibirla.
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  return { response, payload };
}

// Varias requests pueden necesitar un refresh al mismo tiempo (un 401 en
// loadCatalogs, o el arranque en frio de ensureCsrfToken de arriba).
// Compartir una unica promesa evita bombardear /auth/refresh con intentos
// concurrentes, y de paso captura el csrfToken nuevo que devuelve el body.
let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = performRequest('/auth/refresh', { method: 'POST' })
    .then(({ response, payload }) => {
      if (response.ok) {
        captureCsrfToken(payload);
      }
      return response.ok;
    })
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// El segundo parametro (antes el JWT para armar "Authorization: Bearer ...")
// se mantiene por compatibilidad con los call sites existentes, pero ya no se
// usa: la sesion viaja sola en la cookie httpOnly tauros_access_token.
export async function apiRequest(path, _token, options = {}) {
  if (!API_BASE_URL) {
    throw new Error(
      'Falta configurar REACT_APP_API_URL en este entorno. La app no puede conectarse al backend.'
    );
  }

  const method = (options.method || 'GET').toUpperCase();
  if (MUTATING_METHODS.has(method) && !AUTH_ENDPOINTS.has(path)) {
    await ensureCsrfToken();
  }

  let { response, payload } = await performRequest(path, options);

  if (response.status === 401 && !AUTH_ENDPOINTS.has(path)) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      ({ response, payload } = await performRequest(path, options));
    } else {
      handleSessionExpired();
      throw new Error('Tu sesion expiro. Vuelve a iniciar sesion.');
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      handleSessionExpired();
    }

    if (typeof payload === 'object' && payload !== null) {
      throw new Error(payload.message || 'Error de conexion con backend');
    }
    throw new Error(payload || 'Error de conexion con backend');
  }

  // login/register/2fa-verify tambien devuelven un csrfToken nuevo en el
  // body (ver comentario junto a la definicion de `csrfToken` mas arriba);
  // no-op para el resto de los endpoints, que no traen ese campo.
  captureCsrfToken(payload);

  return payload;
}
