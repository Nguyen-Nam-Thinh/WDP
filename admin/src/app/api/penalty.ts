import { apiRequest } from './client';
import type { Race } from './race';

export interface PenaltyTicket {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
  } | string;
  raceId: Race | string;
  horseId?: {
    _id: string;
    name: string;
    currentGrade?: string;
  } | string;
  amount: number;
  status: 'open' | 'paid' | 'waived';
  note: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetAllPenaltiesResponse {
  tickets: PenaltyTicket[];
  total: number;
  totalAmount: number;
  page: number;
  totalPages: number;
}

export const penaltyApi = {
  getAll: (params: { page: number; limit: number; status?: string; raceId?: string }) => {
    const searchParams = new URLSearchParams();
    searchParams.append('page', params.page.toString());
    searchParams.append('limit', params.limit.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.raceId) searchParams.append('raceId', params.raceId);

    return apiRequest<GetAllPenaltiesResponse>(`/penalties?${searchParams.toString()}`);
  },
};
