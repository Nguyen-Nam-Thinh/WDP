import { apiRequest, apiUpload } from './client';

export interface Reward {
  _id: string;
  name: string;
  description: string;
  coinsRequired: number;
  imageUrl?: string;
  stock: number;
  isActive: boolean;
  type: 'voucher' | 'physical';
  createdAt: string;
  updatedAt: string;
}

export interface Redemption {
  _id: string;
  userId: { _id: string; fullName: string; email: string };
  rewardId: Reward | null;
  coinsSpent: number;
  status: 'pending' | 'completed' | 'cancelled';
  voucherCode: string;
  createdAt: string;
}

export const rewardApi = {
  listAll: () => {
    return apiRequest<Reward[]>('/rewards/admin');
  },

  create: (data: Omit<Reward, '_id' | 'createdAt' | 'updatedAt'>) =>
    apiRequest<Reward>('/rewards/admin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Omit<Reward, '_id' | 'createdAt' | 'updatedAt'>>) =>
    apiRequest<Reward>(`/rewards/admin/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<Reward>(`/rewards/admin/${id}`, {
      method: 'DELETE',
    }),

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiUpload<{ imageUrl: string }>('/rewards/admin/upload-image', formData);
  },

  listRedemptions: () => {
    return apiRequest<Redemption[]>('/rewards/admin/redemptions');
  },
};
