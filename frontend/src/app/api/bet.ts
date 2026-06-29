import { API_URL } from './auth';
import { getApiErrorMessage } from '../utils/errorMessages';

export type BetType = 'win' | 'place' | 'show';
export type BetStatus = 'pending' | 'won' | 'lost' | 'cancelled' | 'refunded';

export const BET_BASE_ODDS: Record<BetType, number> = { win: 3, place: 2, show: 1.5 };
/** @deprecated Use dynamic odds from getRaceOdds — kept as fallback display */
export const BET_MULTIPLIERS = BET_BASE_ODDS;

export const BET_TYPE_LABEL: Record<BetType, string> = {
  win: 'Thắng (Hạng 1)',
  place: 'Về Nhì (Hạng 2)',
  show: 'Về Ba (Hạng 3)',
};

export interface HorseBetOdds {
  multiplier: number;
  poolAmount: number;
  poolShare: number;
  betCount: number;
  impliedProb: number;
}

export interface RaceHorseOdds {
  horseId: string;
  horseName: string;
  odds: Record<BetType, HorseBetOdds>;
}

export interface RaceBettingOdds {
  raceId: string;
  totalsByType: Partial<Record<BetType, number>>;
  horses: RaceHorseOdds[];
  updatedAt: string;
}

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
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
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
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  getById: async (token: string, id: string): Promise<Bet> => {
    const res = await fetch(`${API_URL}/bets/${id}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  cancel: async (token: string, betId: string): Promise<Bet> => {
    const res = await fetch(`${API_URL}/bets/${betId}`, {
      method: 'DELETE',
      headers: authHeader(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  getRaceBets: async (token: string, raceId: string, page = 1, limit = 50) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await fetch(`${API_URL}/bets/race/${raceId}?${q}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data as BetListResponse;
  },

  settleBets: async (token: string, raceId: string) => {
    const res = await fetch(`${API_URL}/bets/race/${raceId}/settle`, {
      method: 'POST',
      headers: authHeader(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data as { settled: number; won: number; lost: number };
  },

  getRaceOdds: async (token: string, raceId: string): Promise<RaceBettingOdds> => {
    const res = await fetch(`${API_URL}/bets/race/${raceId}/odds`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },
};
