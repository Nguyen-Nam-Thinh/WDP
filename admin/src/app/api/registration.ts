import { apiRequest } from './client';
import type { Registration } from './race';

export interface RegistrationListResponse {
  registrations: Registration[];
  total: number;
  page: number;
  totalPages: number;
}

export const registrationApi = {
  list: (params: { page?: number; limit?: number; status?: string; raceId?: string } = {}) => {
    const q = new URLSearchParams({ page: String(params.page ?? 1), limit: String(params.limit ?? 20) });
    if (params.status) q.append('status', params.status);
    if (params.raceId) q.append('raceId', params.raceId);
    return apiRequest<RegistrationListResponse>(`/registrations?${q}`);
  },

  getById: (id: string) => apiRequest<Registration>(`/registrations/${id}`),
};
