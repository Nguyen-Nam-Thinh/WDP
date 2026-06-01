import { apiClient } from './client';
import { Race, RaceListResponse, RaceHorse } from '../../types';

export const raceService = {
  getRaces: async (params: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<RaceListResponse> => {
    const q = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    });
    if (params.status) q.append('status', params.status);
    const res = await apiClient.get(`/races?${q}`);
    return res.data.data;
  },

  getRaceById: async (id: string): Promise<Race> => {
    const res = await apiClient.get(`/races/${id}`);
    return res.data.data;
  },

  getRaceHorses: async (raceId: string): Promise<{ horses: RaceHorse[] }> => {
    const res = await apiClient.get(`/races/${raceId}/horses`);
    return res.data.data;
  },
};
