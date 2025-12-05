import { getApiUrl } from './env';

// Session management for cookie-based authentication
// Note: HttpOnly cookies cannot be read by JavaScript (by design for security)
// Cookies are sent automatically with requests, so we don't need to read them manually

const API_URL = getApiUrl();

export const session = {
  // Check if user is authenticated by making an API call
  // Since we can't read HttpOnly cookies, we verify via backend
  async isAuthenticated(retries: number = 2): Promise<boolean> {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(`${API_URL}/me`, {
          credentials: 'include', // Include cookies
        });
        if (response.ok) {
          return true;
        }
        // If not OK and not the last retry, wait a bit and retry
        if (i < retries) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch {
        // If error and not the last retry, wait a bit and retry
        if (i < retries) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    return false;
  },

  // Get user info from backend (cookies sent automatically)
  async getUser() {
    try {
      const response = await fetch(`${API_URL}/me`, {
        credentials: 'include', // Include cookies
      });
      if (response.ok) {
        const data = await response.json();
        return data.user || null;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Check if token is expired - requires API call since we can't read cookies
  async isTokenExpired(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/me`, {
        credentials: 'include', // Include cookies
      });
      return !response.ok; // If request fails, token is likely expired
    } catch {
      return true;
    }
  },

  // Clear session by calling backend logout endpoint (clears HttpOnly cookies)
  async clear() {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies so backend can clear them
      });
    } catch (error) {
      // Even if logout fails, continue - cookies may expire naturally
      console.warn('Logout request failed:', error);
    }
  },
};
