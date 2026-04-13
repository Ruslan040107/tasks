import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';

type Cell = 'X' | 'O' | null;
type Board = Cell[];
type Mode = 'menu' | 'vs-bot' | 'vs-friend';
type Difficulty = 'easy' | 'medium' | 'hard';

const WINNING_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function checkWinner(board: Board): { winner: Cell; line: number[] | null } {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return { winner: null, line: null };
}

function minimax(board: Board, isMax: boolean, depth: number, alpha: number, beta: number): number {
  const { winner } = checkWinner(board);
  if (winner === 'O') return 10 - depth;
  if (winner === 'X') return depth - 10;
  if (board.every(c => c !== null)) return 0;
  let best = isMax ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = isMax ? 'O' : 'X';
      const score = minimax(board, !isMax, depth + 1, alpha, beta);
      board[i] = null;
      if (isMax) { best = Math.max(best, score); alpha = Math.max(alpha, best); }
      else { best = Math.min(best, score); beta = Math.min(beta, best); }
      if (beta <= alpha) break;
    }
  }
  return best;
}

function getBotMove(board: Board, difficulty: Difficulty): number {
  const empty = board.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
  if (difficulty === 'easy') return empty[Math.floor(Math.random() * empty.length)];
  if (difficulty === 'medium' && Math.random() < 0.4) return empty[Math.floor(Math.random() * empty.length)];
  let best = -Infinity, move = empty[0];
  for (const i of empty) {
    board[i] = 'O';
    const score = minimax(board, false, 0, -Infinity, Infinity);
    board[i] = null;
    if (score > best) { best = score; move = i; }
  }
  return move;
}

