export const session = {
  save(access: string, refresh?: string) {
    localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
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
