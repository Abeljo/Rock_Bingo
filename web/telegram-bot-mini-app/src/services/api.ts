import { Room, BingoCard, GameSession, Wallet, Transaction, Player } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const finalHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: finalHeaders,
    });

    if (!response.ok) {
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
  async authenticateTelegram(data: any) {
    return this.request('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

  async findOrCreateRoom(userId: string, betAmount: number): Promise<Room> {
    return this.request('/rooms/find-or-create', {
      method: 'POST',
      headers: { 'X-User-ID': userId },
      body: JSON.stringify({ bet_amount: betAmount }),
    });
  }

  async joinRoom(id: string, userId?: string) {
    return this.request(`/rooms/${id}/join`, { 
      method: 'POST',
      headers: userId ? { 'X-User-ID': userId } : {},
    });
  }

  async leaveRoom(id: string, userId?: string) {
    return this.request(`/rooms/${id}/leave`, { 
      method: 'POST',
      headers: userId ? { 'X-User-ID': userId } : {},
    });
  }

  async startRoom(id: string, userId?: string) {
    return this.request(`/rooms/${id}/start`, { 
      method: 'POST',
      headers: userId ? { 'X-User-ID': userId } : {},
    });
  }

  async getRoomPlayers(id: string): Promise<Player[]> {
    return this.request(`/rooms/${id}/players`);
  }

  async getRoomCards(id: string): Promise<BingoCard[]> {
    return this.request(`/rooms/${id}/cards`);
  }

  async getAvailableCards(roomId: string): Promise<any[]> {
    return this.request(`/rooms/${roomId}/available-cards`);
  }

  async selectCard(roomId: string, cardNumber: number, userId?: string): Promise<void> {
    return this.request(`/rooms/${roomId}/select-card`, {
      method: 'POST',
      headers: userId ? { 'X-User-ID': userId } : {},
      body: JSON.stringify({ card_number: cardNumber }),
    });
  }

  async getMyCard(roomId: string, userId?: string): Promise<any> {
    return this.request(`/rooms/${roomId}/my-card`, {
      headers: userId ? { 'X-User-ID': userId } : {},
    });
  }

  // Cards
  async createCard(roomId: string, userId?: string): Promise<BingoCard> {
    return this.request('/cards', {
      method: 'POST',
      headers: userId ? { 'X-User-ID': userId } : {},
      body: JSON.stringify({ room_id: roomId }),
    });
  }

  // Session
  async createSession(roomId: string, userId?: string): Promise<GameSession> {
    return this.request('/sessions', {
      method: 'POST',
      headers: userId ? { 'X-User-ID': userId } : {},
      body: JSON.stringify({ room_id: roomId }),
    });
  }

  async getSession(id: string): Promise<GameSession> {
    return this.request(`/sessions/${id}`);
  }

  async drawNumber(id: string, userId?: string): Promise<{ number: number }> {
    return this.request(`/sessions/${id}/draw`, { 
      method: 'POST',
      headers: userId ? { 'X-User-ID': userId } : {},
    });
  }

  async markNumber(sessionId: string, cardNumber: number, number: number, userId?: string): Promise<void> {
    return this.request(`/sessions/${sessionId}/mark`, {
      method: 'POST',
      headers: userId ? { 'X-User-ID': userId } : {},
      body: JSON.stringify({ card_number: cardNumber, number }),
    });
  }

  async claimBingo(sessionId: string, cardNumber: number, userId?: string): Promise<void> {
    return this.request(`/sessions/${sessionId}/bingo`, {
      method: 'POST',
      headers: userId ? { 'X-User-ID': userId } : {},
      body: JSON.stringify({ card_number: cardNumber }),
    });
  }

  async getWinners(id: string) {
    return this.request(`/sessions/${id}/winners`);
  }

  // Wallet
  async getWallet(userId?: string): Promise<Wallet> {
    return this.request('/wallet', userId ? { headers: { 'X-User-ID': userId } } : {});
  }

  async getTransactions(userId?: string): Promise<Transaction[]> {
    return this.request('/transactions', userId ? { headers: { 'X-User-ID': userId } } : {});
  }

  async deposit(userId: string, data: any) {
    return this.request('/deposit', {
      method: 'POST',
      headers: { 'X-User-ID': userId },
      body: JSON.stringify(data),
    });
  }

  async withdraw(userId: string, data: any) {
    return this.request('/withdraw', {
      method: 'POST',
      headers: { 'X-User-ID': userId },
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
}

export const apiService = new ApiService();