export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

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
    if (typeof payload === 'object' && payload !== null) {
      throw new Error(payload.message || 'Error de conexion con backend');
    }
    throw new Error(payload || 'Error de conexion con backend');
  }

  return payload;
}
