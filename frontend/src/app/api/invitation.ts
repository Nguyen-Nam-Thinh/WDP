import { API_URL } from "./auth";
import { fetchWithAuth } from "../utils/apiClient";
import { getApiErrorMessage } from "../utils/errorMessages";

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
  ownerId: { _id: string; fullName: string; email: string; avatarUrl?: string };
  jockeyId: { _id: string; fullName: string; email: string; avatarUrl?: string; jockeyProfile?: JockeyProfile };
  horseId: InvitationHorse;
  raceId: {
    _id: string;
    name: string;
    grade: string;
    scheduledTime: string;
    tournamentId: { _id: string; name: string };
    distance?: number;
    status?: string;
    purse?: number;
    registrationFee?: number;
  };
  status: "pending" | "accepted" | "rejected" | "cancelled" | "completed";
  agreedFee: number;
  message?: string;
  rejectionNote?: string;
  createdAt: string;
}

export interface JockeyProfile {
  experienceYears?: number;
  weight?: number;
  height?: number;
  winCount?: number;
  raceCount?: number;
  bio?: string;
  style?: "aggressive" | "balanced" | "conservative";
  isAvailable?: boolean;
  askingFeePerRace?: number;
}

export interface ForumJockey {
  _id: string;
  fullName: string;
  avatarUrl?: string;
  jockeyProfile: JockeyProfile;
}

export interface CreateInvitationData {
  jockeyId: string;
  horseId: string;
  raceId: string;
  agreedFee?: number;
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
      throw new Error(getApiErrorMessage((errorData as any).message));
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
      throw new Error(getApiErrorMessage((errorData as any).message));
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
      throw new Error(getApiErrorMessage((errorData as any).message));
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
      throw new Error(getApiErrorMessage((errorData as any).message));
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
      throw new Error(getApiErrorMessage((errorData as any).message));
    }
  },

  // Lấy danh sách jockey sẵn sàng cho thuê (diễn đàn)
  getForumJockeys: async (
    token: string,
    params: { page?: number; limit?: number; style?: string } = {},
  ): Promise<{ jockeys: ForumJockey[]; total: number; totalPages: number }> => {
    const query = new URLSearchParams();
    query.append("page", String(params.page ?? 1));
    query.append("limit", String(params.limit ?? 20));
    if (params.style) query.append("style", params.style);

    const response = await fetchWithAuth(`${API_URL}/invitations/forum?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((errorData as any).message));
    }
    const json = await response.json();
    return json.data;
  },
};

export const jockeyApi = {
  // Jockey cập nhật trạng thái sẵn sàng + giá thuê
  updateAvailability: async (
    token: string,
    data: { isAvailable: boolean; askingFeePerRace?: number },
  ): Promise<void> => {
    const response = await fetchWithAuth(`${API_URL}/users/me/availability`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((errorData as any).message));
    }
  },
};
