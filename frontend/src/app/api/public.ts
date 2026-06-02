import { API_URL } from './auth';
import { getApiErrorMessage } from '../utils/errorMessages';

export interface LiveRace {
  _id: string;
  name: string;
  grade: string;
  status: 'running' | 'pre_check' | 'closed';
  distance: number;
  purse: number;
  scheduledTime: string;
  tournamentName: string;
}

export interface TopHorse {
  rank: number;
  _id: string;
  name: string;
  currentGrade: 'Maiden' | 'G3' | 'G2' | 'G1';
  totalPoints: number;
  winCount: number;
  raceCount: number;
  winRate: number;
}

export interface PlatformStats {
  ongoingTournaments: number;
  totalHorses: number;
  totalJockeys: number;
  totalSpectators: number;
  liveRaces: LiveRace[];
  topHorses: TopHorse[];
}

export const publicApi = {
  getPlatformStats: async (): Promise<PlatformStats> => {
    const res = await fetch(`${API_URL}/public/stats`);
    if (!res.ok) throw new Error(getApiErrorMessage(undefined));
    const json = await res.json();
    return json.data;
  },
};
