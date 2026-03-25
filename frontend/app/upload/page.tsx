"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, X, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface UploadResult {
  hackathon_id: string;
  message: string;
  total_submissions: number;
}

interface ProgressData {
  status: string;
  completed: number;
  total: number;
  errors: string[];
}

export default function UploadPage() {
  const [hackathonName, setHackathonName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const pollProgress = (hackathon_id: string) => {
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/hackathon/progress/${hackathon_id}`);
        const data = await res.json();
        if (data.success) {
          setProgress(data.data);
          if (data.data.status === 'completed' || data.data.status === 'unknown or finished') {
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !hackathonName.trim()) return;

    setUploading(true);
    setError(null);
    setResult(null);
    setProgress(null);

    const formData = new FormData();
    formData.append('hackathon_name', hackathonName);
    formData.append('description', description);
    formData.append('csv_file', file);

    try {
      const res = await fetch('http://localhost:8000/api/hackathon/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setResult(data.data);
        pollProgress(data.data.hackathon_id);
      } else {
        setError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error — is the backend running?');
    } finally {
      setUploading(false);
    }
  };

  const isCompleted = progress?.status === 'completed';
  const isProcessing = result && !isCompleted;

  return (
    <div className="min-h-screen p-6 md:p-8 pt-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <Upload className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">Upload Submissions</h1>
          </div>
          <p className="text-gray-500 text-lg">Upload a CSV file with team submissions to start the AI evaluation pipeline.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Hackathon Name */}
              <div className="glass-card p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Hackathon Name *</label>
                  <input
                    type="text"
                    required
                    value={hackathonName}
                    onChange={(e) => setHackathonName(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 transition-all"
                    placeholder="e.g. HackMIT 2025"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Description <span className="text-gray-600">(optional)</span></label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 transition-all resize-none"
                    rows={3}
                    placeholder="Brief description of the hackathon..."
                  />
                </div>
              </div>

              {/* File Upload */}
              <div
                className={`glass-card p-8 text-center cursor-pointer transition-all duration-300 ${
                  file
                    ? 'border-purple-500/30 bg-purple-500/5'
                    : 'hover:border-white/20 hover:bg-white/[0.03]'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file ? (
                  <div className="flex items-center justify-center gap-4">
                    <FileSpreadsheet className="w-10 h-10 text-purple-400" />
                    <div className="text-left">
                      <p className="text-white font-semibold">{file.name}</p>
                      <p className="text-gray-500 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-white font-medium mb-1">Drop your CSV here or click to browse</p>
                    <p className="text-gray-500 text-sm">
                      Required columns: Team Name, GitHub URL, Pitch Deck URL
                    </p>
                  </>
                )}
              </div>

              {/* CSV Format Info */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Expected CSV Columns</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['Team Name', 'GitHub URL', 'Pitch Deck URL', 'Prototype URL'].map(col => (
                    <div key={col} className="px-3 py-2 bg-white/[0.03] border border-white/5 rounded-lg text-xs text-gray-400 font-mono">
                      {col}
                    </div>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={uploading || !file || !hackathonName.trim()}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/30 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-purple-500/10 transition-all flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    Start AI Evaluation
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Success Card */}
              <div className="glass-card p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/15 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Evaluation Started!</h2>
                <p className="text-gray-400 mb-6">
                  {result.total_submissions} submissions are being evaluated by our AI agents.
                </p>
              </div>

              {/* Progress */}
              {progress && (
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Processing Progress</h3>
                    <span className={`badge ${isCompleted ? 'badge-high' : 'badge-medium'}`}>
                      {isCompleted ? 'Completed' : 'Processing'}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>{progress.completed} / {progress.total} evaluated</span>
                      <span>{progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0}%</span>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500"
                        initial={{ width: 0 }}
                        animate={{
                          width: progress.total > 0
                            ? `${(progress.completed / progress.total) * 100}%`
                            : '0%'
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {isProcessing && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                      AI agents are evaluating submissions...
                    </div>
                  )}

                  {progress.errors && progress.errors.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-red-400 font-medium">Errors ({progress.errors.length}):</p>
                      {progress.errors.map((err, i) => (
                        <p key={i} className="text-xs text-gray-500 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
                          {err}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <Link href={`/hackathons/${result.hackathon_id}`} className="flex-1">
                  <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                    View Leaderboard
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <button
                  onClick={() => {
                    setResult(null);
                    setProgress(null);
                    setFile(null);
                    setHackathonName('');
                    setDescription('');
                    if (intervalRef.current) clearInterval(intervalRef.current);
                  }}
                  className="px-6 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 transition-colors font-medium"
                >
                  New Upload
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