const TicTacToe: React.FC = () => {
  const [mode, setMode] = useState<Mode>('menu');
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [current, setCurrent] = useState<'X' | 'O'>('X');
  const [status, setStatus] = useState<'playing' | 'won' | 'draw'>('playing');
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [winner, setWinner] = useState<Cell>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 });
  const [roomId, setRoomId] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [onlineStatus, setOnlineStatus] = useState<'idle' | 'connecting' | 'waiting' | 'playing' | 'finished'>('idle');
  const [mySymbol, setMySymbol] = useState<'X' | 'O' | null>(null);
  const [onlineBoard, setOnlineBoard] = useState<Board>(Array(9).fill(null));
  const [onlineWinner, setOnlineWinner] = useState<string | null | undefined>(undefined);
  const [chatMessages, setChatMessages] = useState<Array<{ username: string; message: string; timestamp: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user } = useAuthStore();
  const startTimeRef = useRef(Date.now());

  const submitScore = useCallback(async (result: number) => {
    if (!isAuthenticated) return;
    try {
      await api.post('/api/games/tic-tac-toe/score', { score: result, duration: Math.floor((Date.now() - startTimeRef.current) / 1000) });
    } catch { /* ignore */ }
  }, [isAuthenticated]);

  const makeMove = useCallback((index: number) => {
    if (board[index] || status !== 'playing') return;
    const newBoard = [...board];
    newBoard[index] = current;
    const { winner: w, line } = checkWinner(newBoard);
    setBoard(newBoard);
    if (w) {
      setWinner(w); setWinLine(line); setStatus('won');
      setScores(s => ({ ...s, [w]: s[w as keyof typeof s] + 1 }));
      submitScore(w === 'X' ? 1 : 0);
    } else if (newBoard.every(c => c !== null)) {
      setStatus('draw'); setScores(s => ({ ...s, draw: s.draw + 1 }));
    } else {
      const next = current === 'X' ? 'O' : 'X';
      setCurrent(next);
      if (mode === 'vs-bot' && next === 'O') {
        setTimeout(() => {
          const botMove = getBotMove([...newBoard], difficulty);
          const boardWithBot = [...newBoard];
          boardWithBot[botMove] = 'O';
          const { winner: bw, line: bl } = checkWinner(boardWithBot);
          setBoard(boardWithBot);
          if (bw) { setWinner(bw); setWinLine(bl); setStatus('won'); setScores(s => ({ ...s, O: s.O + 1 })); submitScore(0); }
          else if (boardWithBot.every(c => c !== null)) { setStatus('draw'); setScores(s => ({ ...s, draw: s.draw + 1 })); }
          else setCurrent('X');
        }, 300);
      }
    }
  }, [board, current, status, mode, difficulty, submitScore]);

  const reset = useCallback(() => {
    setBoard(Array(9).fill(null)); setCurrent('X'); setStatus('playing'); setWinLine(null); setWinner(null);
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (mode !== 'vs-friend' || !isAuthenticated) return;
    connectSocket();
    const socket = getSocket();
    socket.on('game_state', (data: { state: { board: Board; players: string[]; status: string; winner?: string | null }; status: string }) => {
      setOnlineBoard(data.state.board || Array(9).fill(null));
      setOnlineStatus(data.status === 'playing' ? 'playing' : data.status === 'waiting' ? 'waiting' : 'finished');
      if (data.state.status === 'finished') setOnlineWinner(data.state.winner);
      const playerIndex = data.state.players?.indexOf(user?.id || '') ?? -1;
      if (playerIndex !== -1) setMySymbol(playerIndex === 0 ? 'X' : 'O');
    });
    socket.on('chat_message', (msg: { username: string; message: string; timestamp: string }) => {
      setChatMessages(prev => [...prev, msg]);
      setTimeout(() => chatRef.current?.scrollTo(0, chatRef.current.scrollHeight), 50);
    });
    return () => {
      if (roomId) socket.emit('leave_room', { roomId });
      socket.off('game_state'); socket.off('chat_message'); disconnectSocket();
    };
  }, [mode, isAuthenticated, user?.id, roomId]);

  const joinRoom = () => {
    if (!roomInput.trim()) return;
    const id = roomInput.trim();
    setRoomId(id); setOnlineStatus('connecting');
    getSocket().emit('join_room', { roomId: id, gameSlug: 'tic-tac-toe' });
  };

  const onlineMakeMove = (index: number) => {
    if (!mySymbol || onlineStatus !== 'playing') return;
    getSocket().emit('make_move', { roomId, move: { index } });
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    getSocket().emit('chat_message', { roomId, message: chatInput.trim() });
    setChatInput('');
  };

  if (mode === 'menu') return (
    <div className="flex flex-col items-center py-10">
      <h1 className="text-3xl font-bold font-mono neon-text-purple mb-2">TIC-TAC-TOE</h1>
      <p className="text-gray-500 font-mono text-sm mb-12">{'>'} SELECT MODE</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-lg">
        <motion.button whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.95 }} onClick={() => setMode('vs-bot')}
          className="p-8 glass border border-neon-cyan/30 hover:border-neon-cyan/70 text-left transition-all">
          <div className="text-2xl font-bold font-mono text-neon-cyan mb-2">VS BOT</div>
          <div className="text-gray-500 font-mono text-sm">Challenge our minimax AI</div>
        </motion.button>
        <motion.button whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.95 }} onClick={() => setMode('vs-friend')}
          className="p-8 glass border border-neon-purple/30 hover:border-neon-purple/70 text-left transition-all">
          <div className="text-2xl font-bold font-mono text-neon-purple mb-2">VS FRIEND</div>
          <div className="text-gray-500 font-mono text-sm">Play online with a friend</div>
        </motion.button>
      </div>
    </div>
  );

  if (mode === 'vs-friend') {
    if (onlineStatus === 'idle') return (
      <div className="flex flex-col items-center py-10">
        <h1 className="text-3xl font-bold font-mono neon-text-purple mb-8">ONLINE GAME</h1>
        {!isAuthenticated ? <p className="text-neon-pink font-mono">YOU MUST BE LOGGED IN TO PLAY ONLINE</p> : (
          <div className="glass border border-neon-purple/30 p-8 w-full max-w-md">
            <p className="text-gray-400 font-mono text-sm mb-4">ENTER A ROOM ID TO CREATE OR JOIN A GAME:</p>
            <div className="flex gap-3">
              <input value={roomInput} onChange={e => setRoomInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && joinRoom()}
                placeholder="room-123" className="flex-1 bg-dark-700 border border-neon-purple/30 text-white font-mono px-4 py-3 focus:outline-none focus:border-neon-purple" />
              <button onClick={joinRoom} className="px-6 py-3 border-2 border-neon-purple text-neon-purple font-mono hover:bg-neon-purple/10">JOIN</button>
            </div>
            <button onClick={() => setMode('menu')} className="mt-4 text-gray-500 font-mono text-sm hover:text-gray-300">{'<'} BACK</button>
          </div>
        )}
      </div>
    );

    const onlineResult = onlineStatus === 'finished' && onlineWinner !== undefined
      ? (onlineWinner === null ? 'DRAW' : onlineWinner === user?.id ? 'YOU WIN!' : 'YOU LOSE') : null;

    return (
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
        <div className="flex flex-col items-center">
          <div className="mb-4 flex items-center gap-4">
            <span className="text-neon-purple font-mono">ROOM: {roomId}</span>
            {mySymbol && <span className="text-neon-cyan font-mono">YOU: {mySymbol}</span>}
            <span className={`font-mono text-sm px-3 py-1 border ${onlineStatus === 'waiting' ? 'border-yellow-500 text-yellow-500' : onlineStatus === 'playing' ? 'border-neon-green text-neon-green' : 'border-gray-500 text-gray-500'}`}>{onlineStatus.toUpperCase()}</span>
          </div>
          {onlineResult && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className={`mb-4 text-2xl font-bold font-mono ${onlineResult.includes('WIN') ? 'neon-text-green' : onlineResult === 'DRAW' ? 'neon-text-cyan' : 'neon-text-pink'}`}>{onlineResult}</motion.div>
          )}
          <div className="grid grid-cols-3 gap-2 p-4 glass border border-neon-purple/30">
            {onlineBoard.map((cell, i) => (
              <motion.button key={i} whileHover={!cell && onlineStatus === 'playing' ? { scale: 1.05 } : {}} whileTap={!cell && onlineStatus === 'playing' ? { scale: 0.95 } : {}}
                onClick={() => onlineMakeMove(i)}
                className={`w-24 h-24 text-4xl font-bold font-mono border transition-all flex items-center justify-center ${cell === 'X' ? 'text-neon-cyan border-neon-cyan/30' : cell === 'O' ? 'text-neon-purple border-neon-purple/30' : 'border-white/10 hover:border-neon-purple/40 bg-dark-700'}`}>
                {cell && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>{cell}</motion.span>}
              </motion.button>
            ))}
          </div>
        </div>
        <div className="glass border border-neon-purple/20 w-full lg:w-72 flex flex-col" style={{ height: '400px' }}>
          <div className="p-3 border-b border-neon-purple/20 text-neon-purple font-mono text-sm">CHAT</div>
          <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((msg, i) => (
              <div key={i} className="text-xs font-mono"><span className="text-neon-cyan">{msg.username}: </span><span className="text-gray-300">{msg.message}</span></div>
            ))}
          </div>
          <div className="p-3 border-t border-neon-purple/20 flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Message..." className="flex-1 bg-dark-700 border border-neon-purple/30 text-white font-mono px-3 py-2 text-xs focus:outline-none" />
            <button onClick={sendChat} className="px-3 py-2 border border-neon-purple text-neon-purple font-mono text-xs hover:bg-neon-purple/10">SEND</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full max-w-md mb-6">
        <h1 className="text-3xl font-bold font-mono neon-text-purple">TIC-TAC-TOE</h1>
        <button onClick={() => setMode('menu')} className="text-gray-500 font-mono text-sm hover:text-gray-300">{'<'} MENU</button>
      </div>
      <div className="flex gap-4 mb-6">
        {[{ label: 'YOU (X)', value: scores.X, color: 'text-neon-cyan' }, { label: 'DRAW', value: scores.draw, color: 'text-gray-500' }, { label: 'BOT (O)', value: scores.O, color: 'text-neon-pink' }].map(s => (
          <div key={s.label} className="glass border border-white/10 px-4 py-2 text-center min-w-[80px]">
            <div className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-gray-600 font-mono text-xs">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mb-6">
        {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
          <button key={d} onClick={() => setDifficulty(d)}
            className={`px-4 py-2 font-mono text-sm border transition-all ${difficulty === d ? 'border-neon-purple bg-neon-purple/20 text-neon-purple' : 'border-white/20 text-gray-400'}`}>{d.toUpperCase()}</button>
        ))}
      </div>
      <div className="mb-4 h-8">
        <AnimatePresence mode="wait">
          {status === 'playing' ? (
            <motion.p key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className={`font-mono text-sm ${current === 'X' ? 'neon-text-cyan' : 'neon-text-pink'}`}>{current === 'X' ? 'YOUR TURN (X)' : 'BOT THINKING...'}</motion.p>
          ) : status === 'won' ? (
            <motion.p key="won" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className={`font-mono font-bold text-lg ${winner === 'X' ? 'neon-text-green' : 'neon-text-pink'}`}>{winner === 'X' ? 'YOU WIN!' : 'BOT WINS!'}</motion.p>
          ) : (
            <motion.p key="draw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-neon-cyan">DRAW!</motion.p>
          )}
        </AnimatePresence>
      </div>
      <div className="grid grid-cols-3 gap-2 p-4 glass border border-neon-purple/30">
        {board.map((cell, i) => {
          const isWinCell = winLine?.includes(i);
          return (
            <motion.button key={i}
              whileHover={!cell && status === 'playing' && current === 'X' ? { scale: 1.05, backgroundColor: 'rgba(191, 0, 255, 0.1)' } : {}}
              whileTap={!cell && status === 'playing' && current === 'X' ? { scale: 0.95 } : {}}
              onClick={() => makeMove(i)}
              className={`w-24 h-24 text-4xl font-bold font-mono border transition-all flex items-center justify-center ${isWinCell ? 'bg-neon-green/10 border-neon-green' : cell === 'X' ? 'text-neon-cyan border-neon-cyan/30' : cell === 'O' ? 'text-neon-pink border-neon-pink/30' : 'border-white/10 bg-dark-700'}`}>
              {cell && <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300 }}>{cell}</motion.span>}
            </motion.button>
          );
        })}
      </div>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={reset}
        className="mt-6 px-6 py-3 border border-neon-purple text-neon-purple font-mono hover:bg-neon-purple/10">NEW GAME</motion.button>
    </div>
  );
};

export default TicTacToe;
