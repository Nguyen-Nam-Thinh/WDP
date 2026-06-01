import { apiClient } from './client';
import { Bet, BetListResponse, BetType } from '../../types';

export const betService = {
  place: async (data: {
    raceId: string;
    horseId: string;
    betType: BetType;
    amount: number;
  }): Promise<Bet> => {
    const res = await apiClient.post('/bets', data);
    return res.data.data;
  },

  getMyBets: async (params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<BetListResponse> => {
    const q = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 30),
    });
    if (params.status) q.append('status', params.status);
    const res = await apiClient.get(`/bets?${q}`);
    return res.data.data;
  },

  getById: async (id: string): Promise<Bet> => {
    const res = await apiClient.get(`/bets/${id}`);
    return res.data.data;
  },

  cancel: async (betId: string): Promise<Bet> => {
    const res = await apiClient.delete(`/bets/${betId}`);
    return res.data.data;
  },
};
