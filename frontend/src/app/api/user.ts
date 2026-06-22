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
    style?: 'aggressive' | 'balanced' | 'conservative';
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
    style?: 'aggressive' | 'balanced' | 'conservative';
  };
}

export interface Transaction {
  _id: string;
  type: 'topup' | 'registration_fee' | 'registration_refund' | 'prize_payout' | 'bet_placed' | 'bet_payout' | 'bet_refund';
  amount: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

export interface OwnerRaceResult {
  _id: string;
  raceId: { _id: string; name: string; grade: string; scheduledTime: string; purse: number; distance: number };
  horseId: { _id: string; name: string; breed?: string; currentGrade: string };
  jockeyId?: { _id: string; fullName: string } | null;
  position: number;
  finishTime: number;
  prizeAmount: number;
  pointsEarned: number;
  createdAt: string;
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
    style?: 'aggressive' | 'balanced' | 'conservative';
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

export interface MonthlyStatPoint {
  month: string;
  earnings: number;
  wins: number;
  races: number;
}

export interface OwnerOverview {
  totalHorses: number;
  totalWins: number;
  totalEarnings: number;
  totalRaces: number;
  walletBalance: number;
  recentResults: OwnerRaceResult[];
}

export interface JockeyOverview {
  pendingInvitations: number;
  upcomingRaces: any[];
  totalWins: number;
  totalRaces: number;
  walletBalance: number;
  recentResults: any[];
}

export interface RefereeOverview {
  assignedRacesCount: number;
  pendingChecks: number;
  totalIncidents: number;
  submittedReports: number;
  upcomingRaces: any[];
  recentReports: any[];
}

export interface SpectatorOverview {
  pendingBets: number;
  wonBets: number;
  lostBets: number;
  totalBets: number;
  totalWinnings: number;
  winRate: number;
  walletBalance: number;
  recentBets: any[];
}

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

  getMyTransactions: async (token: string, page = 1, limit = 10): Promise<{ transactions: Transaction[]; total: number; page: number; limit: number }> => {
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

  getMyRaceResults: async (token: string, page = 1, limit = 10): Promise<{ results: OwnerRaceResult[]; total: number; page: number; limit: number; totalPages: number }> => {
    const response = await fetchWithAuth(
      `${API_URL}/users/me/race-results?page=${page}&limit=${limit}`,
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

  getOverviewStats: async (token: string): Promise<OwnerOverview & JockeyOverview & RefereeOverview & SpectatorOverview> => {
    const response = await fetchWithAuth(`${API_URL}/users/me/overview`, {
      headers: authHeader(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((errorData as any).message));
    }
    const json = await response.json();
    return json.data;
  },

  getMonthlyStats: async (token: string): Promise<{ monthly: MonthlyStatPoint[] }> => {
    const response = await fetchWithAuth(`${API_URL}/users/me/monthly-stats`, {
      headers: authHeader(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((errorData as any).message));
    }
    const json = await response.json();
    return json.data;
  },

  createTopup: async (token: string, coins: number): Promise<{ url: string; sessionId: string }> => {
    const response = await fetchWithAuth(`${API_URL}/users/me/topup`, {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify({ coins }),
    });
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
