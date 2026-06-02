import { apiRequest } from './client';

export type BetType = 'win' | 'place' | 'show';
export type BetStatus = 'pending' | 'won' | 'lost' | 'cancelled' | 'refunded';

export interface Bet {
  _id: string;
  spectatorId: { _id: string; fullName: string; email: string } | string;
  raceId: { _id: string; name: string; grade: string; scheduledTime: string; status: string } | string;
  horseId: { _id: string; name: string; breed?: string; currentGrade?: string } | string;
  betType: BetType;
  amount: number;
  multiplier: number;
  status: BetStatus;
  payoutAmount: number;
  settledAt?: string;
  createdAt: string;
}

export interface BetListResponse {
  bets: Bet[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const BET_TYPE_LABEL: Record<string, string> = { win: 'Thắng (Hạng 1)', place: 'Hạng 2', show: 'Hạng 3' };
export const BET_STATUS_LABEL: Record<string, string> = { pending: 'Chờ', won: 'Thắng', lost: 'Thua', cancelled: 'Hủy', refunded: 'Đã hoàn' };
export const BET_STATUS_COLOR: Record<string, any> = { pending: 'warning', won: 'success', lost: 'error', cancelled: 'default', refunded: 'info' };

export const betAdminApi = {
  getAllBets: (params: { page?: number; limit?: number; status?: BetStatus; raceId?: string } = {}) => {
    const q = new URLSearchParams({ page: String(params.page ?? 1), limit: String(params.limit ?? 20) });
    if (params.status) q.append('status', params.status);
    if (params.raceId) q.append('raceId', params.raceId);
    return apiRequest<BetListResponse>(`/bets?${q}`);
  },

  getRaceBets: (raceId: string, page = 1, limit = 50) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiRequest<BetListResponse>(`/bets/race/${raceId}?${q}`);
  },

  settleBets: (raceId: string) =>
    apiRequest<{ settled: number; won: number; lost: number }>(
      `/bets/race/${raceId}/settle`,
      { method: 'POST' },
    ),
};
