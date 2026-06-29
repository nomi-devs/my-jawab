// src/api/axiosClient.js
import axios from "axios";
import { API_BASE_URL, BASE_PATH } from "../config/app";

const baseURL = API_BASE_URL;

// Option 2: Use standalone proxy server (run: npm run proxy)
// const baseURL = import.meta.env.DEV 
//   ? "http://jawab.jantrah.io/backend/api-media/api"  // Standalone proxy server
//   : "https://72.60.181.228/Jawab/api";  // Direct in production

// Note: For CORS to work with direct URL, backend must have these headers:
// Access-Control-Allow-Origin: * (or your frontend domain)
// Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
// Access-Control-Allow-Headers: Content-Type, Authorization

const axiosClient = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  withCredentials: false, // Set to true if backend requires credentials (cookies)
});


// Set default headers
axiosClient.defaults.headers.common["Content-Type"] = "application/json";
axiosClient.defaults.headers.common["Accept"] = "application/json";
// Don't add X-Requested-With - it can cause CORS issues with some backends

// Remove x-xsrf-token header if axios adds it automatically
axiosClient.defaults.headers.common["x-xsrf-token"] = undefined;
delete axiosClient.defaults.headers.common["x-xsrf-token"];

// Flag to prevent infinite logout loops
let isLoggingOut = false;

/**
 * Centralized logout function
 * Clears all authentication-related data and redirects to login
 * @param {boolean} skipApiCall - If true, skips the logout API call (prevents infinite loops)
 */
const performLogout = async (skipApiCall = false) => {
  // Prevent multiple simultaneous logout attempts
  if (isLoggingOut) {
    return;
  }

  isLoggingOut = true;

  try {
    // Optionally call logout API (but don't fail if it errors since we're already unauthorized)
    if (!skipApiCall) {
      try {
        // Create a temporary axios instance without interceptors to avoid recursion
        const tempAxios = axios.create({
          baseURL: baseURL,
          timeout: 5000,
        });

        // Check both localStorage and sessionStorage for token
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (token) {
          tempAxios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          await tempAxios.post("/admin/logout");
        }
      } catch (apiError) {
        // Ignore errors from logout API call - we're logging out anyway
        console.warn("Logout API call failed (this is expected if already unauthorized):", apiError.message);
      }
    }
  } catch (error) {
    // Ignore any errors during logout process
    console.warn("Error during logout process:", error.message);
  } finally {
    // Clear all authentication-related localStorage and sessionStorage items
    // Keep darkMode preference as it's not auth-related
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("is_active");
    localStorage.removeItem("is_verified");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("email");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("is_active");
    sessionStorage.removeItem("is_verified");

    // Reset the flag after a short delay to allow redirect
    setTimeout(() => {
      isLoggingOut = false;
    }, 1000);

    // Redirect to login page if not already there
    const currentPath = window.location.pathname;
    const loginPath = `${BASE_PATH}/login`;
    const basePathRoute = BASE_PATH === "/" ? "" : BASE_PATH;

    // Check if we're already on login page or base path
    if (currentPath !== loginPath &&
      currentPath !== basePathRoute &&
      !currentPath.startsWith(loginPath)) {
      window.location.href = loginPath;
    }
  }
};

