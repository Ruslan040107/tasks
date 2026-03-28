import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.tokens);
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass border border-neon-cyan/30 p-8">
          <h1 className="text-3xl font-bold font-mono neon-text-cyan mb-2">LOGIN</h1>
          <p className="text-gray-500 font-mono text-sm mb-8">{'>'} ENTER YOUR CREDENTIALS</p>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-3 border border-neon-pink/50 bg-neon-pink/10 text-neon-pink font-mono text-sm"
            >
              ERROR: {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-neon-cyan font-mono text-sm mb-2">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-dark-700 border border-neon-cyan/30 text-white font-mono px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-neon-cyan font-mono text-sm mb-2">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-dark-700 border border-neon-cyan/30 text-white font-mono px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                placeholder="••••••••"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0, 245, 255, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-neon-cyan/20 border-2 border-neon-cyan text-neon-cyan font-mono font-bold text-lg hover:bg-neon-cyan/30 transition-all disabled:opacity-50"
            >
              {loading ? 'CONNECTING...' : '> LOGIN'}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-gray-500 font-mono text-sm">
            NO ACCOUNT?{' '}
            <Link to="/register" className="text-neon-purple hover:text-neon-cyan transition-colors">
              REGISTER
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
