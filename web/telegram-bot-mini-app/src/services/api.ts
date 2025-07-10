import { Room, BingoCard, GameSession, Wallet, Transaction, Player } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const finalHeaders = {
      ...options.headers,
      'Content-Type': 'application/json',
    };
    console.log('Fetch endpoint:', `${API_BASE_URL}${endpoint}`);
    console.log('Fetch options:', { ...options, headers: finalHeaders });
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: finalHeaders,
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return response.json();
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
    return this.request('/profile');
  }

  async updateProfile(data: any) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Rooms
  async createRoom(data: any) {
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

  async joinRoom(id: string) {
    return this.request(`/rooms/${id}/join`, { method: 'POST' });
  }

  async leaveRoom(id: string) {
    return this.request(`/rooms/${id}/leave`, { method: 'POST' });
  }

  async startRoom(id: string) {
    return this.request(`/rooms/${id}/start`, { method: 'POST' });
  }

  async getRoomPlayers(id: string): Promise<Player[]> {
    return this.request(`/rooms/${id}/players`);
  }

  async getRoomCards(id: string): Promise<BingoCard[]> {
    return this.request(`/rooms/${id}/cards`);
  }

  async placeBet(id: string, data: any) {
    return this.request(`/rooms/${id}/bet`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Session
  async getSession(id: string): Promise<GameSession> {
    return this.request(`/session/${id}`);
  }

  async drawNumber(id: string) {
    return this.request(`/session/${id}/draw`, { method: 'POST' });
  }

  async markNumber(id: string, data: any) {
    return this.request(`/session/${id}/mark`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async claimBingo(id: string) {
    return this.request(`/session/${id}/claim`, { method: 'POST' });
  }

  async getWinners(id: string) {
    return this.request(`/session/${id}/winners`);
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