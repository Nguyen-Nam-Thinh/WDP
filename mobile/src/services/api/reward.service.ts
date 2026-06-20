import { apiClient } from './client';
import { Reward, Redemption } from '../../types';

export const rewardService = {
  getRewards: async (): Promise<Reward[]> => {
    const res = await apiClient.get('/rewards');
    return res.data.data;
  },

  redeemReward: async (id: string): Promise<Redemption> => {
    const res = await apiClient.post(`/rewards/${id}/redeem`);
    return res.data.data;
  },

  getMyRedemptions: async (): Promise<Redemption[]> => {
    const res = await apiClient.get('/rewards/my-redemptions');
    return res.data.data;
  },
};
