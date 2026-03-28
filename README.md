# 🎮 Game Platform

A full-stack cyberpunk-themed game platform with real-time multiplayer.

## Tech Stack
- **Frontend**: React + Vite + TypeScript, TailwindCSS, Framer Motion, Zustand, React Router v6
- **Backend**: Node.js + Express + TypeScript, PostgreSQL + Prisma, JWT auth, Socket.io
- **Infrastructure**: Docker + docker-compose

## Games
- **2048** — Arrow/swipe controls, score saved to DB
- **Snake** — Canvas rendering, 3 speed levels, high score
- **Tic-Tac-Toe** — vs Minimax AI or friend via WebSocket with chat

## Quick Start

### With Docker
```bash
docker-compose up
```

### Manual Setup
```bash
# Shared types
cd shared && npm install && npm run build

# Backend
cd server && npm install
cp .env.example .env  # edit DATABASE_URL etc.
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend
cd client && npm install
npm run dev
```

## API Endpoints
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `POST /api/auth/refresh` — Refresh token
- `GET /api/users/:id` — Get user
- `PUT /api/users/:id` — Update user
- `GET /api/users/:id/stats` — User stats
- `GET /api/games` — List games
- `POST /api/games/:slug/score` — Submit score
- `GET /api/games/:slug/leaderboard` — Leaderboard

## WebSocket Events
`join_room`, `leave_room`, `make_move`, `game_state`, `chat_message`
