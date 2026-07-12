import { API_URL } from "./auth";
import { fetchWithAuth } from "../utils/apiClient";
import { getApiErrorMessage } from "../utils/errorMessages";

export interface Reward {
  _id: string;
  name: string;
  description: string;
  coinsRequired: number;
  imageUrl?: string;
  stock: number;
  isActive: boolean;
  type: 'voucher' | 'physical';
  voucherType?: 'external' | 'bet_multiplier' | 'coin_exchange';
  rewardMultiplier?: number;
  exchangeReceiveCoins?: number;
  maxPerUser?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Redemption {
  _id: string;
  userId: any; // or string
  rewardId: Reward;
  coinsSpent: number;
  status: 'pending' | 'completed' | 'cancelled';
  voucherCode: string | null;
  isUsed?: boolean;
  createdAt: string;
  updatedAt: string;
}

const authHeader = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const rewardApi = {
  getRewards: async (token: string): Promise<Reward[]> => {
    const response = await fetchWithAuth(`${API_URL}/rewards`, {
      headers: authHeader(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((errorData as any).message));
    }
    const json = await response.json();
    return json.data;
  },

  redeem: async (token: string, rewardId: string): Promise<Redemption> => {
    const response = await fetchWithAuth(`${API_URL}/rewards/${rewardId}/redeem`, {
      method: "POST",
      headers: authHeader(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((errorData as any).message));
    }
    const json = await response.json();
    return json.data;
  },

  getMyRedemptions: async (token: string): Promise<Redemption[]> => {
    const response = await fetchWithAuth(`${API_URL}/rewards/my-redemptions`, {
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
