/**
 * CORS Origins Configuration
 * 
 * This file defines the allowed origins for CORS requests.
 * Used by both backend and media services to ensure consistent CORS configuration.
 * 
 * Origins can be configured via environment variable CORS_ORIGINS (comma-separated)
 * or by modifying the defaultOrigins array below.
 */

/**
 * Default allowed origins
 * Add your frontend URLs here
 */
const defaultOrigins: string[] = [
  'http://localhost:5173', // Vite default dev server
  'http://localhost:5174', // Alternative Vite port
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'https://jawab.jantrah.io',
  'http://192.168.100.32:5173'
];

/**
 * Get allowed origins from environment variable or use defaults
 * 
 * Environment variable format: 
 * - CORS_ORIGINS=http://localhost:5173,https://example.com (specific origins)
 * - CORS_ORIGINS=* (allow all origins)
 * - CORS_ORIGINS not set (use default localhost origins)
 * 
 * @param envOrigins - Optional environment variable value (comma-separated origins or '*')
 * @returns Array of allowed origin strings, or ['*'] to allow all
 */
export function getAllowedOrigins(envOrigins?: string): string[] {
  if (!envOrigins) {
    return defaultOrigins;
  }

  const trimmed = envOrigins.trim();
  
  // If '*' is specified, allow all origins
  if (trimmed === '*') {
    return ['*'];
  }

  // Parse comma-separated origins
  return trimmed
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * Check if an origin is allowed
 * 
 * @param origin - The origin to check
 * @param allowedOrigins - Array of allowed origins
 * @returns true if origin is allowed, false otherwise
 */
export function isOriginAllowed(
  origin: string | undefined,
  allowedOrigins: string[],
): boolean {
  if (!origin) {
    // Allow requests with no origin (e.g., same-origin, Postman, curl)
    return true;
  }

  // If allowedOrigins is empty or contains '*', allow all origins
  if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

/**
 * CORS origin callback function for NestJS enableCors()
 * 
 * @param allowedOrigins - Array of allowed origins (or ['*'] to allow all)
 * @returns Callback function compatible with NestJS CORS configuration
 */
export function createOriginCallback(allowedOrigins: string[]) {
  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // If '*' is in allowed origins, allow all origins
    if (allowedOrigins.includes('*')) {
      callback(null, true);
      return;
    }

    if (isOriginAllowed(origin, allowedOrigins)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  };
}

/**
 * Get CORS configuration object for NestJS
 * 
 * @param envOrigins - Optional environment variable value for CORS_ORIGINS
 * @returns CORS configuration object
 */
export function getCorsConfig(envOrigins?: string) {
  const allowedOrigins = getAllowedOrigins(envOrigins);

  return {
    origin: createOriginCallback(allowedOrigins),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Authorization'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
}
