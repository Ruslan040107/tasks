export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail: string;
  category: string;
  maxPlayers: number;
  isMultiplayer: boolean;
  createdAt: string;
}

export interface GameRecord {
  id: string;
  userId: string;
  gameSlug: string;
  score: number;
  duration: number;
  metadata?: Record<string, unknown>;
  playedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  playedAt: string;
}

export interface UserStats {
  userId: string;
  totalGamesPlayed: number;
  totalScore: number;
  gamesWon: number;
  gamesLost: number;
  gameStats: Record<string, {
    gamesPlayed: number;
    highScore: number;
    averageScore: number;
    wins: number;
    losses: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
