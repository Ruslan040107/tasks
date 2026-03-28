"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
const updateUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(30).optional(),
    bio: zod_1.z.string().max(500).optional(),
    avatar: zod_1.z.string().url().optional(),
});
// GET /api/users/:id
router.get('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id },
            select: { id: true, username: true, email: true, avatar: true, bio: true, createdAt: true, updatedAt: true },
        });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        res.json({ success: true, data: user });
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/users/:id
router.put('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const id = req.params.id;
        if (req.userId !== id)
            throw new errorHandler_1.AppError('Forbidden', 403);
        const data = updateUserSchema.parse(req.body);
        const user = await prisma_1.prisma.user.update({
            where: { id },
            data,
            select: { id: true, username: true, email: true, avatar: true, bio: true, createdAt: true, updatedAt: true },
        });
        res.json({ success: true, data: user });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/users/:id/stats
router.get('/:id/stats', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.params.id;
        const records = await prisma_1.prisma.gameRecord.findMany({ where: { userId } });
        const gameStats = {};
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
        const formattedStats = {};
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
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
