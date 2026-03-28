"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../lib/jwt");
const errorHandler_1 = require("../middleware/errorHandler");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(30),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
// POST /api/auth/register
router.post('/register', async (req, res, next) => {
    try {
        const { username, email, password } = registerSchema.parse(req.body);
        const existing = await prisma_1.prisma.user.findFirst({
            where: { OR: [{ email }, { username }] },
        });
        if (existing) {
            throw new errorHandler_1.AppError('User with that email or username already exists', 409);
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma_1.prisma.user.create({
            data: { id: (0, uuid_1.v4)(), username, email, passwordHash },
        });
        const accessToken = (0, jwt_1.generateAccessToken)(user.id);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user.id);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma_1.prisma.session.create({
            data: { id: (0, uuid_1.v4)(), userId: user.id, refreshToken, expiresAt },
        });
        res.status(201).json({
            success: true,
            data: {
                user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt },
                tokens: { accessToken, refreshToken },
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            throw new errorHandler_1.AppError('Invalid credentials', 401);
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid)
            throw new errorHandler_1.AppError('Invalid credentials', 401);
        const accessToken = (0, jwt_1.generateAccessToken)(user.id);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user.id);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma_1.prisma.session.create({
            data: { id: (0, uuid_1.v4)(), userId: user.id, refreshToken, expiresAt },
        });
        res.json({
            success: true,
            data: {
                user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, bio: user.bio, createdAt: user.createdAt, updatedAt: user.updatedAt },
                tokens: { accessToken, refreshToken },
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/auth/logout
router.post('/logout', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await prisma_1.prisma.session.deleteMany({ where: { refreshToken } });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            throw new errorHandler_1.AppError('Refresh token required', 400);
        const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const session = await prisma_1.prisma.session.findUnique({ where: { refreshToken } });
        if (!session || session.expiresAt < new Date()) {
            throw new errorHandler_1.AppError('Invalid or expired refresh token', 401);
        }
        const newAccessToken = (0, jwt_1.generateAccessToken)(decoded.userId);
        const newRefreshToken = (0, jwt_1.generateRefreshToken)(decoded.userId);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma_1.prisma.session.update({
            where: { refreshToken },
            data: { refreshToken: newRefreshToken, expiresAt },
        });
        res.json({
            success: true,
            data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
