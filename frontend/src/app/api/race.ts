import { API_URL } from "./auth";
import { fetchWithAuth } from "../utils/apiClient";
import { getApiErrorMessage } from "../utils/errorMessages";

export interface RaceResultEntry {
  _id: string;
  position: number;
  horseId: { _id: string; name: string; breed?: string; currentGrade: string; primaryImageUrl?: string };
  jockeyId?: { _id: string; fullName: string; jockeyProfile?: { winCount: number; raceCount: number } } | null;
  finishTime: number;
  prizeAmount: number;
  pointsEarned: number;
}

export interface RaceEligibility {
  allowedGrades: ("Maiden" | "G3" | "G2" | "G1")[];
  minPoints: number;
  minAge: number;
  maxAge: number;
}

export interface Race {
  _id: string;
  tournamentId: string;
  name: string;
  grade: "Maiden" | "G3" | "G2" | "G1";
  maxCapacity: number;
  purse: number;
  registrationFee: number;
  scheduledTime: string;
  cutoffTime: string;
  distance: number;
  eligibility: RaceEligibility;
  status: "open" | "closed" | "pre_check" | "running" | "finished" | "cancelled";
}

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const raceApi = {
  getRaces: async (
    token: string,
    params: { tournamentId?: string; status?: string; page?: number; limit?: number },
  ): Promise<{ races: Race[]; total: number }> => {
    const query = new URLSearchParams();
    if (params.tournamentId) query.append("tournamentId", params.tournamentId);
    if (params.status) query.append("status", params.status);
    query.append("page", String(params.page ?? 1));
    query.append("limit", String(params.limit ?? 50));

    const response = await fetchWithAuth(`${API_URL}/races?${query}`, {
      headers: authHeader(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((errorData as any).message));
    }
    const json = await response.json();
    return json.data;
  },

  getRaceById: async (token: string, id: string): Promise<Race> => {
    const res = await fetch(`${API_URL}/races/${id}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  getRaceRegistrations: async (
    token: string,
    raceId: string,
    params: { page?: number; limit?: number } = {},
  ): Promise<{ registrations: any[]; total: number }> => {
    const q = new URLSearchParams({ page: String(params.page ?? 1), limit: String(params.limit ?? 50) });
    const res = await fetch(`${API_URL}/races/${raceId}/registrations?${q}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  // Public horse list for betting (spectator-safe — no owner/fee data)
  getRaceHorses: async (token: string, raceId: string): Promise<{
    race: Race;
    horses: Array<{
      registrationId: string;
      horseId: string;
      horseName: string;
      breed?: string;
      gender?: string;
      currentGrade: string;
      totalPoints: number;
      winRate: number;
      imageUrl?: string;
      jockeyId?: string;
      jockeyName?: string;
      jockeyExperience?: number;
    }>;
    total: number;
  }> => {
    const res = await fetch(`${API_URL}/races/${raceId}/horses`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  forceSimulate: async (token: string, raceId: string): Promise<{ message: string; raceId: string }> => {
    const res = await fetchWithAuth(`${API_URL}/races/${raceId}/force-simulate`, {
      method: 'POST',
      headers: authHeader(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  getRaceResults: async (token: string, raceId: string): Promise<{ race: Race; results: RaceResultEntry[] }> => {
    const res = await fetchWithAuth(`${API_URL}/races/${raceId}/results`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },
};
