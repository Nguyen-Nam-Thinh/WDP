import { API_URL } from './auth';
import { getApiErrorMessage } from '../utils/errorMessages';

export type NotificationType =
  | 'race_finished'
  | 'bet_won'
  | 'bet_lost'
  | 'bet_refunded'
  | 'invitation_received'
  | 'invitation_accepted'
  | 'invitation_rejected'
  | 'race_cancelled'
  | 'horse_grade_upgrade'
  | 'prize_received';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data: Record<string, any>;
  createdAt: string;
}

const h = (token: string | null | undefined) =>
  token ? { Authorization: `Bearer ${token}` } : {};

export const notificationApi = {
  getNotifications: async (
    token: string,
    params: { page?: number; limit?: number } = {},
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number; totalPages: number }> => {
    const q = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    });
    const res = await fetch(`${API_URL}/notifications?${q}`, { headers: h(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  getUnreadCount: async (token: string): Promise<number> => {
    const res = await fetch(`${API_URL}/notifications/unread-count`, { headers: h(token) });
    const json = await res.json();
    if (!res.ok) return 0;
    return json.data.unreadCount;
  },

  markRead: async (token: string, id: string): Promise<void> => {
    await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: h(token),
    });
  },

  markAllRead: async (token: string): Promise<void> => {
    await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: h(token),
    });
  },
};
