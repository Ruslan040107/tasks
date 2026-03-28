// User types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  userId: string;
  totalGamesPlayed: number;
  totalScore: number;
  gamesWon: number;
  gamesLost: number;
  gameStats: Record<string, GameSpecificStats>;
}

export interface GameSpecificStats {
  gamesPlayed: number;
  highScore: number;
  averageScore: number;
  wins: number;
  losses: number;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RefreshRequest {
  refreshToken: string;
}

// Game types
export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail: string;
  category: string;
  maxPlayers: number;
  isMultiplayer: boolean;
  createdAt: Date;
}

export interface GameRecord {
  id: string;
  userId: string;
  gameSlug: string;
  score: number;
  duration: number;
  metadata?: Record<string, unknown>;
  playedAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  playedAt: Date;
}

export interface LeaderboardResponse {
  gameSlug: string;
  entries: LeaderboardEntry[];
  total: number;
}

export interface ScoreSubmission {
  score: number;
  duration: number;
  metadata?: Record<string, unknown>;
}

// WebSocket event types
export interface JoinRoomEvent {
  roomId: string;
  gameSlug: string;
}

export interface LeaveRoomEvent {
  roomId: string;
}

export interface MakeMoveEvent {
  roomId: string;
  move: unknown;
}

export interface GameStateEvent {
  roomId: string;
  state: unknown;
  currentPlayer?: string;
  status: 'waiting' | 'playing' | 'finished';
}

export interface ChatMessageEvent {
  roomId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}
