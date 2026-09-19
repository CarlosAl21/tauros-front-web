const VIDEO_UPLOAD_MARKER = '/video/upload/';
// Every exercise clip in the dataset is a square 180x180 (1:1) media file, so
// the transformation must never crop it. `c_limit` only downsizes (never
// upscales, never crops) and keeps the original aspect ratio. The mobile app
// uses the same parameters (lib/cloudinary.ts).
const VIDEO_TRANSFORMATION = 'c_limit,w_720,h_720';
// Older builds forced a 16:9 `c_fill` crop that cut the figure. Strip it if a
// stored URL still carries it so the media is served uncropped.
const LEGACY_TRANSFORMATION_PATTERN = /(?:f_auto,q_auto,)?c_fill,w_960,h_540(?:,so_0)?\//;

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

  const cleanUrl = url.replace(LEGACY_TRANSFORMATION_PATTERN, '');

  if (cleanUrl.includes(`${VIDEO_UPLOAD_MARKER}${VIDEO_TRANSFORMATION}/`)) {
    return cleanUrl;
  }

  return cleanUrl.replace(VIDEO_UPLOAD_MARKER, `${VIDEO_UPLOAD_MARKER}${VIDEO_TRANSFORMATION}/`);
}

// First-frame JPG poster of an exercise clip, uncropped (1:1 preserved).
export function buildExerciseThumbnailUrl(videoUrl) {
  if (!videoUrl || typeof videoUrl !== 'string') {
    return '';
  }

  try {
    const parsed = new URL(videoUrl);
    if (!parsed.hostname.includes('res.cloudinary.com') || !parsed.pathname.includes(VIDEO_UPLOAD_MARKER)) {
      return '';
    }

    const [prefix, suffix] = parsed.pathname.replace(LEGACY_TRANSFORMATION_PATTERN, '').split(VIDEO_UPLOAD_MARKER);
    if (!suffix) {
      return '';
    }

    const jpgPath = suffix.replace(/\.[^./?]+$/, '.jpg');
    return `${parsed.origin}${prefix}${VIDEO_UPLOAD_MARKER}${VIDEO_TRANSFORMATION},so_0/${jpgPath}${parsed.search || ''}`;
  } catch (_error) {
    return '';
  }
}
