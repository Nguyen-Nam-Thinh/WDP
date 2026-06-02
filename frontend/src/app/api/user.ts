import { API_URL } from "./auth";
import { fetchWithAuth } from "../utils/apiClient";
import { getApiErrorMessage } from "../utils/errorMessages";

export interface UserProfile {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  walletId?: {
    _id: string;
    balance: number;
  };
  jockeyProfile?: {
    experienceYears: number;
    weight: number;
    height: number;
    winCount: number;
    raceCount: number;
    bio?: string;
  };
  refereeProfile?: {
    licenseNumber: string;
    yearsOfService: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JockeyListItem {
  _id: string;
  fullName: string;
  avatarUrl?: string;
  isActive: boolean;
  jockeyProfile?: {
    experienceYears: number;
    winCount: number;
    raceCount: number;
    weight: number;
    height: number;
    bio?: string;
  };
}

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  jockeyProfile?: {
    experienceYears?: number;
    weight?: number;
    height?: number;
    bio?: string;
  };
  refereeProfile?: {
    licenseNumber?: string;
    yearsOfService?: number;
  };
}

const authHeader = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const userApi = {
  getMe: async (token: string): Promise<UserProfile> => {
    const response = await fetchWithAuth(`${API_URL}/users/me`, {
      headers: authHeader(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((errorData as any).message));
    }
    const json = await response.json();
    return json.data;
  },

  updateMe: async (
    token: string,
    data: UpdateProfileData,
  ): Promise<UserProfile> => {
    const response = await fetchWithAuth(`${API_URL}/users/me`, {
      method: "PATCH",
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

  getMyWallet: async (token: string) => {
    const response = await fetchWithAuth(`${API_URL}/users/me/wallet`, {
      headers: authHeader(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((errorData as any).message));
    }
    const json = await response.json();
    return json.data;
  },

  getMyTransactions: async (token: string, page = 1, limit = 20) => {
    const response = await fetchWithAuth(
      `${API_URL}/users/me/transactions?page=${page}&limit=${limit}`,
      { headers: authHeader(token) },
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((errorData as any).message));
    }
    const json = await response.json();
    return json.data;
  },

  getJockeys: async (
    token: string,
    page = 1,
    limit = 20,
  ): Promise<{ jockeys: JockeyListItem[]; total: number; page: number; limit: number }> => {
    const response = await fetchWithAuth(
      `${API_URL}/users/jockeys?page=${page}&limit=${limit}`,
      { headers: authHeader(token) },
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((errorData as any).message));
    }
    const json = await response.json();
    return json.data;
  },

  uploadAvatar: async (token: string, file: File): Promise<UserProfile> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetchWithAuth(`${API_URL}/users/me/upload-avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((errorData as any).message));
    }
    const json = await response.json();
    return json.data;
  },
};
