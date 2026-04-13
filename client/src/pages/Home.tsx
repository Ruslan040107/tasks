import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import type { Game } from '../types';

const Home: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    api.get('/api/games').then(res => {
      if (res.data.success) setGames(res.data.data);
    }).catch(() => {
      setGames([
        { id: '1', name: '2048', slug: '2048', description: 'Slide tiles and reach 2048!', thumbnail: '', category: 'puzzle', maxPlayers: 1, isMultiplayer: false, createdAt: '' },
        { id: '2', name: 'Snake', slug: 'snake', description: 'Classic snake with speed levels', thumbnail: '', category: 'arcade', maxPlayers: 1, isMultiplayer: false, createdAt: '' },
        { id: '3', name: 'Tic-Tac-Toe', slug: 'tic-tac-toe', description: 'Play vs AI or friend online!', thumbnail: '', category: 'strategy', maxPlayers: 2, isMultiplayer: true, createdAt: '' },
      ]);
    });
  }, []);

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10"
        >
          <motion.h1
            className="text-5xl md:text-8xl font-bold font-mono neon-text-cyan mb-4"
            animate={{ opacity: [1, 0.8, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            GAME_PLATFORM
          </motion.h1>
          <p className="text-xl md:text-2xl text-gray-400 font-mono mb-2">
            {'>'} PLAY. COMPETE. WIN.
          </p>
          <p className="text-sm text-neon-green font-mono mb-12">
            [ 3 GAMES AVAILABLE ] [ REAL-TIME MULTIPLAYER ] [ GLOBAL LEADERBOARDS ]
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/games">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0, 245, 255, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-neon-cyan/20 border-2 border-neon-cyan text-neon-cyan font-mono font-bold text-lg hover:bg-neon-cyan/30 transition-all w-full sm:w-auto"
              >
                {'>'} PLAY NOW
              </motion.button>
            </Link>
            <Link to="/leaderboard">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(191, 0, 255, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-neon-purple/20 border-2 border-neon-purple text-neon-purple font-mono font-bold text-lg hover:bg-neon-purple/30 transition-all w-full sm:w-auto"
              >
                {'>'} LEADERBOARD
              </motion.button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-neon-cyan/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-neon-cyan rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Games Showcase */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold font-mono neon-text-purple mb-12"
        >
          {'>'} FEATURED_GAMES
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {games.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass border border-neon-cyan/20 hover:border-neon-cyan/60 transition-all cursor-pointer group"
            >
              <Link to={`/games/${game.slug}`}>
                <div className="h-48 bg-dark-600 flex items-center justify-center relative overflow-hidden">
                  <span className="text-6xl font-bold font-mono neon-text-cyan group-hover:scale-110 transition-transform">
                    {game.slug === '2048' ? '2048' : game.slug === 'snake' ? '🐍' : '✕○'}
                  </span>
                  {game.isMultiplayer && (
                    <span className="absolute top-2 right-2 text-xs font-mono bg-neon-green/20 border border-neon-green text-neon-green px-2 py-1">
                      MULTIPLAYER
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold font-mono text-white mb-2">{game.name}</h3>
                  <p className="text-gray-400 font-mono text-sm mb-4">{game.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-neon-purple">[{game.category.toUpperCase()}]</span>
                    <span className="text-neon-cyan font-mono text-sm group-hover:animate-pulse">PLAY {'>'}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats section */}
      <section className="py-20 px-4 bg-dark-800">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'GAMES', value: '3', color: 'neon-text-cyan' },
            { label: 'PLAYERS', value: '∞', color: 'neon-text-purple' },
            { label: 'REAL-TIME', value: '✓', color: 'neon-text-green' },
            { label: 'FREE', value: '100%', color: 'neon-text-pink' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-6"
            >
              <div className={`text-4xl md:text-6xl font-bold font-mono ${stat.color} mb-2`}>{stat.value}</div>
              <div className="text-gray-500 font-mono text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
