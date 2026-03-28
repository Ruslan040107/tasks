import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import type { LeaderboardEntry } from '../types';

const GAMES = ['2048', 'snake', 'tic-tac-toe'];

const Leaderboard: React.FC = () => {
  const [activeGame, setActiveGame] = useState('2048');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/games/${activeGame}/leaderboard?limit=20`)
      .then(res => {
        if (res.data.success) setEntries(res.data.data.entries);
        else setEntries([]);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [activeGame]);

  return (
    <div className="min-h-screen bg-dark-900 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-4xl font-bold font-mono neon-text-purple mb-2">LEADERBOARD</h1>
          <p className="text-gray-500 font-mono">{'>'} TOP PLAYERS</p>
        </motion.div>

        {/* Game selector */}
        <div className="flex gap-4 mb-8 flex-wrap">
          {GAMES.map(game => (
            <motion.button
              key={game}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveGame(game)}
              className={`px-6 py-3 font-mono text-sm border transition-all ${
                activeGame === game
                  ? 'border-neon-purple bg-neon-purple/20 text-neon-purple'
                  : 'border-white/20 text-gray-400 hover:border-neon-purple/50'
              }`}
            >
              {game.toUpperCase()}
            </motion.button>
          ))}
        </div>

        {/* Table */}
        <div className="glass border border-neon-purple/20 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neon-purple/20 bg-dark-800">
                {['RANK', 'PLAYER', 'SCORE', 'DATE'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-neon-purple font-mono text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full mx-auto"
                    />
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-600 font-mono">
                    NO RECORDS YET. BE THE FIRST!
                  </td>
                </tr>
              ) : (
                entries.map((entry, i) => (
                  <motion.tr
                    key={entry.userId + i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className={`font-mono font-bold text-lg ${
                        entry.rank === 1 ? 'text-yellow-400' :
                        entry.rank === 2 ? 'text-gray-300' :
                        entry.rank === 3 ? 'text-amber-600' :
                        'text-gray-600'
                      }`}>
                        #{entry.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan font-mono text-sm">
                          {entry.username[0]?.toUpperCase()}
                        </div>
                        <span className="font-mono text-white">{entry.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold neon-text-green text-lg">{entry.score.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-sm">
                      {new Date(entry.playedAt).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
