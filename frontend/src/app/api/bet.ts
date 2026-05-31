import { API_URL } from './auth';

export type BetType = 'win' | 'place' | 'show';
export type BetStatus = 'pending' | 'won' | 'lost' | 'cancelled' | 'refunded';

export const BET_MULTIPLIERS: Record<BetType, number> = { win: 3, place: 2, show: 1.5 };
export const BET_TYPE_LABEL: Record<BetType, string> = {
  win: 'Thắng (Top 1) — 3.0x',
  place: 'Về Đích Top 2 — 2.0x',
  show: 'Về Đích Top 3 — 1.5x',
};

export interface Bet {
  _id: string;
  spectatorId: string;
  raceId: { _id: string; name: string; grade: string; scheduledTime: string; status: string; tournamentId?: string };
  horseId: { _id: string; name: string; breed?: string; currentGrade?: string; imageUrl?: string };
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

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const betApi = {
  place: async (token: string, data: { raceId: string; horseId: string; betType: BetType; amount: number }): Promise<Bet> => {
    const res = await fetch(`${API_URL}/bets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to place bet');
    return json.data;
  },

  getMyBets: async (
    token: string,
    params: { page?: number; limit?: number; status?: BetStatus; raceId?: string } = {},
  ): Promise<BetListResponse> => {
    const q = new URLSearchParams({ page: String(params.page ?? 1), limit: String(params.limit ?? 20) });
    if (params.status) q.append('status', params.status);
    if (params.raceId) q.append('raceId', params.raceId);
    const res = await fetch(`${API_URL}/bets?${q}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch bets');
    return json.data;
  },

  getById: async (token: string, id: string): Promise<Bet> => {
    const res = await fetch(`${API_URL}/bets/${id}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Bet not found');
    return json.data;
  },

  cancel: async (token: string, betId: string): Promise<Bet> => {
    const res = await fetch(`${API_URL}/bets/${betId}`, {
      method: 'DELETE',
      headers: authHeader(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to cancel bet');
    return json.data;
  },

  getRaceBets: async (token: string, raceId: string, page = 1, limit = 50) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await fetch(`${API_URL}/bets/race/${raceId}?${q}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch race bets');
    return json.data as BetListResponse;
  },

  settleBets: async (token: string, raceId: string) => {
    const res = await fetch(`${API_URL}/bets/race/${raceId}/settle`, {
      method: 'POST',
      headers: authHeader(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to settle bets');
    return json.data as { settled: number; won: number; lost: number };
  },
};
