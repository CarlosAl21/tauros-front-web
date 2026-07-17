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

const CSRF_COOKIE_NAME = 'tauros_csrf';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// login/register todavia no tienen sesion (recien se va a crear), asi que el
// backend no exige el header CSRF ahi.
const PUBLIC_AUTH_ENDPOINTS = new Set(['/auth/login', '/auth/register']);

// Endpoints de autenticacion: nunca se les aplica el flujo de refresh-and-retry
// (evita loops y evita disparar un refresh mientras se hace login/logout).
const AUTH_ENDPOINTS = new Set(['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']);

function readCsrfCookie() {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function buildCsrfHeaders(path, method) {
  if (!MUTATING_METHODS.has(method) || PUBLIC_AUTH_ENDPOINTS.has(path)) {
    return {};
  }

  const csrfToken = readCsrfCookie();
  return csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {};
}

function clearSession() {
  localStorage.removeItem(TAUROS_USER_KEY);
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

// Varias requests pueden recibir 401 al mismo tiempo (ej. las llamadas en
// paralelo de loadCatalogs). Compartir una unica promesa de refresh evita
// bombardear /auth/refresh con intentos concurrentes.
let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      // El refresh token vive en la cookie httpOnly tauros_refresh_token
      // (Path /auth); el backend la lee solo, no hace falta mandar nada en
      // el body. credentials: 'include' es lo unico que importa aca.
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: buildCsrfHeaders('/auth/refresh', 'POST'),
      });

      return response.ok;
    } catch (_err) {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function performRequest(path, options) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    ...(options.headers || {}),
    ...buildCsrfHeaders(path, method),
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

// El segundo parametro (antes el JWT para armar "Authorization: Bearer ...")
// se mantiene por compatibilidad con los call sites existentes, pero ya no se
// usa: la sesion viaja sola en la cookie httpOnly tauros_access_token.
export async function apiRequest(path, _token, options = {}) {
  if (!API_BASE_URL) {
    throw new Error(
      'Falta configurar REACT_APP_API_URL en este entorno. La app no puede conectarse al backend.'
    );
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

  return payload;
}
