"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Loader2, ArrowRight, Search, Calendar, Users } from 'lucide-react';
import Link from 'next/link';

interface Hackathon {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface LeaderboardEntry {
  submission_id: string;
  team_name: string;
  total_score: number;
  confidence_tier: string;
  rank: number;
  hackathon_id: string;
  dimension_scores: Record<string, number>;
}

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'hackathons' | 'leaderboard'>('hackathons');

  useEffect(() => {
    const token = localStorage.getItem('orchestra_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    Promise.all([
      fetch('https://orchestra-w0rz.onrender.com/api/hackathons').then(r => r.json()),
      fetch('https://orchestra-w0rz.onrender.com/api/leaderboard').then(r => r.json()),
    ])
      .then(([hackRes, lbRes]) => {
        if (hackRes.success) setHackathons(hackRes.data);
        if (lbRes.success) setLeaderboard(lbRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredLeaderboard = leaderboard.filter(e =>
    e.team_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHackathons = hackathons.filter(h =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-500';
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/20';
    if (rank === 2) return 'bg-gray-400/10 border-gray-400/20';
    if (rank === 3) return 'bg-amber-600/10 border-amber-600/20';
    return 'bg-white/[0.15] border-white/25';
  };

  return (
    <div className="min-h-screen p-6 md:p-8 pt-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">Hackathons</h1>
          </div>
          <p className="text-gray-500 text-lg">Browse hackathons and view the global leaderboard.</p>
        </motion.div>

        {/* Tabs + Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
        >
          <div className="flex bg-white/25 rounded-xl p-1 border border-white/25">
            <button
              onClick={() => setActiveTab('hackathons')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'hackathons'
                  ? 'bg-purple-500/15 text-purple-300'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Hackathons ({hackathons.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-purple-500/15 text-purple-300'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Global Leaderboard ({leaderboard.length})
              </span>
            </button>
          </div>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white/25 border border-white/40 rounded-xl text-sm text-white placeholder-gray-600 transition-all"
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="glass-card p-16 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
            <p>Connecting to Orchestra backend...</p>
          </div>
        ) : activeTab === 'hackathons' ? (
          /* Hackathons Grid */
          filteredHackathons.length === 0 ? (
            <div className="glass-card p-16 text-center text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hackathons found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHackathons.map((hack, idx) => (
                <motion.div
                  key={hack.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link href={`/hackathons/${hack.id}`}>
                    <div className="glass-card glass-card-hover p-6 h-full cursor-pointer group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center border border-purple-500/10">
                          <Trophy className="w-5 h-5 text-purple-400" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="text-white font-bold text-lg mb-1">{hack.name}</h3>
                      {hack.description && (
                        <p className="text-gray-500 text-sm line-clamp-2 mb-4">{hack.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {new Date(hack.created_at).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric'
                        })}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          /* Global Leaderboard Table */
          <div className="glass-card overflow-hidden">
            {filteredLeaderboard.length === 0 ? (
              <div className="p-16 text-center text-gray-500">
                <p>No submissions evaluated yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/40 bg-white/[0.18]">
                      <th className="p-4 pl-6 font-semibold text-gray-400 text-sm">Rank</th>
                      <th className="p-4 font-semibold text-gray-400 text-sm">Team</th>
                      <th className="p-4 font-semibold text-gray-400 text-sm">Confidence</th>
                      <th className="p-4 font-semibold text-gray-400 text-sm">Score</th>
                      <th className="p-4 pr-6 font-semibold text-gray-400 text-sm text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaderboard.map((entry, idx) => (
                      <motion.tr
                        key={entry.submission_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`border-b border-white/25 hover:bg-white/[0.18] transition-colors group ${getRankBg(entry.rank)}`}
                      >
                        <td className={`p-4 pl-6 font-bold text-lg ${getRankStyle(entry.rank)}`}>
                          {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                        </td>
                        <td className="p-4 text-white font-semibold">{entry.team_name}</td>
                        <td className="p-4">
                          <span className={`badge ${
                            entry.confidence_tier === 'High' ? 'badge-high' :
                            entry.confidence_tier === 'Medium' ? 'badge-medium' : 'badge-low'
                          }`}>
                            {entry.confidence_tier}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-28 bg-white/25 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full"
                                style={{ width: `${Math.min(100, entry.total_score)}%` }}
                              />
                            </div>
                            <span className="text-gray-300 text-sm font-mono font-medium w-8">
                              {Math.round(entry.total_score)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <Link href={`/results/${entry.submission_id}`}>
                            <button className="flex items-center gap-1 ml-auto text-sm text-purple-400 hover:text-purple-300 transition-colors">
                              View Audit <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
