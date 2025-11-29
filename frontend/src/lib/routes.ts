// Routes that should NOT show the sidebar (unauthenticated routes)
export const EXCLUDED_SIDEBAR_ROUTES = [
  '/login',
  '/signup',
  '/onboarding',
  '/auth/callback',
  '/linkedin-connect',
  '/linkedin-connect/callback',
  '/welcome',
];

/**
 * Check if a given pathname should show the sidebar
 */
export function shouldShowSidebar(pathname: string | null): boolean {
  if (!pathname) return false;

  return !EXCLUDED_SIDEBAR_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
}
