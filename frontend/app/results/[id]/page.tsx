"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Target, CheckCircle, AlertTriangle, ShieldAlert, Edit3, X, Save, ExternalLink, Download } from 'lucide-react';
import Link from 'next/link';

interface Override {
  id: string;
  dimension: string;
  original_score: number;
  new_score: number;
  reason: string;
  judge_name: string;
  created_at: string;
}

interface AgentOutput {
  dimension: string;
  score: number;
  max_score: number;
  evidence: string[];
  strengths: string[];
  improvements: string[];
  confidence: string;
}

interface SubResult {
  id: string;
  team_name: string;
  total_score: number;
  confidence_tier: string;
  prototype_url: string;
  dimension_scores: Record<string, number>;
  agent_outputs: AgentOutput[];
  bias_flags: string[];
  feedback_report: string;
  overrides: Override[];
}

const dimConfig: Record<string, { label: string; max: number; color: string; bgColor: string }> = {
  innovation: { label: 'Innovation', max: 25, color: 'bg-purple-500', bgColor: 'bg-purple-500/10' },
  technical: { label: 'Technical', max: 25, color: 'bg-blue-500', bgColor: 'bg-blue-500/10' },
  clarity: { label: 'Clarity', max: 20, color: 'bg-cyan-500', bgColor: 'bg-cyan-500/10' },
  business: { label: 'Business', max: 15, color: 'bg-green-500', bgColor: 'bg-green-500/10' },
  presentation: { label: 'Presentation', max: 15, color: 'bg-orange-500', bgColor: 'bg-orange-500/10' },
};

