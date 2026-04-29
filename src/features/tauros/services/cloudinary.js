import { apiRequest } from './api';

function toFileLike(value, fallbackName, fallbackType) {
  if (typeof File !== 'undefined' && value instanceof File) {
    return value;
  }

  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return new File([value], fallbackName, { type: value.type || fallbackType });
  }

  throw new Error('Archivo invalido para subida directa a Cloudinary');
}

async function parseUploadResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export async function uploadDirectlyToCloudinary({ token, file, folder, resourceType, fallbackName }) {
  if (!file) {
    throw new Error('No se encontro ningun archivo para subir');
  }

  const normalizedFile = toFileLike(
    file,
    fallbackName || `media-${Date.now()}`,
    resourceType === 'video' ? 'video/mp4' : 'image/jpeg',
  );

  const signature = await apiRequest('/cloudinary/signature', token, {
    method: 'POST',
    body: JSON.stringify({
      folder,
      resourceType,
    }),
  });

  const formData = new FormData();
  formData.append('file', normalizedFile);
  formData.append('api_key', signature.apiKey);
  formData.append('timestamp', String(signature.timestamp));
  formData.append('signature', signature.signature);
  formData.append('folder', signature.folder);

  const response = await fetch(signature.uploadUrl, {
    method: 'POST',
    body: formData,
  });

  const payload = await parseUploadResponse(response);

  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null
      ? payload.error?.message || payload.message
      : payload;
    throw new Error(message || 'No se pudo subir el archivo a Cloudinary');
  }

  if (!payload?.secure_url) {
    throw new Error('Cloudinary no devolvio una URL segura');
  }

  return payload.secure_url;
}