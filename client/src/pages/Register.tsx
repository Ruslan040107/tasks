import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', { username, email, password });
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.tokens);
        navigate('/');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Registration failed');
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
        <div className="glass border border-neon-purple/30 p-8">
          <h1 className="text-3xl font-bold font-mono neon-text-purple mb-2">REGISTER</h1>
          <p className="text-gray-500 font-mono text-sm mb-8">{'>'} CREATE YOUR ACCOUNT</p>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-6 p-3 border border-neon-pink/50 bg-neon-pink/10 text-neon-pink font-mono text-sm"
            >
              ERROR: {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-neon-purple font-mono text-sm mb-2">USERNAME</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                className="w-full bg-dark-700 border border-neon-purple/30 text-white font-mono px-4 py-3 focus:outline-none focus:border-neon-purple transition-colors"
                placeholder="player_one" minLength={3} maxLength={30}
              />
            </div>
            <div>
              <label className="block text-neon-purple font-mono text-sm mb-2">EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-dark-700 border border-neon-purple/30 text-white font-mono px-4 py-3 focus:outline-none focus:border-neon-purple transition-colors"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-neon-purple font-mono text-sm mb-2">PASSWORD</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-dark-700 border border-neon-purple/30 text-white font-mono px-4 py-3 focus:outline-none focus:border-neon-purple transition-colors"
                placeholder="••••••••" minLength={8}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(191, 0, 255, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              type="submit" disabled={loading}
              className="w-full py-3 bg-neon-purple/20 border-2 border-neon-purple text-neon-purple font-mono font-bold text-lg hover:bg-neon-purple/30 transition-all disabled:opacity-50"
            >
              {loading ? 'CREATING ACCOUNT...' : '> REGISTER'}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-gray-500 font-mono text-sm">
            HAVE ACCOUNT?{' '}
            <Link to="/login" className="text-neon-cyan hover:text-neon-purple transition-colors">LOGIN</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