// Request interceptor: Add token automatically and handle CORS
axiosClient.interceptors.request.use(
  (config) => {
    // Don't add Authorization header for public auth endpoints
    const url = config.url || "";
    const isPublicAuthEndpoint = url.includes("/admin/login") ||
      url.includes("/admin/forgot-password") ||
      url.includes("/admin/reset-password") ||
      url.includes("admin/login") ||
      url.includes("admin/forgot-password") ||
      url.includes("admin/reset-password");

    // Only add token for authenticated endpoints
    if (!isPublicAuthEndpoint) {
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Ensure x-xsrf-token is not sent (can cause CORS issues)
    delete config.headers["x-xsrf-token"];
    delete config.headers["X-XSRF-TOKEN"];

    // Remove headers that can cause CORS preflight issues
    delete config.headers["X-Requested-With"];

    // CORS: Ensure proper headers are set
    // Don't set Origin header - browser handles this automatically
    // Ensure Content-Type is set for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(config.method?.toUpperCase())) {
      // For FormData (file uploads), let the browser set Content-Type
      // with the proper multipart boundary. Never override it.
      if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        delete config.headers['Content-Type'];
        if (config.headers.common) delete config.headers.common['Content-Type'];
        if (config.headers.put) delete config.headers.put['Content-Type'];
        if (config.headers.post) delete config.headers.post['Content-Type'];
        if (config.headers.patch) delete config.headers.patch['Content-Type'];
      } else if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors globally
axiosClient.interceptors.response.use(
  (response) => {
    // Return successful responses as-is
    return response;
  },
  async (error) => {
    // Handle 401 Unauthorized - trigger logout
    if (error.response?.status === 401) {
      // Get both relative URL and full URL to check
      const relativeUrl = error.config?.url || "";
      const fullUrl = error.config?.url || error.response?.config?.url || "";
      const requestUrl = relativeUrl || fullUrl;

      // Skip logout for authentication endpoints (login, forgot-password, reset-password)
      // These endpoints can legitimately return 401 for invalid credentials
      const isAuthEndpoint = requestUrl.includes("/admin/login") ||
        requestUrl.includes("/admin/forgot-password") ||
        requestUrl.includes("/admin/reset-password") ||
        requestUrl.includes("admin/login") ||
        requestUrl.includes("admin/forgot-password") ||
        requestUrl.includes("admin/reset-password");

      // Skip API call if the error is from the logout endpoint itself (prevents infinite loop)
      const isLogoutEndpoint = requestUrl.includes("/admin/logout") ||
        requestUrl.includes("admin/logout");

      // Only trigger logout for authenticated endpoints, not for auth endpoints
      if (!isAuthEndpoint && !isLogoutEndpoint) {
        await performLogout(isLogoutEndpoint);
      } else {
        // Log for debugging - auth endpoints returning 401 is normal
        console.log("401 error on auth endpoint (this is expected for invalid credentials):", requestUrl);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error("Access forbidden: You don't have permission to perform this action");
    }

    // Handle CORS and network errors with detailed diagnostics
    if (error.code === "ERR_NETWORK" || error.message === "Network Error" || !error.response) {
      // Check if it's a CORS error
      const isCorsError = error.message?.includes("CORS") ||
        error.message?.includes("cross-origin") ||
        error.message?.includes("blocked") ||
        (error.code === "ERR_NETWORK" && !error.response);

      if (isCorsError) {
        console.error("🚫 CORS Error Detected!");
        console.error("Frontend Origin:", window.location.origin);
        console.error("Backend URL:", baseURL);
        console.error("\n✅ Backend CORS must allow:");
        console.error("  - Access-Control-Allow-Origin:", window.location.origin, "(or *)");
        console.error("  - Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
        console.error("  - Access-Control-Allow-Headers: Content-Type, Authorization, Accept");
        console.error("  - Handle OPTIONS preflight requests");
        console.error("\n⚠️ Common CORS issues:");
        console.error("  1. Backend CORS middleware not handling OPTIONS requests");
        console.error("  2. Origin mismatch (backend must allow your exact origin)");
        console.error("  3. Missing headers in Access-Control-Allow-Headers");
        console.error("  4. CORS middleware order (must be before route handlers)");
        console.error("  5. Backend returning 404/500 on OPTIONS instead of 200");
      } else {
        console.error("Network error: Please check your internet connection");
      }
    }

    // Handle CORS preflight failures (OPTIONS request failures)
    if (error.config?.method?.toUpperCase() === 'OPTIONS' ||
      (error.response?.status === 0 && error.config?.url?.includes(baseURL))) {
      console.error("⚠️ CORS Preflight (OPTIONS) request failed");
      console.error("Backend must handle OPTIONS requests and return proper CORS headers");
      console.error("Expected: OPTIONS request should return 200 with CORS headers");
    }

    // Return error to be handled by the calling code
    return Promise.reject(error);
  }
);

export default axiosClient;
