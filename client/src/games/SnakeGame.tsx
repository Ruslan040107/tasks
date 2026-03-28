import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Speed = 'SLOW' | 'NORMAL' | 'FAST';
type Status = 'idle' | 'playing' | 'paused' | 'dead';

const GRID = 20;
const CELL = 20;
const SPEEDS: Record<Speed, number> = { SLOW: 200, NORMAL: 120, FAST: 70 };

function randPoint(exclude: Point[]): Point {
  let p: Point;
  do {
    p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (exclude.some(e => e.x === p.x && e.y === p.y));
  return p;
}

const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('snake-best') || '0'));
  const [speed, setSpeed] = useState<Speed>('NORMAL');
  const startTimeRef = useRef(Date.now());
  const { isAuthenticated } = useAuthStore();
  const submittedRef = useRef(false);

  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]);
  const dirRef = useRef<Direction>('RIGHT');
  const nextDirRef = useRef<Direction>('RIGHT');
  const foodRef = useRef<Point>(randPoint([{ x: 10, y: 10 }]));
  const scoreRef = useRef(0);
  const statusRef = useRef<Status>('idle');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = GRID * CELL;
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(0, 245, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(size, i * CELL); ctx.stroke();
    }

    const food = foodRef.current;
    ctx.fillStyle = '#ff0090';
    ctx.shadowColor = '#ff0090';
    ctx.shadowBlur = 10;
    ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);
    ctx.shadowBlur = 0;

    const snake = snakeRef.current;
    snake.forEach((seg, i) => {
      const ratio = i / snake.length;
      ctx.fillStyle = i === 0 ? '#00f5ff' : `rgba(0, ${Math.floor(245 * (1 - ratio * 0.6))}, ${Math.floor(255 * (1 - ratio * 0.4))}, ${1 - ratio * 0.3})`;
      ctx.shadowColor = i === 0 ? '#00f5ff' : 'transparent';
      ctx.shadowBlur = i === 0 ? 15 : 0;
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    });
    ctx.shadowBlur = 0;
  }, []);

  const submitScore = useCallback(async (finalScore: number) => {
    if (!isAuthenticated || submittedRef.current) return;
    submittedRef.current = true;
    try {
      await api.post('/api/games/snake/score', {
        score: finalScore,
        duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
      });
    } catch { /* ignore */ }
  }, [isAuthenticated]);

  const gameLoop = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    dirRef.current = nextDirRef.current;
    const head = snakeRef.current[0];
    const newHead: Point = {
      x: (head.x + (dirRef.current === 'RIGHT' ? 1 : dirRef.current === 'LEFT' ? -1 : 0) + GRID) % GRID,
      y: (head.y + (dirRef.current === 'DOWN' ? 1 : dirRef.current === 'UP' ? -1 : 0) + GRID) % GRID,
    };

    if (snakeRef.current.slice(0, -1).some(s => s.x === newHead.x && s.y === newHead.y)) {
      statusRef.current = 'dead';
      setStatus('dead');
      const final = scoreRef.current;
      if (final > parseInt(localStorage.getItem('snake-best') || '0')) {
        localStorage.setItem('snake-best', String(final));
        setHighScore(final);
      }
      submitScore(final);
      if (intervalRef.current) clearInterval(intervalRef.current);
      draw();
      return;
    }

    const atFood = newHead.x === foodRef.current.x && newHead.y === foodRef.current.y;
    snakeRef.current = [newHead, ...(atFood ? snakeRef.current : snakeRef.current.slice(0, -1))];

    if (atFood) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
      foodRef.current = randPoint(snakeRef.current);
    }
    draw();
  }, [draw, submitScore]);

  const start = useCallback(() => {
    snakeRef.current = [{ x: 10, y: 10 }];
    dirRef.current = 'RIGHT';
    nextDirRef.current = 'RIGHT';
    foodRef.current = randPoint([{ x: 10, y: 10 }]);
    scoreRef.current = 0;
    setScore(0);
    statusRef.current = 'playing';
    setStatus('playing');
    startTimeRef.current = Date.now();
    submittedRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(gameLoop, SPEEDS[speed]);
    draw();
  }, [speed, gameLoop, draw]);

  const togglePause = useCallback(() => {
    if (statusRef.current === 'playing') {
      statusRef.current = 'paused';
      setStatus('paused');
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else if (statusRef.current === 'paused') {
      statusRef.current = 'playing';
      setStatus('playing');
      intervalRef.current = setInterval(gameLoop, SPEEDS[speed]);
    }
  }, [speed, gameLoop]);

  useEffect(() => {
    draw();
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
        w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
      };
      const opposite: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
      if (map[e.key]) {
        e.preventDefault();
        if (map[e.key] !== opposite[dirRef.current]) nextDirRef.current = map[e.key];
      }
      if (e.key === 'p' || e.key === ' ') togglePause();
    };
    window.addEventListener('keydown', handleKey);
    return () => { window.removeEventListener('keydown', handleKey); if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [draw, togglePause]);

  useEffect(() => {
    if (status === 'playing' && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(gameLoop, SPEEDS[speed]);
    }
  }, [speed, status, gameLoop]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full max-w-md mb-6">
        <h1 className="text-3xl font-bold font-mono neon-text-green">SNAKE</h1>
        <div className="flex gap-4">
          {[{ label: 'SCORE', value: score }, { label: 'BEST', value: highScore }].map(s => (
            <div key={s.label} className="glass border border-neon-green/30 px-4 py-2 text-center min-w-[80px]">
              <div className="text-gray-500 font-mono text-xs">{s.label}</div>
              <div className="text-neon-green font-mono font-bold text-lg">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GRID * CELL}
          height={GRID * CELL}
          className="border border-neon-green/30"
          style={{ imageRendering: 'pixelated' }}
        />
        {(status === 'idle' || status === 'dead') && (
          <div className="absolute inset-0 bg-dark-900/80 flex flex-col items-center justify-center">
            {status === 'dead' && <p className="text-neon-pink font-mono text-2xl mb-2">GAME OVER</p>}
            {status === 'dead' && <p className="text-gray-400 font-mono mb-4">SCORE: {score}</p>}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={start}
              className="px-8 py-4 border-2 border-neon-green text-neon-green font-mono font-bold text-lg hover:bg-neon-green/10"
            >
              {status === 'dead' ? 'PLAY AGAIN' : 'START GAME'}
            </motion.button>
          </div>
        )}
        {status === 'paused' && (
          <div className="absolute inset-0 bg-dark-900/80 flex flex-col items-center justify-center">
            <p className="text-neon-cyan font-mono text-3xl">PAUSED</p>
            <button onClick={togglePause} className="mt-4 px-6 py-3 border border-neon-cyan text-neon-cyan font-mono hover:bg-neon-cyan/10">
              RESUME
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3 items-center flex-wrap justify-center">
        <span className="text-gray-500 font-mono text-sm">SPEED:</span>
        {(['SLOW', 'NORMAL', 'FAST'] as Speed[]).map(s => (
          <button key={s}
            onClick={() => setSpeed(s)}
            className={`px-4 py-2 font-mono text-sm border transition-all ${
              speed === s ? 'border-neon-green bg-neon-green/20 text-neon-green' : 'border-white/20 text-gray-400 hover:border-neon-green/50'
            }`}
          >{s}</button>
        ))}
        {status === 'playing' && (
          <button onClick={togglePause} className="px-4 py-2 border border-neon-cyan text-neon-cyan font-mono text-sm hover:bg-neon-cyan/10">
            PAUSE (P)
          </button>
        )}
      </div>
      <p className="mt-3 text-gray-600 font-mono text-xs">ARROWS / WASD TO MOVE | P / SPACE TO PAUSE</p>
      {!isAuthenticated && <p className="mt-2 text-gray-600 font-mono text-xs">LOGIN TO SAVE YOUR SCORE</p>}
    </div>
  );
};

export default SnakeGame;
