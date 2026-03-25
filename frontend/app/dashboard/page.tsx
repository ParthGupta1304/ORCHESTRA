"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Trophy, Zap, ArrowRight, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  total_submissions: number;
  average_score: number;
  top_team: { team_name: string; total_score: number } | null;
}

interface Hackathon {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8000/api/stats').then(r => r.json()),
      fetch('http://localhost:8000/api/hackathons').then(r => r.json()),
    ])
      .then(([statsRes, hackRes]) => {
        if (statsRes.success) setStats(statsRes.data);
        if (hackRes.success) setHackathons(hackRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const },
    }),
  };

  const statCards = [
    {
      label: 'Total Submissions',
      value: stats?.total_submissions ?? '—',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Average Score',
      value: stats?.average_score ? `${stats.average_score}` : '—',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Top Team',
      value: stats?.top_team?.team_name ?? 'N/A',
      subValue: stats?.top_team ? `Score: ${Math.round(stats.top_team.total_score)}` : '',
      icon: Trophy,
      color: 'from-yellow-500 to-orange-500',
      bg: 'bg-yellow-500/10',
    },
    {
      label: 'Hackathons',
      value: hackathons.length,
      icon: Zap,
      color: 'from-green-500 to-emerald-500',
      bg: 'bg-green-500/10',
    },
  ];

  return (
    <div className="min-h-screen p-6 md:p-8 pt-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">Dashboard</h1>
          </div>
          <p className="text-gray-500 text-lg">Overview of all hackathon evaluations across the platform.</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statCards.map((card, idx) => (
            <motion.div
              key={card.label}
              custom={idx}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="glass-card glass-card-hover p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 bg-gradient-to-r ${card.color} bg-clip-text`} style={{ color: 'inherit' }} />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-white truncate">{card.value}</p>
              {card.subValue && (
                <p className="text-xs text-gray-500 mt-1">{card.subValue}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Hackathons List + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hackathons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Recent Hackathons
              </h2>
              <Link href="/hackathons" className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : hackathons.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hackathons created yet.</p>
                <Link href="/upload" className="text-purple-400 text-sm mt-2 inline-block hover:underline">
                  Upload your first CSV →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {hackathons.slice(0, 5).map((hack, idx) => (
                  <motion.div
                    key={hack.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}
                  >
                    <Link href={`/hackathons/${hack.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/20 hover:bg-white/[0.04] transition-all duration-200 group cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center border border-purple-500/10">
                            <Trophy className="w-4 h-4 text-purple-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{hack.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {new Date(hack.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/upload">
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/15 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">New Evaluation</p>
                      <p className="text-xs text-gray-500">Upload CSV & start scoring</p>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/hackathons">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-purple-500/20 transition-all cursor-pointer group mt-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">View Leaderboard</p>
                      <p className="text-xs text-gray-500">See all ranked teams</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Pipeline Info */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Evaluation Pipeline</h3>
              <div className="space-y-3">
                {[
                  { name: 'Innovation Judge', score: '/25', color: 'bg-purple-500' },
                  { name: 'Technical Judge', score: '/25', color: 'bg-blue-500' },
                  { name: 'Clarity Judge', score: '/20', color: 'bg-cyan-500' },
                  { name: 'Business Judge', score: '/15', color: 'bg-green-500' },
                  { name: 'Presentation Judge', score: '/15', color: 'bg-orange-500' },
                ].map(judge => (
                  <div key={judge.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${judge.color}`} />
                      <span className="text-gray-400">{judge.name}</span>
                    </div>
                    <span className="text-gray-600 font-mono text-xs">{judge.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
