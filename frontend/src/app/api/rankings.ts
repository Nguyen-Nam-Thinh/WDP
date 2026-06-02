import { API_URL } from "./auth";
import { fetchWithAuth } from "../utils/apiClient";
import { getApiErrorMessage } from "../utils/errorMessages";

export interface HorseRanking {
  rank: number;
  _id: string;
  name: string;
  owner: string;
  currentGrade: 'Maiden' | 'G3' | 'G2' | 'G1';
  totalPoints: number;
  totalEarnings: number;
  raceCount: number;
  winCount: number;
  winRate: number;
}

export interface JockeyRanking {
  rank: number;
  _id: string;
  name: string;
  winCount: number;
  raceCount: number;
  experienceYears: number;
  winRate: number;
}

export interface OwnerRanking {
  rank: number;
  _id: string;
  name: string;
  totalHorses: number;
  totalWins: number;
  totalRaces: number;
  totalEarnings: number;
  winRate: number;
}

export interface SpectatorRanking {
  rank: number;
  _id: string;
  name: string;
  totalBets: number;
  wonBets: number;
  totalPayout: number;
  totalBetAmount: number;
  winRate: number;
  profit: number;
}

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const rankingsApi = {
  getHorseRankings: async (token: string, limit = 20): Promise<HorseRanking[]> => {
    const res = await fetchWithAuth(`${API_URL}/rankings/horses?limit=${limit}`, {
      headers: authHeader(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((err as any).message));
    }
    const json = await res.json();
    return json.data;
  },

  getJockeyRankings: async (token: string, limit = 20): Promise<JockeyRanking[]> => {
    const res = await fetchWithAuth(`${API_URL}/rankings/jockeys?limit=${limit}`, {
      headers: authHeader(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((err as any).message));
    }
    const json = await res.json();
    return json.data;
  },

  getOwnerRankings: async (token: string, limit = 20): Promise<OwnerRanking[]> => {
    const res = await fetchWithAuth(`${API_URL}/rankings/owners?limit=${limit}`, {
      headers: authHeader(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((err as any).message));
    }
    const json = await res.json();
    return json.data;
  },

  getSpectatorLeaderboard: async (token: string, limit = 20): Promise<SpectatorRanking[]> => {
    const res = await fetchWithAuth(`${API_URL}/rankings/spectators?limit=${limit}`, {
      headers: authHeader(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((err as any).message));
    }
    const json = await res.json();
    return json.data;
  },
};
