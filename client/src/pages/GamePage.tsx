import React, { Suspense, lazy } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Game2048 = lazy(() => import('../games/Game2048'));
const SnakeGame = lazy(() => import('../games/SnakeGame'));
const TicTacToe = lazy(() => import('../games/TicTacToe'));

const GamePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const renderGame = () => {
    switch (slug) {
      case '2048': return <Game2048 />;
      case 'snake': return <SnakeGame />;
      case 'tic-tac-toe': return <TicTacToe />;
      default: return (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-neon-pink font-mono text-2xl mb-4">GAME NOT FOUND</p>
          <Link to="/games" className="text-neon-cyan font-mono hover:underline">{'<'} BACK TO GAMES</Link>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/games" className="inline-flex items-center text-gray-500 font-mono text-sm hover:text-neon-cyan transition-colors mb-6">
          {'<'} BACK TO GAMES
        </Link>
        <Suspense fallback={
          <div className="flex justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full"
            />
          </div>
        }>
          {renderGame()}
        </Suspense>
      </div>
    </div>
  );
};

export default GamePage;
