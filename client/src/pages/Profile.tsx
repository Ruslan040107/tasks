import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import type { User, UserStats } from '../types';
import { useAuthStore } from '../store/authStore';

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const { user: currentUser, updateUser } = useAuthStore();
  const isOwner = currentUser?.id === id;

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/api/users/${id}`),
      api.get(`/api/users/${id}/stats`),
    ]).then(([userRes, statsRes]) => {
      setUser(userRes.data.data);
      setBio(userRes.data.data.bio || '');
      setStats(statsRes.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    try {
      const res = await api.put(`/api/users/${id}`, { bio });
      setUser(res.data.data);
      updateUser({ bio: res.data.data.bio });
      setEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <p className="text-neon-pink font-mono">USER NOT FOUND</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass border border-neon-cyan/30 p-8 mb-8">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="w-24 h-24 rounded-full bg-neon-cyan/20 border-2 border-neon-cyan flex items-center justify-center text-4xl font-bold font-mono neon-text-cyan">
              {user.username[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold font-mono text-white mb-1">{user.username}</h1>
              <p className="text-neon-cyan font-mono text-sm mb-3">{user.email}</p>
              {editing ? (
                <div className="flex gap-3 flex-wrap">
                  <input
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    className="flex-1 bg-dark-700 border border-neon-cyan/50 text-white font-mono px-3 py-2 text-sm focus:outline-none"
                    placeholder="Your bio..."
                    maxLength={500}
                  />
                  <button onClick={handleSave} className="px-4 py-2 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan font-mono text-sm">SAVE</button>
                  <button onClick={() => setEditing(false)} className="px-4 py-2 border border-gray-600 text-gray-400 font-mono text-sm">CANCEL</button>
                </div>
              ) : (
                <p className="text-gray-400 font-mono text-sm">{user.bio || (isOwner ? 'No bio yet. Click edit to add one!' : 'No bio')}</p>
              )}
            </div>
            {isOwner && !editing && (
              <button onClick={() => setEditing(true)} className="px-4 py-2 border border-neon-purple/50 text-neon-purple font-mono text-sm hover:bg-neon-purple/10">
                EDIT
              </button>
            )}
          </div>
          <p className="text-gray-600 font-mono text-xs mt-4">
            MEMBER SINCE {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </motion.div>

        {stats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h2 className="text-2xl font-bold font-mono neon-text-purple mb-6">STATS</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'GAMES PLAYED', value: stats.totalGamesPlayed },
                { label: 'TOTAL SCORE', value: stats.totalScore.toLocaleString() },
                { label: 'WINS', value: stats.gamesWon },
                { label: 'LOSSES', value: stats.gamesLost },
              ].map(s => (
                <div key={s.label} className="glass border border-white/10 p-4 text-center">
                  <div className="text-2xl font-bold font-mono neon-text-cyan mb-1">{s.value}</div>
                  <div className="text-gray-600 font-mono text-xs">{s.label}</div>
                </div>
              ))}
            </div>

            {Object.entries(stats.gameStats).length > 0 && (
              <div className="glass border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-dark-800">
                      {['GAME', 'PLAYED', 'HIGH SCORE', 'AVG SCORE'].map(h => (
                        <th key={h} className="text-left px-6 py-4 text-gray-500 font-mono text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.gameStats).map(([slug, s]) => (
                      <tr key={slug} className="border-b border-white/5">
                        <td className="px-6 py-4 font-mono text-neon-cyan">{slug.toUpperCase()}</td>
                        <td className="px-6 py-4 font-mono text-white">{s.gamesPlayed}</td>
                        <td className="px-6 py-4 font-mono text-neon-green font-bold">{s.highScore.toLocaleString()}</td>
                        <td className="px-6 py-4 font-mono text-gray-400">{s.averageScore.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;
