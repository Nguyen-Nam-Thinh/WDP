import { API_URL } from "./auth";
import { fetchWithAuth } from "../utils/apiClient";

export interface InvitationHorse {
  _id: string;
  name: string;
  breed?: string;
  gender?: "male" | "female";
  birthDate?: string;
  weight?: number;
  color?: string;
  primaryImageUrl?: string;
  imageUrls?: string[];
  currentGrade: "Maiden" | "G3" | "G2" | "G1";
  totalPoints?: number;
  totalEarnings?: number;
  raceCount?: number;
  winCount?: number;
  violations?: { name: string; handling?: string; penaltyDate?: string; note?: string }[];
  isActive?: boolean;
}

export interface JockeyInvitation {
  _id: string;
  ownerId: { _id: string; fullName: string; email: string };
  jockeyId: { _id: string; fullName: string; email: string };
  horseId: InvitationHorse;
  raceId: {
    _id: string;
    name: string;
    grade: string;
    scheduledTime: string;
    tournamentId: { _id: string; name: string };
    distance?: number;
    status?: string;
  };
  status: "pending" | "accepted" | "rejected" | "cancelled";
  message?: string;
  rejectionNote?: string;
  createdAt: string;
}

export interface CreateInvitationData {
  jockeyId: string;
  horseId: string;
  raceId: string;
  message?: string;
}

const authHeader = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const invitationApi = {
  createInvitation: async (
    token: string,
    data: CreateInvitationData,
  ): Promise<JockeyInvitation> => {
    const response = await fetchWithAuth(`${API_URL}/invitations`, {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).message || "Failed to send invitation");
    }
    const json = await response.json();
    return json.data;
  },

  getInvitations: async (
    token: string,
    params: { page?: number; limit?: number; status?: string } = {},
  ): Promise<{ invitations: JockeyInvitation[]; total: number; totalPages: number }> => {
    const query = new URLSearchParams();
    query.append("page", String(params.page ?? 1));
    query.append("limit", String(params.limit ?? 10));
    if (params.status) query.append("status", params.status);

    const response = await fetchWithAuth(`${API_URL}/invitations?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).message || "Failed to fetch invitations");
    }
    const json = await response.json();
    return json.data;
  },

  acceptInvitation: async (token: string, invitationId: string): Promise<JockeyInvitation> => {
    const response = await fetchWithAuth(`${API_URL}/invitations/${invitationId}/accept`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).message || "Failed to accept invitation");
    }
    const json = await response.json();
    return json.data;
  },

  rejectInvitation: async (
    token: string,
    invitationId: string,
    rejectionNote?: string,
  ): Promise<JockeyInvitation> => {
    const response = await fetchWithAuth(`${API_URL}/invitations/${invitationId}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rejectionNote }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).message || "Failed to reject invitation");
    }
    const json = await response.json();
    return json.data;
  },

  cancelInvitation: async (token: string, invitationId: string): Promise<void> => {
    const response = await fetchWithAuth(`${API_URL}/invitations/${invitationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).message || "Failed to cancel invitation");
    }
  },
};
