import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

type Board = (number | null)[][];
type Direction = 'up' | 'down' | 'left' | 'right';

const TILE_COLORS: Record<number, { bg: string; text: string; shadow: string }> = {
  2: { bg: 'bg-dark-600', text: 'text-gray-200', shadow: '' },
  4: { bg: 'bg-dark-500', text: 'text-gray-100', shadow: '' },
  8: { bg: 'bg-orange-900/60', text: 'text-orange-200', shadow: 'shadow-neon-cyan' },
  16: { bg: 'bg-orange-800/60', text: 'text-orange-100', shadow: '' },
  32: { bg: 'bg-red-800/60', text: 'text-red-100', shadow: '' },
  64: { bg: 'bg-red-700/60', text: 'text-red-50', shadow: '' },
  128: { bg: 'bg-yellow-700/60', text: 'text-yellow-100', shadow: 'shadow-neon-cyan' },
  256: { bg: 'bg-yellow-600/60', text: 'text-yellow-50', shadow: '' },
  512: { bg: 'bg-green-700/60', text: 'text-green-100', shadow: 'shadow-neon-green' },
  1024: { bg: 'bg-cyan-700/60', text: 'text-cyan-50', shadow: 'shadow-neon-cyan' },
  2048: { bg: 'bg-neon-cyan/30', text: 'neon-text-cyan', shadow: 'shadow-neon-cyan' },
};

function createEmptyBoard(): Board {
  return Array(4).fill(null).map(() => Array(4).fill(null));
}

function addRandomTile(board: Board): Board {
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!board[r][c]) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newBoard = board.map(row => [...row]);
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
}

function slide(row: (number | null)[]): { row: (number | null)[]; score: number } {
  const filtered = row.filter(Boolean) as number[];
  let score = 0;
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) {
      filtered[i] *= 2;
      score += filtered[i];
      filtered.splice(i + 1, 1);
    }
  }
  while (filtered.length < 4) filtered.push(0);
  return { row: filtered.map(v => v || null), score };
}

function moveBoard(board: Board, dir: Direction): { board: Board; score: number; moved: boolean } {
  let newBoard = board.map(row => [...row]);
  let totalScore = 0;
  let moved = false;

  const transpose = (b: Board): Board => b[0].map((_, c) => b.map(row => row[c]));
  const reverse = (b: Board): Board => b.map(row => [...row].reverse());

  if (dir === 'up') newBoard = transpose(newBoard);
  if (dir === 'right') newBoard = reverse(newBoard);
  if (dir === 'down') { newBoard = transpose(newBoard); newBoard = reverse(newBoard); }

  newBoard = newBoard.map(row => {
    const { row: newRow, score } = slide(row);
    totalScore += score;
    if (JSON.stringify(newRow) !== JSON.stringify(row)) moved = true;
    return newRow;
  });

  if (dir === 'up') newBoard = transpose(newBoard);
  if (dir === 'right') newBoard = reverse(newBoard);
  if (dir === 'down') { newBoard = reverse(newBoard); newBoard = transpose(newBoard); }

  return { board: newBoard, score: totalScore, moved };
}

function hasWon(board: Board): boolean {
  return board.some(row => row.some(cell => cell === 2048));
}