export default function ResultDetailsPage() {
  const [data, setData] = useState<SubResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [overrideOpen, setOverrideOpen] = useState<string | null>(null);
  const [overrideScore, setOverrideScore] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideJudge, setOverrideJudge] = useState('');
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const handleDownloadReport = () => {
    if (!data || !data.feedback_report) return;
    const blob = new Blob([data.feedback_report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.team_name.replace(/\s+/g, '_')}_Feedback_Report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const token = localStorage.getItem('orchestra_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const pathParts = window.location.pathname.split('/');
    const resultId = pathParts[pathParts.length - 1];
    setSubmissionId(resultId);

    if (resultId) {
      fetch(`https://orchestra-w0rz.onrender.com/api/results/${resultId}`)
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success) setData(resData.data);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const handleOverrideSubmit = async (dimension: string) => {
    if (!submissionId || !overrideScore || !overrideReason) return;
    setOverrideSaving(true);

    try {
      const res = await fetch(`https://orchestra-w0rz.onrender.com/api/override/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimension,
          new_score: parseFloat(overrideScore),
          reason: overrideReason,
          judge_name: overrideJudge || 'Manual Override',
        }),
      });
      const result = await res.json();
      if (result.success) {
        // Refresh data
        const refreshRes = await fetch(`https://orchestra-w0rz.onrender.com/api/results/${submissionId}`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) setData(refreshData.data);
        setOverrideOpen(null);
        setOverrideScore('');
        setOverrideReason('');
        setOverrideJudge('');
      }
    } catch (err) {
      console.error('Override failed:', err);
    } finally {
      setOverrideSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold text-white">Audit Not Found</h1>
        <Link href="/hackathons" className="text-purple-400 underline">Back to Leaderboard</Link>
      </div>
    );
  }

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-white mt-4 mb-2">{line.slice(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold text-gray-200 mt-4 mb-1">{line.slice(3)}</h2>;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-gray-200 mb-1">{line.replace(/\*\*/g, '')}</p>;
      if (line.startsWith('> ')) return <blockquote key={i} className="border-l-2 border-purple-500/40 pl-3 text-gray-400 italic my-2">{line.slice(2)}</blockquote>;
      if (line.startsWith('- ')) return <li key={i} className="text-gray-400 ml-4 list-disc mb-0.5">{line.slice(2)}</li>;
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={i} className="text-gray-400 mb-0.5">
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-gray-200">{part}</strong> : part)}
          </p>
        );
      }
      if (line.trim() === '') return <div key={i} className="h-2" />;
      return <p key={i} className="text-gray-400 mb-0.5">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen p-6 md:p-8 pt-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/hackathons" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
        </Link>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-3">
                {data.team_name}
              </h1>
              <div className="flex items-center gap-3">
                <span className={`badge ${
                  data.confidence_tier === 'High' ? 'badge-high' :
                  data.confidence_tier === 'Medium' ? 'badge-medium' : 'badge-low'
                }`}>
                  {data.confidence_tier} Confidence
                </span>
                <span className="text-gray-500 text-sm">AI Agent Evaluation</span>
                {data.prototype_url && (
                  <a href={data.prototype_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300">
                    <ExternalLink className="w-3 h-3" /> Prototype
                  </a>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-gray-500 uppercase tracking-widest text-xs font-semibold mb-1">Total Score</p>
              <p className="text-5xl md:text-6xl font-black text-white">
                {Math.round(data.total_score)}
                <span className="text-xl text-gray-600">/100</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Overrides History */}
        {data.overrides && data.overrides.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-6 mb-6 border-yellow-500/10"
          >
            <h2 className="text-lg font-bold flex items-center gap-2 text-yellow-400 mb-4">
              <Edit3 className="w-5 h-5" /> Score Overrides
            </h2>
            <div className="space-y-2">
              {data.overrides.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl text-sm">
                  <div>
                    <span className="capitalize text-white font-medium">{o.dimension}</span>
                    <span className="text-gray-500 mx-2">•</span>
                    <span className="text-gray-400">{o.original_score} → <span className="text-yellow-400 font-semibold">{o.new_score}</span></span>
                  </div>
                  <div className="text-gray-500 text-xs">
                    by {o.judge_name} • {new Date(o.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dimension Scores */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-1 glass-card p-6 space-y-5"
          >
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" /> Dimensions
            </h2>
            <div className="space-y-4">
              {Object.entries(data.dimension_scores).map(([dim, score]) => {
                const cfg = dimConfig[dim];
                if (!cfg) return null;
                const pct = (score / cfg.max) * 100;

                return (
                  <div key={dim} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${cfg.color}`} />
                        <span className="text-gray-300 text-sm capitalize">{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{Math.round(score)}<span className="text-gray-600">/{cfg.max}</span></span>
                        <button
                          onClick={() => {
                            setOverrideOpen(overrideOpen === dim ? null : dim);
                            setOverrideScore(String(score));
                          }}
                          className="p-1 hover:bg-white/25 rounded text-gray-600 hover:text-purple-400 transition-colors"
                          title="Override score"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-white/25 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${cfg.color} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>

                    {/* Override Form */}
                    <AnimatePresence>
                      {overrideOpen === dim && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-white/[0.18] border border-white/25 rounded-xl space-y-3 mt-2">
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={overrideScore}
                                onChange={(e) => setOverrideScore(e.target.value)}
                                className="w-20 px-3 py-2 bg-black/20 border border-white/40 rounded-lg text-sm text-white"
                                min={0}
                                max={cfg.max}
                                step={0.5}
                                placeholder="Score"
                              />
                              <input
                                type="text"
                                value={overrideJudge}
                                onChange={(e) => setOverrideJudge(e.target.value)}
                                className="flex-1 px-3 py-2 bg-black/20 border border-white/40 rounded-lg text-sm text-white placeholder-gray-600"
                                placeholder="Your name"
                              />
                            </div>
                            <input
                              type="text"
                              value={overrideReason}
                              onChange={(e) => setOverrideReason(e.target.value)}
                              className="w-full px-3 py-2 bg-black/20 border border-white/40 rounded-lg text-sm text-white placeholder-gray-600"
                              placeholder="Reason for override..."
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOverrideSubmit(dim)}
                                disabled={overrideSaving || !overrideReason}
                                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/30 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                              >
                                {overrideSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                Save
                              </button>
                              <button
                                onClick={() => setOverrideOpen(null)}
                                className="px-4 py-2 border border-white/40 text-gray-400 rounded-lg text-sm hover:bg-white/25 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-1 lg:col-span-2 space-y-6"
          >
            {/* Bias Flags */}
            {data.bias_flags && data.bias_flags.length > 0 && (
              <div className="glass-card p-6 border-red-500/10">
                <h2 className="text-lg font-bold flex items-center gap-2 text-red-400 mb-4">
                  <ShieldAlert className="w-5 h-5" /> Bias Flags
                </h2>
                <ul className="space-y-2">
                  {data.bias_flags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Feedback Report */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" /> Feedback Report
                </h2>
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-400 bg-purple-400/10 hover:bg-purple-400/20 rounded-lg transition-colors border border-purple-400/20"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
              <div className="markdown-content">
                {renderMarkdown(data.feedback_report || '')}
              </div>
            </div>

            {/* Agent Outputs */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                <AlertTriangle className="w-5 h-5 text-yellow-400" /> Agent Diagnostics
              </h2>
              <div className="space-y-4">
                {((Array.isArray(data.agent_outputs) ? data.agent_outputs : Object.values(data.agent_outputs)) as any[])
                  .filter((output: any) => output && output.dimension)
                  .map((output: any) => {
                    const cfg = dimConfig[output.dimension] || { label: output.dimension, color: 'bg-gray-500', bgColor: 'bg-gray-500/10' };
                    return (
                      <div key={output.dimension} className="p-5 bg-white/[0.15] border border-white/25 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${cfg.color}`} />
                            <h3 className="font-bold text-white capitalize">{cfg.label} Agent</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">{output.score}/{output.max_score}</span>
                            <span className={`badge ${
                              output.confidence === 'high' ? 'badge-high' :
                              output.confidence === 'medium' ? 'badge-medium' : 'badge-low'
                            }`}>
                              {output.confidence}
                            </span>
                          </div>
                        </div>

                        {output.strengths && output.strengths.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">Strengths</p>
                            <ul className="space-y-1">
                              {output.strengths.map((s: string, i: number) => (
                                <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {output.improvements && output.improvements.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-1">Improvements</p>
                            <ul className="space-y-1">
                              {output.improvements.map((imp: string, i: number) => (
                                <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                                  <AlertTriangle className="w-3 h-3 text-yellow-500 mt-1 flex-shrink-0" />
                                  {imp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {output.evidence && output.evidence.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Evidence</p>
                            <ul className="space-y-1">
                              {output.evidence.map((e: string, i: number) => (
                                <li key={i} className="text-sm text-gray-500">{e}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
