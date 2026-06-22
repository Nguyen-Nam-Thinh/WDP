import { apiClient } from './client';
import { User, Wallet, Transaction, TransactionListResponse } from '../../types';

export const userService = {
  getMe: async (): Promise<User> => {
    const res = await apiClient.get('/users/me');
    return res.data.data;
  },

  updateMe: async (data: { fullName?: string; phone?: string }): Promise<User> => {
    const res = await apiClient.patch('/users/me', data);
    return res.data.data;
  },

  getMyWallet: async (): Promise<Wallet> => {
    const res = await apiClient.get('/users/me/wallet');
    return res.data.data;
  },

  getMyTransactions: async (
    page = 1,
    limit = 20,
  ): Promise<TransactionListResponse> => {
    const res = await apiClient.get(`/users/me/transactions?page=${page}&limit=${limit}`);
    return res.data.data;
  },

  createTopup: async (coins: number): Promise<{ url: string; sessionId: string }> => {
    const res = await apiClient.post('/users/me/topup', { coins });
    return res.data.data;
  },

  uploadAvatar: async (file: { uri: string; name: string; type: string }): Promise<User> => {
    const formData = new FormData();
    formData.append('file', file as any);
    const res = await apiClient.post('/users/me/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },
};
