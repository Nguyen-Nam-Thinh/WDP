import { apiClient } from './client';
import { LoginResponse } from '../../types';

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data.data;
  },

  register: async (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: 'spectator';
  }): Promise<LoginResponse> => {
    const res = await apiClient.post('/auth/register', data);
    return res.data.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data.data;
  },

  verifyResetCode: async (email: string, code: string): Promise<{ resetToken: string }> => {
    const res = await apiClient.post('/auth/verify-reset-code', { email, code });
    return res.data.data;
  },

  resetPassword: async (resetToken: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { resetToken, newPassword });
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout').catch(() => {});
  },
};
