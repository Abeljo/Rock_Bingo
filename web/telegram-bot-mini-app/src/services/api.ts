import { Room, BingoCard, GameSession, Wallet, Transaction, Player, User } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  private user: User | null = null;

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.user) {
      headers['X-User-ID'] = this.user.id.toString();
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // For 404 errors on GET requests, return null instead of throwing
      if (response.status === 404 && (options.method === 'GET' || !options.method)) {
        return null;
      }
      
      const errorText = await response.text();
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        if (errorText) {
          errorMessage = errorText;
        }
      }
      throw new Error(errorMessage);
    }
    // If response is 204 No Content, return null
    if (response.status === 204) {
      return null;
    }
    const text = await response.text();
    if (!text) {
      // For GET requests, return empty array instead of null
      if (options.method === 'GET' || !options.method) {
        return [];
      }
      return null;
    }
    return JSON.parse(text);
  }

  // Auth
  setAuthUser(user: User) {
    this.user = user;
  }

  async authenticateTelegram(data: any) {
    const user = await this.request('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (user) {
      this.setAuthUser(user);
    }
    return user;
  }

  // Profile
  async getProfile() {
    return this.request('/user/me');
  }

  async updateProfile(data: any) {
    return this.request('/user/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Rooms
  async createRoom(data: any): Promise<Room> {
    return this.request('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRooms(): Promise<Room[]> {
    return this.request('/rooms');
  }

  async getRoom(id: string): Promise<Room> {
    return this.request(`/rooms/${id}`);
  }

  async findOrCreateRoom(betAmount: number): Promise<Room> {
    return this.request('/rooms/find-or-create', {
      method: 'POST',
      body: JSON.stringify({ bet_amount: betAmount }),
    });
  }

  async joinRoom(id: string) {
    return this.request(`/rooms/${id}/join`, { 
      method: 'POST',
    });
  }

  async leaveRoom(id: string) {
    return this.request(`/rooms/${id}/leave`, { 
      method: 'POST',
    });
  }

  async startRoom(id: string) {
    return this.request(`/rooms/${id}/start`, { 
      method: 'POST',
    });
  }

  async getRoomPlayers(id: string): Promise<Player[]> {
    return this.request(`/rooms/${id}/players`);
  }

  async getRoomCountdown(id: string): Promise<any> {
    return this.request(`/rooms/${id}/countdown`);
  }

  async getRoomCards(id: string): Promise<BingoCard[]> {
    return this.request(`/rooms/${id}/cards`);
  }

  async getAvailableCards(roomId: string): Promise<any[]> {
    return this.request(`/rooms/${roomId}/available-cards`);
  }

  async selectCard(roomId: string, cardNumber: number): Promise<void> {
    return this.request(`/rooms/${roomId}/select-card`, {
      method: 'POST',
      body: JSON.stringify({ card_number: cardNumber }),
    });
  }

  async getMyCard(roomId: string): Promise<any> {
    try {
      return await this.request(`/rooms/${roomId}/my-card`);
    } catch (error) {
      // 404 is expected when no card is selected yet
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  // Cards
  async createCard(roomId: string): Promise<BingoCard> {
    return this.request('/cards', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId }),
    });
  }

  // Session
  async createSession(roomId: string): Promise<GameSession> {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId }),
    });
  }

  async getSession(id: string): Promise<GameSession> {
    return this.request(`/sessions/${id}`);
  }

  async drawNumber(id: string): Promise<{ number: number }> {
    return this.request(`/sessions/${id}/draw`, { 
      method: 'POST',
    });
  }

  async autoDrawNumber(id: string): Promise<{ number: number }> {
    return this.request(`/sessions/${id}/auto-draw`, { 
      method: 'POST',
    });
  }

  async markNumber(sessionId: string, cardNumber: number, number: number): Promise<void> {
    return this.request(`/sessions/${sessionId}/mark`, {
      method: 'POST',
      body: JSON.stringify({ card_number: cardNumber, number }),
    });
  }

  async claimBingo(sessionId: string, cardNumber: number): Promise<void> {
    return this.request(`/sessions/${sessionId}/bingo`, {
      method: 'POST',
      body: JSON.stringify({ card_number: cardNumber }),
    });
  }

  async getWinners(id: string) {
    return this.request(`/sessions/${id}/winners`);
  }

  // Wallet
  async getWallet(): Promise<Wallet> {
    return this.request('/wallet');
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.request('/transactions');
  }

  async deposit(data: any) {
    return this.request('/deposit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async withdraw(data: any) {
    return this.request('/withdraw', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Health
  async getHealth() {
    return this.request('/health');
  }

  async getVersion() {
    return this.request('/version');
  }

  async getRoomSession(roomId: string): Promise<any> {
    try {
      return await this.request(`/rooms/${roomId}/session`);
    } catch (error) {
      // 404 is expected when no session exists yet
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }
}

export const apiService = new ApiService();
