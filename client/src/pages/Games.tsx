import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import type { Game } from '../types';

const GAME_ICONS: Record<string, string> = {
  '2048': '▦',
  'snake': '◈',
  'tic-tac-toe': '⊕',
};

const Games: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/games').then(res => {
      if (res.data.success) setGames(res.data.data);
    }).catch(() => {
      setGames([
        { id: '1', name: '2048', slug: '2048', description: 'Combine tiles to reach 2048. Use arrow keys or swipe to move tiles.', thumbnail: '', category: 'puzzle', maxPlayers: 1, isMultiplayer: false, createdAt: '' },
        { id: '2', name: 'Snake', slug: 'snake', description: 'Classic snake game. Eat food to grow, avoid hitting yourself!', thumbnail: '', category: 'arcade', maxPlayers: 1, isMultiplayer: false, createdAt: '' },
        { id: '3', name: 'Tic-Tac-Toe', slug: 'tic-tac-toe', description: 'Classic Tic-Tac-Toe. Play vs AI (minimax) or challenge a friend online!', thumbnail: '', category: 'strategy', maxPlayers: 2, isMultiplayer: true, createdAt: '' },
      ]);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-4xl font-bold font-mono neon-text-cyan mb-2">GAME_CATALOG</h1>
          <p className="text-gray-500 font-mono">{'>'} SELECT YOUR GAME</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="glass border border-neon-cyan/20 hover:border-neon-cyan/60 transition-all group"
              >
                <Link to={`/games/${game.slug}`}>
                  <div className="h-52 bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center relative overflow-hidden">
                    <motion.span
                      className="text-7xl font-bold font-mono neon-text-cyan"
                      whileHover={{ scale: 1.2 }}
                    >
                      {GAME_ICONS[game.slug] || '▣'}
                    </motion.span>
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
                    {game.isMultiplayer && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-neon-green/20 border border-neon-green px-2 py-1">
                        <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                        <span className="text-xs font-mono text-neon-green">ONLINE</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold font-mono text-white">{game.name}</h3>
                      <span className="text-xs font-mono px-2 py-1 border border-neon-purple/50 text-neon-purple">
                        {game.category.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-400 font-mono text-sm mb-4">{game.description}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span className="text-xs text-gray-600 font-mono">{game.maxPlayers === 1 ? '1 PLAYER' : `UP TO ${game.maxPlayers} PLAYERS`}</span>
                      <motion.span
                        className="text-neon-cyan font-mono text-sm font-bold"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        PLAY NOW {'>'}
                      </motion.span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Games;
