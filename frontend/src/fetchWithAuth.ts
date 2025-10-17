// fetchWithAuth.ts - wrapper for fetch that adds JWT and handles 401
import { useAuth } from './components/AuthContext';

export async function fetchWithAuth(url: string, options: any = {}, token: string | null = null) {
  const headers = options.headers || {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  options.headers = headers;
  const res = await fetch(url, options);
  if (res.status === 401) {
    // Optionally, trigger logout or redirect
    window.location.href = '/';
    throw new Error('Unauthorized');
  }
  return res;
}
