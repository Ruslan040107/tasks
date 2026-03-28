import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, tokens } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout', { refreshToken: tokens?.refreshToken });
    } catch {
      // ignore
    }
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-neon-cyan/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              className="text-2xl font-bold neon-text-cyan font-mono"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {'>'} GAME_PLATFORM
            </motion.div>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <NavLink to="/">HOME</NavLink>
            <NavLink to="/games">GAMES</NavLink>
            <NavLink to="/leaderboard">LEADERBOARD</NavLink>
            {isAuthenticated && <NavLink to={`/profile/${user?.id}`}>PROFILE</NavLink>}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-neon-green text-sm font-mono">@{user?.username}</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-mono border border-neon-pink/50 text-neon-pink hover:bg-neon-pink/10 transition-all"
                >
                  LOGOUT
                </motion.button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="px-4 py-2 text-sm font-mono border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 transition-all"
                  >
                    LOGIN
                  </motion.button>
                </Link>
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="px-4 py-2 text-sm font-mono bg-neon-cyan/20 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/30 transition-all"
                  >
                    REGISTER
                  </motion.button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link to={to}>
    <motion.span
      className="text-sm font-mono text-gray-400 hover:text-neon-cyan transition-colors cursor-pointer"
      whileHover={{ color: '#00f5ff' }}
    >
      {children}
    </motion.span>
  </Link>
);

export default Navbar;
