import { apiRequest } from './client';

export interface Tournament {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'finished' | 'cancelled';
  isActive: boolean;
  createdBy?: { fullName: string; email: string };
  createdAt: string;
}

export interface TournamentListResponse {
  tournaments: Tournament[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateTournamentData {
  name: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
}

export const tournamentApi = {
  list: (page = 1, limit = 20, status?: string) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) q.append('status', status);
    return apiRequest<TournamentListResponse>(`/tournaments?${q}`);
  },

  create: (data: CreateTournamentData) =>
    apiRequest<Tournament>('/tournaments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateTournamentData> & { status?: string }) =>
    apiRequest<Tournament>(`/tournaments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<Tournament>(`/tournaments/${id}`, { method: 'DELETE' }),
};
