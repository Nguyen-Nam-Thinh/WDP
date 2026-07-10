import { apiClient } from './client';
import { Bet, BetListResponse } from '../../types';

/** Shape của 1 horse trong response getRaceOdds */
export interface HorseOdds {
  horseId: string;
  horseName: string;
  winProb: number;          // % win probability (từ AI/stats, chỉ tham khảo)
  estimatedMultiplier: number; // odds ước tính dựa trên pool hiện tại
  poolAmount: number;       // tổng tiền cược vào ngựa này
  betCount: number;
  poolShare: number;        // % pool vào ngựa này
}

/** Response của getRaceOdds */
export interface RaceOddsResponse {
  raceId: string;
  totalPool: number;
  payoutPool: number;       // totalPool × 0.9 (sau rake 10%)
  rake: number;             // 10
  horses: HorseOdds[];
  updatedAt: string;
}

export const betService = {
  /**
   * Đặt cược vào ngựa.
   * Parimutuel Option B: không cần betType, multiplier = 0 lúc đặt.
   * API trả về estimatedMultiplier để hiển thị.
   */
  place: async (data: {
    raceId: string;
    horseId: string;
    amount: number;
  }): Promise<Bet> => {
    const res = await apiClient.post('/bets', data);
    return res.data.data;
  },

  getMyBets: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    raceId?: string;
  } = {}): Promise<BetListResponse> => {
    const q = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 30),
    });
    if (params.status) q.append('status', params.status);
    if (params.raceId) q.append('raceId', params.raceId);
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

  /** Lấy odds ước tính của từng ngựa trong race (real-time từ pool) */
  getRaceOdds: async (raceId: string): Promise<RaceOddsResponse> => {
    const res = await apiClient.get(`/bets/race/${raceId}/odds`);
    return res.data.data;
  },
};
