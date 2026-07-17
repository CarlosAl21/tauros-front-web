const VIDEO_UPLOAD_MARKER = '/video/upload/';
// 16:9, recorte centrado (c_fill) para que todos los videos de ejercicios
// midan lo mismo, sin importar la proporcion con la que se subieron.
// Mismos parametros que usa la app movil (lib/cloudinary.ts) para que la
// miniatura/preview del panel coincida con lo que ve el usuario final.
const VIDEO_TRANSFORMATION = 'c_fill,w_960,h_540';

export function normalizeVideoUrl(url) {
  if (!url || typeof url !== 'string') {
    return url || '';
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch (_error) {
    return url;
  }

  if (!parsed.hostname.includes('res.cloudinary.com') || !parsed.pathname.includes(VIDEO_UPLOAD_MARKER)) {
    return url;
  }

  if (parsed.pathname.includes(`${VIDEO_UPLOAD_MARKER}${VIDEO_TRANSFORMATION}/`)) {
    return url;
  }

  return url.replace(VIDEO_UPLOAD_MARKER, `${VIDEO_UPLOAD_MARKER}${VIDEO_TRANSFORMATION}/`);
}
