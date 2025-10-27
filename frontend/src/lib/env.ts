/**
 * Environment configuration utilities
 */

const environment = (process.env.NEXT_PUBLIC_ENVIRONMENT || 'prod').toLowerCase();
export const IS_DEV = environment === 'dev';

/**
 * Get the backend API URL based on environment
 */
export const getApiUrl = (): string => {
  if (IS_DEV) {
    return 'http://localhost:8000';
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
 * Check if we're on a production domain but should be using localhost
 */
export const shouldRedirectToLocalhost = (): boolean => {
  if (typeof window === 'undefined') return false;

  const isProductionDomain =
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('onrender.com');

  return isProductionDomain && IS_DEV;
};

/**
 * Get the localhost URL for the current path
 */
export const getLocalhostUrl = (path: string = window.location.pathname): string => {
  const search = window.location.search;
  return `http://localhost:3000${path}${search}`;
};
