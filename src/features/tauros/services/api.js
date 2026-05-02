// La URL del backend se obtiene de la variable de entorno, o usa localhost:3001 en desarrollo
// En producción, debe estar configurada en la variable REACT_APP_API_URL
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Detectar el host actual (sin puerto) y usarlo con el puerto 3001 para el backend
  const currentHost = window.location.hostname;
  return `http://${currentHost}:3001`;
};

export const API_BASE_URL = getApiBaseUrl();

const handleUnauthorized = () => {
  localStorage.removeItem('tauros_token');
  localStorage.removeItem('tauros_user');

  if (window.location.hash !== '#/login') {
    window.location.hash = '/login';
  }
};

export async function apiRequest(path, token, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }

    if (typeof payload === 'object' && payload !== null) {
      throw new Error(payload.message || 'Error de conexion con backend');
    }
    throw new Error(payload || 'Error de conexion con backend');
  }

  return payload;
}
