// src/utils/mediaUtils.js
//
// Uses the centralized config at src/config/app.js.
// Switch local vs live URLs via the `hostType` flag in that file.
//
import { MEDIA_BASE_URL } from '../config/app';

// MEDIA_BASE_URL already includes the "/api" suffix (e.g. "https://jawab.jantrah.io/jawab-media/api").
// Derive the root (without /api) for absolute path construction.
const MEDIA_SERVICE_ROOT = MEDIA_BASE_URL.replace(/\/api\/?$/, '');
const MEDIA_SERVICE_URL = MEDIA_BASE_URL;

/**
 * Normalizes a media URL to ensure it's an absolute URL pointing to the media service.
 * Handles both relative URLs (starting with /api/media or /) and absolute URLs.
 *
 * @param {string} url - The media URL from the API (can be relative or absolute)
 * @returns {string|null} - Normalized absolute URL, or null if input was empty
 */
export const normalizeMediaUrl = (url) => {
  if (!url) return null;

  // If already an absolute URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If it's a relative URL starting with /api/media, prepend the media root (without /api)
  if (url.startsWith('/api/media')) {
    return `${MEDIA_SERVICE_ROOT}${url}`;
  }

  // If it's a relative URL starting with /, assume it's from the media service root
  if (url.startsWith('/')) {
    return `${MEDIA_SERVICE_ROOT}${url}`;
  }

  // Otherwise, assume it's a relative path under /api/media/
  return `${MEDIA_SERVICE_URL}/media/${url}`;
};

/**
 * Gets the full media service URL for a given path.
 *
 * @param {string} path - The media path (e.g., 'files/topics/image.jpg' or 'api/media/files/...')
 * @returns {string|null} - Full URL to the media service, or null if input was empty
 */
export const getMediaUrl = (path) => {
  if (!path) return null;

  // Strip leading slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Ensure it starts with api/media/
  const mediaPath = cleanPath.startsWith('api/media/') ? cleanPath : `api/media/${cleanPath}`;

  return `${MEDIA_SERVICE_ROOT}/${mediaPath}`;
};

// Re-export for convenience if other utils need the raw base
export { MEDIA_SERVICE_URL, MEDIA_SERVICE_ROOT };
