export const session = {
  save(access: string, refresh?: string) {
    // Save to localStorage for client-side access
    localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);

    // Also save to cookies for server-side access
    document.cookie = `access_token=${access}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
    if (refresh) {
      document.cookie = `refresh_token=${refresh}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=strict`;
    }
  },
  access() {
    return localStorage.getItem('access_token');
  },
  refresh() {
    return localStorage.getItem('refresh_token');
  },
  clear() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // Clear cookies
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  },
  // Check if user is authenticated
  isAuthenticated() {
    return !!this.access();
  },
  // Get user info from token (basic implementation)
  getUser() {
    const token = this.access();
    if (!token) return null;

    try {
      // Decode JWT token to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub,
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
      };
    } catch {
      return null;
    }
  },
  // Check if token is expired
  isTokenExpired() {
    const token = this.access();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch {
      return true;
    }
  },
};
