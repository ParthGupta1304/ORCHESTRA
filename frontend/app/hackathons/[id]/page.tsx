"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, ArrowRight, Loader2, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface LeaderboardEntry {
  submission_id: string;
  team_name: string;
  total_score: number;
  confidence_tier: string;
  rank: number;
  dimension_scores: Record<string, number>;
  prototype_url: string;
}

const dimLabels: Record<string, { label: string; max: number; color: string }> = {
  innovation: { label: 'Innovation', max: 25, color: 'from-purple-500 to-pink-500' },
  technical: { label: 'Technical', max: 25, color: 'from-blue-500 to-cyan-500' },
  clarity: { label: 'Clarity', max: 20, color: 'from-cyan-500 to-teal-500' },
  business: { label: 'Business', max: 15, color: 'from-green-500 to-emerald-500' },
  presentation: { label: 'Presentation', max: 15, color: 'from-orange-500 to-yellow-500' },
};

export default function HackathonDetailPage() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hackathonId, setHackathonId] = useState<string | null>(null);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    setHackathonId(id);

    if (id) {
      fetch(`http://localhost:8000/api/leaderboard/${id}`)
        .then(res => res.json())
        .then(resData => {
          if (resData.success) setData(resData.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, []);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-500';
  };

  return (
    <div className="min-h-screen p-6 md:p-8 pt-8">
      <div className="max-w-6xl mx-auto">
        {/* Back */}
        <Link href="/hackathons" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Hackathons
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">Hackathon Leaderboard</h1>
          </div>
          <p className="text-lightgray-500 text-lg">Rankings for this hackathon, evaluated by the Orchestra AI pipeline.</p>
        </motion.div>

        {loading ? (
          <div className="glass-card p-16 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
            <p>Loading leaderboard...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="glass-card p-16 text-center text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="mb-2">No submissions evaluated yet for this hackathon.</p>
            <p className="text-sm text-gray-600">The AI pipeline may still be processing. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top 3 Podium */}
            {data.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
              >
                {data.slice(0, 3).map((entry, idx) => (
                  <Link href={`/results/${entry.submission_id}`} key={entry.submission_id}>
                    <div className={`glass-card glass-card-hover p-6 text-center cursor-pointer ${
                      idx === 0 ? 'md:order-2 ring-1 ring-yellow-500/20' :
                      idx === 1 ? 'md:order-1' : 'md:order-3'
                    }`}>
                      <div className={`text-4xl mb-3 ${idx === 0 ? 'text-5xl' : ''}`}>
                        {['🥇', '🥈', '🥉'][idx]}
                      </div>
                      <h3 className="text-white font-bold text-lg mb-1">{entry.team_name}</h3>
                      <p className={`text-3xl font-black ${getRankStyle(entry.rank)} mb-2`}>
                        {Math.round(entry.total_score)}
                        <span className="text-lg text-gray-600">/100</span>
                      </p>
                      <span className={`badge ${
                        entry.confidence_tier === 'High' ? 'badge-high' :
                        entry.confidence_tier === 'Medium' ? 'badge-medium' : 'badge-low'
                      }`}>
                        {entry.confidence_tier}
                      </span>

                      {/* Mini dimension scores */}
                      <div className="mt-4 space-y-2">
                        {Object.entries(entry.dimension_scores).map(([dim, score]) => {
                          const info = dimLabels[dim];
                          if (!info) return null;
                          return (
                            <div key={dim} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-20 text-left truncate">{info.label}</span>
                              <div className="flex-1 h-1.5 bg-white/25 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${info.color}`}
                                  style={{ width: `${(score / info.max) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 font-mono w-8 text-right">{Math.round(score)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}

            {/* Full Table */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/40 bg-white/[0.18]">
                      <th className="p-4 pl-6 font-semibold text-gray-400 text-sm">Rank</th>
                      <th className="p-4 font-semibold text-gray-400 text-sm">Team</th>
                      <th className="p-4 font-semibold text-gray-400 text-sm">Confidence</th>
                      {Object.values(dimLabels).map(d => (
                        <th key={d.label} className="p-4 font-semibold text-gray-400 text-sm text-center">{d.label}</th>
                      ))}
                      <th className="p-4 font-semibold text-gray-400 text-sm">Total</th>
                      <th className="p-4 pr-6 font-semibold text-gray-400 text-sm text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((entry, idx) => (
                      <motion.tr
                        key={entry.submission_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + idx * 0.03 }}
                        className="border-b border-white/25 hover:bg-white/[0.18] transition-colors group"
                      >
                        <td className={`p-4 pl-6 font-bold ${getRankStyle(entry.rank)}`}>
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
                        {Object.keys(dimLabels).map(dim => (
                          <td key={dim} className="p-4 text-center text-sm text-gray-400 font-mono">
                            {entry.dimension_scores[dim] !== undefined ? Math.round(entry.dimension_scores[dim]) : '—'}
                          </td>
                        ))}
                        <td className="p-4">
                          <span className="text-white font-bold text-lg">{Math.round(entry.total_score)}</span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <Link href={`/results/${entry.submission_id}`}>
                            <button className="flex items-center gap-1 ml-auto text-sm text-purple-400 hover:text-purple-300 transition-colors">
                              Audit <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
