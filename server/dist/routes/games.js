"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
const scoreSchema = zod_1.z.object({
    score: zod_1.z.number().int().min(0),
    duration: zod_1.z.number().int().min(0),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
// Seed games helper
const GAMES = [
    { id: (0, uuid_1.v4)(), slug: '2048', name: '2048', description: 'Slide tiles and reach 2048!', thumbnail: '/games/2048.png', category: 'puzzle', maxPlayers: 1, isMultiplayer: false },
    { id: (0, uuid_1.v4)(), slug: 'snake', name: 'Snake', description: 'Classic snake game with speed levels', thumbnail: '/games/snake.png', category: 'arcade', maxPlayers: 1, isMultiplayer: false },
    { id: (0, uuid_1.v4)(), slug: 'tic-tac-toe', name: 'Tic-Tac-Toe', description: 'Play against AI or a friend online!', thumbnail: '/games/tictactoe.png', category: 'strategy', maxPlayers: 2, isMultiplayer: true },
];
// GET /api/games
router.get('/', async (_req, res, next) => {
    try {
        let games = await prisma_1.prisma.game.findMany();
        if (games.length === 0) {
            // Seed games
            for (const game of GAMES) {
                await prisma_1.prisma.game.upsert({
                    where: { slug: game.slug },
                    update: {},
                    create: game,
                });
            }
            games = await prisma_1.prisma.game.findMany();
        }
        res.json({ success: true, data: games });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/games/:slug/score
router.post('/:slug/score', auth_1.authenticate, async (req, res, next) => {
    try {
        const slug = req.params.slug;
        const { score, duration, metadata } = scoreSchema.parse(req.body);
        const game = await prisma_1.prisma.game.findUnique({ where: { slug } });
        if (!game)
            throw new errorHandler_1.AppError('Game not found', 404);
        const record = await prisma_1.prisma.gameRecord.create({
            data: {
                id: (0, uuid_1.v4)(),
                userId: req.userId,
                gameSlug: slug,
                score,
                duration,
                metadata: (metadata ?? {}),
            },
        });
        res.status(201).json({ success: true, data: record });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/games/:slug/leaderboard
router.get('/:slug/leaderboard', async (req, res, next) => {
    try {
        const slug = req.params.slug;
        const limit = parseInt(req.query.limit) || 10;
        const records = await prisma_1.prisma.gameRecord.findMany({
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
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
