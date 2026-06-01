import { API_URL } from './client';
import { apiRequest } from './client';

export interface AdminUser {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'owner' | 'jockey' | 'referee' | 'spectator' | 'admin';
  avatarUrl?: string;
  isActive: boolean;
  jockeyProfile?: {
    experienceYears: number;
    weight: number;
    height: number;
    winCount: number;
    raceCount: number;
    bio?: string;
  };
  refereeProfile?: { licenseNumber: string; yearsOfService: number };
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginResponse {
  user: AdminUser;
  accessToken: string;
}

export const userApi = {
  /** Đăng nhập admin */
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

  /** Lấy danh sách user với phân trang và lọc theo role */
  getUsers: (params: { role?: string; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.role) q.set('role', params.role);
    q.set('page', String(params.page ?? 1));
    q.set('limit', String(params.limit ?? 20));
    return apiRequest<UserListResponse>(`/users?${q}`);
  },

  /** Lấy danh sách theo role (dùng cho backward compatibility) */
  listByRole: (role: string, page = 1, limit = 50) => {
    const q = new URLSearchParams({ role, page: String(page), limit: String(limit) });
    return apiRequest<UserListResponse>(`/users?${q}`);
  },

  /** Toggle trạng thái active/inactive của user */
  toggleActive: (userId: string) =>
    apiRequest<AdminUser>(`/users/${userId}/toggle-active`, { method: 'PATCH' }),

  /** Admin cập nhật thông tin user (fullName, phone, role, isActive) */
  updateUser: (userId: string, data: Partial<Pick<AdminUser, 'fullName' | 'phone' | 'role' | 'isActive'>>) =>
    apiRequest<AdminUser>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /** Lấy danh sách trọng tài */
  listReferees: (page = 1, limit = 50) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiRequest<{ users: AdminUser[]; total: number; totalPages: number }>(`/users/referees?${q}`);
  },

  /** Lấy danh sách jockey */
  listJockeys: (page = 1, limit = 50) => {
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
