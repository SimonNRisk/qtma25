/**
 * Environment configuration utilities
 */

const environment = (process.env.NEXT_PUBLIC_ENVIRONMENT || 'prod').toLowerCase();
export const IS_DEV = environment === 'dev';

/**
 * Get the backend API URL based on environment
 * In development, uses Next.js API proxy to make requests same-origin (for cookies)
 * In production, uses direct backend URL
 */
export const getApiUrl = (): string => {
  if (IS_DEV) {
    // Use Next.js API proxy in development so cookies work with samesite="lax"
    return '/api/proxy';
  }

  const prodUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!prodUrl) {
    console.warn(
      'NEXT_PUBLIC_BACKEND_URL is not set in production mode. Defaulting to localhost:8000'
    );
    return 'http://localhost:8000';
  }

  return prodUrl;
};

/**
 * Get the actual backend URL (for server-side use or when proxy isn't needed)
 */
export const getBackendUrl = (): string => {
  if (IS_DEV) {
    return 'http://localhost:8000';
  }

  const prodUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!prodUrl) {
    return 'http://localhost:8000';
  }

  return prodUrl;
};
