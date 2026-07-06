// src/config/app.js

/**
 * Application configuration
 * Centralized config for API URLs, paths, and environment.
 *
 * Switch environments with a single flag:
 *   - hostType = "local"  → localhost URLs
 *   - hostType = "live"   → production URLs (jawab.jantrah.io)
 *
 * Everything is hardcoded here. No .env / VITE_* env vars.
 */

// ─── SWITCH ME ───────────────────────────────────────────────
// Change this to "local" or "live" to instantly switch all URLs.
export const hostType = 'local'; // "local" | "live"
// ─────────────────────────────────────────────────────────────

const URLS = {
  local: {
    API_BASE_URL: 'http://localhost:3001/api',
    MEDIA_BASE_URL: 'http://localhost:3001/api',
    BASE_URL: 'http://localhost:5173',
    BASE_PATH: '',
  },
  live: {
    API_BASE_URL: 'https://jawab.jantrah.io/backend/api',
    MEDIA_BASE_URL: 'https://jawab.jantrah.io/jawab-media/api',
    BASE_URL: 'https://jawab.jantrah.io',
    BASE_PATH: '',
  },
};

const active = URLS[hostType] || URLS.live;

// API Base URL backend server
export const API_BASE_URL = active.API_BASE_URL;

// Media Service URL
export const MEDIA_BASE_URL = active.MEDIA_BASE_URL;

// Frontend base path (for router basename and redirects)
export const BASE_PATH = active.BASE_PATH;

// Frontend base URL (for redirects / external links)
export const BASE_URL = active.BASE_URL;

export default {
  hostType,
  API_BASE_URL,
  MEDIA_BASE_URL,
  BASE_PATH,
  BASE_URL,
};
