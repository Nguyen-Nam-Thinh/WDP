// Auth types
export interface User {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: 'owner' | 'jockey' | 'referee' | 'spectator' | 'admin';
  walletId?: { _id: string; balance: number };
  isActive: boolean;
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Race types
export type RaceStatus = 'open' | 'closed' | 'pre_check' | 'running' | 'finished' | 'cancelled';
export type RaceGrade = 'Maiden' | 'G3' | 'G2' | 'G1';

export interface Race {
  _id: string;
  tournamentId: string | { _id: string; name: string };
  name: string;
  grade: RaceGrade;
  maxCapacity: number;
  purse: number;
  registrationFee: number;
  scheduledTime: string;
  cutoffTime: string;
  distance: number;
  status: RaceStatus;
  refereeId?: string;
  eligibility?: {
    allowedGrades?: RaceGrade[];
    minPoints?: number;
    minAge?: number;
    maxAge?: number;
  };
}

export interface RaceHorse {
  _id: string;
  horseId: {
    _id: string;
    name: string;
    breed?: string;
    color?: string;
    currentGrade?: RaceGrade;
    imageUrl?: string;
    totalPoints?: number;
    winCount?: number;
    raceCount?: number;
  };
  jockeyId?: {
    _id: string;
    fullName: string;
    avatarUrl?: string;
  };
  status: string;
}

export interface RaceListResponse {
  races: Race[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Bet types
export type BetType = 'win' | 'place' | 'show';
export type BetStatus = 'pending' | 'won' | 'lost' | 'cancelled' | 'refunded';

export interface Bet {
  _id: string;
  spectatorId: string;
  raceId: { _id: string; name: string; grade: string; scheduledTime: string; status: string };
  horseId: { _id: string; name: string; breed?: string; currentGrade?: string };
  betType: BetType;
  amount: number;
  multiplier: number;
  status: BetStatus;
  payoutAmount: number;
  settledAt?: string;
  createdAt: string;
}

export interface BetListResponse {
  bets: Bet[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Wallet & Transaction types
export interface Wallet {
  _id: string;
  userId: string;
  balance: number;
  updatedAt: string;
}

export type TransactionType =
  | 'topup'
  | 'registration_fee'
  | 'registration_refund'
  | 'prize_payout'
  | 'bet_placed'
  | 'bet_payout'
  | 'bet_refund';

export interface Transaction {
  _id: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description?: string;
  relatedId?: string;
  createdAt: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tournament types
export interface Tournament {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'finished' | 'cancelled';
}
