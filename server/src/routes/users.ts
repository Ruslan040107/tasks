import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const updateUserSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, avatar: true, bio: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    if (req.userId !== id) throw new AppError('Forbidden', 403);
    const data = updateUserSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, email: true, avatar: true, bio: true, createdAt: true, updatedAt: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id/stats
router.get('/:id/stats', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id as string;
    const records = await prisma.gameRecord.findMany({ where: { userId } });

    const gameStats: Record<string, { gamesPlayed: number; highScore: number; totalScore: number; wins: number; losses: number }> = {};

    for (const record of records) {
      if (!gameStats[record.gameSlug]) {
        gameStats[record.gameSlug] = { gamesPlayed: 0, highScore: 0, totalScore: 0, wins: 0, losses: 0 };
      }
      gameStats[record.gameSlug].gamesPlayed++;
      gameStats[record.gameSlug].totalScore += record.score;
      if (record.score > gameStats[record.gameSlug].highScore) {
        gameStats[record.gameSlug].highScore = record.score;
      }
    }

    const formattedStats: Record<string, { gamesPlayed: number; highScore: number; averageScore: number; wins: number; losses: number }> = {};
    for (const [slug, stats] of Object.entries(gameStats)) {
      formattedStats[slug] = {
        gamesPlayed: stats.gamesPlayed,
        highScore: stats.highScore,
        averageScore: stats.gamesPlayed > 0 ? Math.round(stats.totalScore / stats.gamesPlayed) : 0,
        wins: stats.wins,
        losses: stats.losses,
      };
    }

    res.json({
      success: true,
      data: {
        userId,
        totalGamesPlayed: records.length,
        totalScore: records.reduce((sum, r) => sum + r.score, 0),
        gamesWon: 0,
        gamesLost: 0,
        gameStats: formattedStats,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
