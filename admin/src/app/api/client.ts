import { getApiErrorMessage } from '../utils/errorMessages';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';

export function getToken(): string | null {
  return localStorage.getItem('adminToken');
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    },
  });

  const json = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(json.message));
  return json.data as T;
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(json.message));
  return json.data as T;
}
