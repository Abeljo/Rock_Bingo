export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number;
  hash?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    query_id?: string;
    auth_date?: number;
    hash?: string;
    [key: string]: any;
  };
  close: () => void;
  sendData: (data: string) => void;
  expand: () => void;
  isExpanded: boolean;
  themeParams: Record<string, string>;
  colorScheme: string;
}

export interface User {
  id: string;
  telegram_id: number;
  username: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  max_players: number;
  current_players: number;
  entry_fee: number;
  prize_pool: number;
  status: 'waiting' | 'active' | 'completed';
  created_at: string;
  started_at?: string;
}

export interface BingoCard {
  id: string;
  numbers: number[][];
  marked: boolean[][];
  user_id: string;
  room_id: string;
}

export interface GameSession {
  id: string;
  room_id: string;
  called_numbers: number[];
  current_number?: number;
  status: 'active' | 'completed';
  winners: string[];
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdraw' | 'bet' | 'win';
  amount: number;
  description: string;
  created_at: string;
}

export interface Player {
  id: string;
  user_id: string;
  username: string;
  first_name: string;
  cards_count: number;
  is_winner: boolean;
}