"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketIO = setupSocketIO;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const rooms = new Map();
function setupSocketIO(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET || 'secret');
            socket.userId = decoded.userId;
            socket.username = decoded.username || 'Player';
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const authSocket = socket;
        console.log(`User ${authSocket.userId} connected`);
        socket.on('join_room', ({ roomId, gameSlug }) => {
            socket.join(roomId);
            if (!rooms.has(roomId)) {
                rooms.set(roomId, {
                    board: Array(9).fill(null),
                    currentPlayer: authSocket.userId || '',
                    players: [],
                    status: 'waiting',
                });
            }
            const room = rooms.get(roomId);
            if (!room.players.includes(authSocket.userId || '')) {
                room.players.push(authSocket.userId || '');
            }
            if (room.players.length === 2) {
                room.status = 'playing';
            }
            io.to(roomId).emit('game_state', { roomId, state: room, status: room.status });
            console.log(`User ${authSocket.userId} joined room ${roomId} for game ${gameSlug}`);
        });
        socket.on('leave_room', ({ roomId }) => {
            socket.leave(roomId);
            const room = rooms.get(roomId);
            if (room) {
                room.players = room.players.filter(p => p !== authSocket.userId);
                if (room.players.length === 0) {
                    rooms.delete(roomId);
                }
            }
        });
        socket.on('make_move', ({ roomId, move }) => {
            const room = rooms.get(roomId);
            if (!room || room.status !== 'playing')
                return;
            const playerIndex = room.players.indexOf(authSocket.userId || '');
            if (playerIndex === -1)
                return;
            const symbol = playerIndex === 0 ? 'X' : 'O';
            if (room.currentPlayer !== authSocket.userId)
                return;
            if (room.board[move.index] !== null)
                return;
            room.board[move.index] = symbol;
            const winner = checkWinner(room.board);
            if (winner) {
                room.status = 'finished';
                room.winner = authSocket.userId;
            }
            else if (room.board.every(cell => cell !== null)) {
                room.status = 'finished';
                room.winner = null;
            }
            else {
                const nextPlayerIndex = playerIndex === 0 ? 1 : 0;
                room.currentPlayer = room.players[nextPlayerIndex] || '';
            }
            io.to(roomId).emit('game_state', {
                roomId,
                state: room,
                status: room.status,
                currentPlayer: room.currentPlayer,
            });
        });
        socket.on('chat_message', ({ roomId, message }) => {
            io.to(roomId).emit('chat_message', {
                roomId,
                userId: authSocket.userId,
                username: authSocket.username,
                message,
                timestamp: new Date(),
            });
        });
        socket.on('disconnect', () => {
            console.log(`User ${authSocket.userId} disconnected`);
        });
    });
    return io;
}
function checkWinner(board) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}
