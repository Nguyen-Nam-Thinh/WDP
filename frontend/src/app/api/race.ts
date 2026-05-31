import { API_URL } from "./auth";
import { fetchWithAuth } from "../utils/apiClient";

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
      throw new Error((errorData as any).message || "Failed to fetch races");
    }
    const json = await response.json();
    return json.data;
  },
};
