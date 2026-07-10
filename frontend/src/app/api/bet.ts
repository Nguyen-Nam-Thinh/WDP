import { API_URL } from './auth';
import { getApiErrorMessage } from '../utils/errorMessages';

export type BetStatus = 'pending' | 'won' | 'lost' | 'cancelled' | 'refunded';

// ── Parimutuel Odds Types ────────────────────────────────────────────────────

export interface HorseOdds {
  horseId: string;
  horseName: string;
  winProb: number;             // % win probability (chỉ tham khảo)
  estimatedMultiplier: number; // odds ước tính từ pool hiện tại
  poolAmount: number;
  betCount: number;
  poolShare: number;           // % pool vào ngựa này
}

export interface RaceBettingOdds {
  raceId: string;
  totalPool: number;
  payoutPool: number;          // totalPool × 0.9 (sau rake 10%)
  rake: number;                // 10
  horses: HorseOdds[];
  updatedAt: string;
}

// ── Bet ──────────────────────────────────────────────────────────────────────

export interface Bet {
  _id: string;
  spectatorId: string;
  raceId: { _id: string; name: string; grade: string; scheduledTime: string; status: string; tournamentId?: string };
  horseId: { _id: string; name: string; breed?: string; currentGrade?: string; imageUrl?: string };
  // betType removed — parimutuel: chỉ cược vào ngựa về nhất
  amount: number;
  /** 0 khi pending, cập nhật thực khi race kết thúc */
  multiplier: number;
  /** odds ước tính lúc đặt (không lưu DB, đính kèm từ API response) */
  estimatedMultiplier?: number;
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

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Lấy estimated multiplier của ngựa từ odds data.
 * Fallback về 3x nếu không tìm thấy.
 */
export function getHorseEstimatedMultiplier(
  odds: RaceBettingOdds | null | undefined,
  horseId: string,
): number {
  if (!odds) return 3;
  const horse = odds.horses.find((h) => h.horseId === horseId);
  return horse?.estimatedMultiplier ?? 3;
}

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

// ── API ───────────────────────────────────────────────────────────────────────

export const betApi = {
  /**
   * Đặt cược vào ngựa (parimutuel — không cần betType).
   * Multiplier thực tế tính khi race kết thúc.
   */
  place: async (token: string, data: { raceId: string; horseId: string; amount: number }): Promise<Bet> => {
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
    return json.data as { settled: number; won: number; lost: number; totalPool: number; payoutPool: number };
  },

  getRaceOdds: async (token: string, raceId: string): Promise<RaceBettingOdds> => {
    const headers = authHeader(token);
    // Thử endpoint bets trực tiếp
    const betRes = await fetch(`${API_URL}/bets/race/${raceId}/odds`, { headers });
    const betJson = await betRes.json();
    if (!betRes.ok) throw new Error(getApiErrorMessage(betJson.message));
    return betJson.data;
  },
};