function canMove(board: Board): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!board[r][c]) return true;
      if (c < 3 && board[r][c] === board[r][c + 1]) return true;
      if (r < 3 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

const Game2048: React.FC = () => {
  const [board, setBoard] = useState<Board>(() => addRandomTile(addRandomTile(createEmptyBoard())));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('2048-best') || '0'));
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [startTime] = useState(Date.now());
  const { isAuthenticated } = useAuthStore();
  const submittedRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const submitScore = useCallback(async (finalScore: number) => {
    if (!isAuthenticated || submittedRef.current) return;
    submittedRef.current = true;
    try {
      await api.post('/api/games/2048/score', {
        score: finalScore,
        duration: Math.floor((Date.now() - startTime) / 1000),
      });
    } catch {
      // ignore
    }
  }, [isAuthenticated, startTime]);

  const move = useCallback((dir: Direction) => {
    if (status !== 'playing') return;
    const { board: newBoard, score: gained, moved } = moveBoard(board, dir);
    if (!moved) return;
    const withTile = addRandomTile(newBoard);
    const newScore = score + gained;
    setBoard(withTile);
    setScore(newScore);
    if (newScore > bestScore) {
      setBestScore(newScore);
      localStorage.setItem('2048-best', String(newScore));
    }
    if (hasWon(withTile)) {
      setStatus('won');
      submitScore(newScore);
    } else if (!canMove(withTile)) {
      setStatus('lost');
      submitScore(newScore);
    }
  }, [board, score, bestScore, status, submitScore]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
      };
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [move]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) move(dx > 0 ? 'right' : 'left');
    } else {
      if (Math.abs(dy) > 30) move(dy > 0 ? 'down' : 'up');
    }
    touchStartRef.current = null;
  };

  const restart = () => {
    setBoard(addRandomTile(addRandomTile(createEmptyBoard())));
    setScore(0);
    setStatus('playing');
    submittedRef.current = false;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full max-w-md mb-6">
        <h1 className="text-3xl font-bold font-mono neon-text-cyan">2048</h1>
        <div className="flex gap-4">
          {[{ label: 'SCORE', value: score }, { label: 'BEST', value: bestScore }].map(s => (
            <div key={s.label} className="glass border border-neon-cyan/30 px-4 py-2 text-center min-w-[80px]">
              <div className="text-gray-500 font-mono text-xs">{s.label}</div>
              <div className="text-neon-cyan font-mono font-bold text-lg">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        {(status === 'won' || status === 'lost') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-10 bg-dark-900/80 flex flex-col items-center justify-center"
          >
            <p className={`text-4xl font-bold font-mono mb-4 ${status === 'won' ? 'neon-text-green' : 'neon-text-pink'}`}>
              {status === 'won' ? 'YOU WON!' : 'GAME OVER'}
            </p>
            <p className="text-gray-400 font-mono mb-6">SCORE: {score}</p>
            <button onClick={restart} className="px-6 py-3 border-2 border-neon-cyan text-neon-cyan font-mono hover:bg-neon-cyan/10">
              PLAY AGAIN
            </button>
          </motion.div>
        )}

        <div
          className="bg-dark-800 border border-neon-cyan/30 p-3 select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="grid grid-cols-4 gap-2" style={{ width: 'min(90vw, 400px)', height: 'min(90vw, 400px)' }}>
            {board.flat().map((cell, i) => {
              const colors = cell ? TILE_COLORS[cell] || TILE_COLORS[2048] : null;
              return (
                <motion.div
                  key={i}
                  layout
                  initial={{ scale: cell ? 0.8 : 1 }}
                  animate={{ scale: 1 }}
                  className={`flex items-center justify-center font-mono font-bold rounded-sm ${
                    colors ? `${colors.bg} ${colors.text} ${colors.shadow}` : 'bg-dark-700'
                  }`}
                  style={{ fontSize: cell && cell >= 1000 ? '1rem' : cell && cell >= 100 ? '1.2rem' : '1.5rem' }}
                >
                  {cell || ''}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button onClick={restart} className="px-6 py-3 border border-neon-cyan/50 text-neon-cyan font-mono text-sm hover:bg-neon-cyan/10">
          NEW GAME
        </button>
        <div className="glass border border-white/10 px-4 py-3 text-gray-500 font-mono text-sm">
          ARROWS / WASD / SWIPE
        </div>
      </div>
      {!isAuthenticated && (
        <p className="mt-4 text-gray-600 font-mono text-xs">LOGIN TO SAVE YOUR SCORE</p>
      )}
    </div>
  );
};

export default Game2048;
