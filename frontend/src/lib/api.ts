import { getApiUrl } from './env';

export const API_URL = getApiUrl();

// API utilities for cookie-based authentication
// Cookies (including HttpOnly) are sent automatically with credentials: 'include'

export async function postJSON(path: string, body: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies (HttpOnly cookies sent automatically)
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getJSON(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include', // Include cookies (HttpOnly cookies sent automatically)
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
