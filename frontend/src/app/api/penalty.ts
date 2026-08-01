import { API_URL } from './auth';
import { getApiErrorMessage } from '../utils/errorMessages';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export interface PenaltyTicket {
  _id: string;
  userId: string;
  raceId: { _id: string; name: string; grade?: string; isOfficial?: boolean } | string;
  horseId?: { _id: string; name: string } | string | null;
  amount: number;
  status: 'open' | 'paid' | 'waived';
  note?: string;
  paidAt?: string | null;
  createdAt: string;
}

export const penaltyApi = {
  listMine: async (token: string, status?: string): Promise<PenaltyTicket[]> => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${API_URL}/penalties/me${q}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data?.tickets || [];
  },

  pay: async (token: string, ticketId: string): Promise<PenaltyTicket> => {
    const res = await fetch(`${API_URL}/penalties/${ticketId}/pay`, {
      method: 'POST',
      headers: authHeader(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },
};
