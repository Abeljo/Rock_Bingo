// // Centralized API endpoints for Rock Bingo app

// const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3000';

// const apiEndpoints = {
//   authTelegram: () => `${API_BASE}/api/auth/telegram`,
//   rooms: () => `${API_BASE}/api/rooms`,
//   roomCards: (roomId: number) => `${API_BASE}/api/rooms/${roomId}/cards`,
//   roomBet: (roomId: number) => `${API_BASE}/api/rooms/${roomId}/bet`,
//   roomSession: (roomId: number) => `${API_BASE}/api/rooms/${roomId}/session`,
//   sessionDrawn: (roomId: number) => `${API_BASE}/api/session/${roomId}/drawn`,
//   sessionMark: (roomId: number) => `${API_BASE}/api/session/${roomId}/mark`,
//   sessionClaim: (roomId: number) => `${API_BASE}/api/session/${roomId}/claim`,
// };

// export default apiEndpoints; 

// Centralized API endpoints for Rock Bingo app

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3000';

// Base API path
const API_PREFIX = '/api';

const apiEndpoints = {
  // Authentication
  authTelegram: () => `${API_BASE}${API_PREFIX}/auth/telegram`, // POST: Register/login via Telegram

  // Profile
  profile: () => `${API_BASE}${API_PREFIX}/profile`, // GET: Get user profile, PUT: Update user profile

  // Rooms
  rooms: () => `${API_BASE}${API_PREFIX}/rooms`, // POST: Create room, GET: List rooms
  roomInfo: (roomId: number) => `${API_BASE}${API_PREFIX}/rooms/${roomId}`, // GET: Get room info
  roomJoin: (roomId: number) => `${API_BASE}${API_PREFIX}/rooms/${roomId}/join`, // POST: Join room
  roomLeave: (roomId: number) => `${API_BASE}${API_PREFIX}/rooms/${roomId}/leave`, // POST: Leave room
  roomStart: (roomId: number) => `${API_BASE}${API_PREFIX}/rooms/${roomId}/start`, // POST: Start room
  roomPlayers: (roomId: number) => `${API_BASE}${API_PREFIX}/rooms/${roomId}/players`, // GET: Get players in room
  roomCards: (roomId: number) => `${API_BASE}${API_PREFIX}/rooms/${roomId}/cards`, // GET: Get cards in room
  roomBet: (roomId: number) => `${API_BASE}${API_PREFIX}/rooms/${roomId}/bet`, // POST: Place bet in room

  // Session
  sessionInfo: (sessionId: number) => `${API_BASE}${API_PREFIX}/session/${sessionId}`, // GET: Get session info
  sessionDraw: (sessionId: number) => `${API_BASE}${API_PREFIX}/session/${sessionId}/draw`, // POST: Draw number
  sessionMark: (sessionId: number) => `${API_BASE}${API_PREFIX}/session/${sessionId}/mark`, // POST: Mark number on card
  sessionClaim: (sessionId: number) => `${API_BASE}${API_PREFIX}/session/${sessionId}/claim`, // POST: Claim bingo
  sessionWinners: (sessionId: number) => `${API_BASE}${API_PREFIX}/session/${sessionId}/winners`, // GET: Get winners

  // Wallet and Transactions
  wallet: () => `${API_BASE}${API_PREFIX}/wallet`, // GET: Get wallet info
  transactions: () => `${API_BASE}${API_PREFIX}/transactions`, // GET: Get transaction history
  deposit: () => `${API_BASE}${API_PREFIX}/deposit`, // POST: Deposit funds
  withdraw: () => `${API_BASE}${API_PREFIX}/withdraw`, // POST: Withdraw funds

  // Audit and Health
  audit: () => `${API_BASE}${API_PREFIX}/audit`, // GET: Get audit logs
  health: () => `${API_BASE}${API_PREFIX}/health`, // GET: Health check
  version: () => `${API_BASE}${API_PREFIX}/version`, // GET: Version info
};

export default apiEndpoints;