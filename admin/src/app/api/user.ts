import { API_URL } from './client';
import { apiRequest } from './client';

export interface AdminUser {
  _id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  isActive: boolean;
  refereeProfile?: { licenseNumber: string; yearsOfService: number };
  createdAt: string;
}

export interface UserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

export interface LoginResponse {
  user: AdminUser;
  accessToken: string;
}

export const userApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Login failed');
    return json.data as LoginResponse;
  },

  listByRole: (role: string, page = 1, limit = 50) => {
    const q = new URLSearchParams({ role, page: String(page), limit: String(limit) });
    return apiRequest<UserListResponse>(`/users?${q}`);
  },

  listReferees: (page = 1, limit = 50) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiRequest<{ jockeys: AdminUser[]; total: number }>(`/users/jockeys?${q}`);
  },
};

export const refereeAdminApi = {
  listReferees: async (page = 1, limit = 50): Promise<{ users: AdminUser[]; total: number }> => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    try {
      // Primary: dedicated referees endpoint
      return await apiRequest<{ users: AdminUser[]; total: number }>(`/users/referees?${q}`);
    } catch {
      // Fallback: generic users endpoint filtered by role
      const q2 = new URLSearchParams({ role: 'referee', page: String(page), limit: String(limit) });
      return apiRequest<{ users: AdminUser[]; total: number }>(`/users?${q2}`);
    }
  },
};
