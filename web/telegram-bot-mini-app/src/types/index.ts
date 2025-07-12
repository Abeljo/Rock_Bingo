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
}

export interface Room {
  id: string;
  bet_amount: number;
  current_players: number;
  max_players: number;
  status: 'waiting' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface BingoCard {
  id: string;
  user_id: string;
  room_id: string;
  card_data: {
    grid: number[][];
    marks: boolean[][];
  };
  is_winner: boolean;
  created_at: string;
}

export interface GameSession {
  id: string;
  room_id: string;
  session_start_time: string;
  session_end_time: string;
  status: 'active' | 'completed';
  drawn_numbers: number[];
  remaining_numbers: number[];
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdraw' | 'bet' | 'win';
  amount: number;
  created_at: string;
}

export interface Player {
  id: string;
  username: string;
  first_name: string;
}
