import { API_URL } from "./auth";
import { fetchWithAuth } from "../utils/apiClient";
import { getApiErrorMessage } from "../utils/errorMessages";

export interface Tournament {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "ongoing" | "finished" | "cancelled";
  isActive: boolean;
}

const authHeader = (token?: string | null) =>
  token ? { Authorization: `Bearer ${token}` } : {};

export const tournamentApi = {
  getTournaments: async (
    token: string | null | undefined,
    page = 1,
    limit = 50,
  ): Promise<{ tournaments: Tournament[]; total: number }> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const response = await fetchWithAuth(`${API_URL}/tournaments?${params}`, {
      headers: authHeader(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((errorData as any).message));
    }
    const json = await response.json();
    return json.data;
  },
};
