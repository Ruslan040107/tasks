import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const scoreSchema = z.object({
  score: z.number().int().min(0),
  duration: z.number().int().min(0),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Seed games helper
const GAMES = [
  { id: uuidv4(), slug: '2048', name: '2048', description: 'Slide tiles and reach 2048!', thumbnail: '/games/2048.png', category: 'puzzle', maxPlayers: 1, isMultiplayer: false },
  { id: uuidv4(), slug: 'snake', name: 'Snake', description: 'Classic snake game with speed levels', thumbnail: '/games/snake.png', category: 'arcade', maxPlayers: 1, isMultiplayer: false },
  { id: uuidv4(), slug: 'tic-tac-toe', name: 'Tic-Tac-Toe', description: 'Play against AI or a friend online!', thumbnail: '/games/tictactoe.png', category: 'strategy', maxPlayers: 2, isMultiplayer: true },
];

// GET /api/games
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let games = await prisma.game.findMany();
    if (games.length === 0) {
      // Seed games
      for (const game of GAMES) {
        await prisma.game.upsert({
          where: { slug: game.slug },
          update: {},
          create: game,
        });
      }
      games = await prisma.game.findMany();
    }
    res.json({ success: true, data: games });
  } catch (err) {
    next(err);
  }
});

// POST /api/games/:slug/score
router.post('/:slug/score', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const { score, duration, metadata } = scoreSchema.parse(req.body);

    const game = await prisma.game.findUnique({ where: { slug } });
    if (!game) throw new AppError('Game not found', 404);

    const record = await prisma.gameRecord.create({
      data: {
        id: uuidv4(),
        userId: req.userId!,
        gameSlug: slug,
        score,
        duration,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

// GET /api/games/:slug/leaderboard
router.get('/:slug/leaderboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const limit = parseInt(req.query.limit as string) || 10;

    const records = await prisma.gameRecord.findMany({
      where: { gameSlug: slug },
      orderBy: { score: 'desc' },
      take: limit,
      include: { user: { select: { username: true, avatar: true } } },
    });

    const entries = records.map((record, index) => ({
      rank: index + 1,
      userId: record.userId,
      username: record.user.username,
      avatar: record.user.avatar,
      score: record.score,
      playedAt: record.playedAt,
    }));

    res.json({
      success: true,
      data: { gameSlug: slug, entries, total: entries.length },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
