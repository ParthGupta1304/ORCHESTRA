"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Music, Sparkles, Shield, Zap, BarChart3 } from 'lucide-react';
import Link from 'next/link';

const AetherFlowHero = () => {
    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.15 + 0.3,
                duration: 0.7,
                ease: [0.25, 0.4, 0.25, 1] as const,
            },
        }),
    };

    const features = [
        {
            icon: Sparkles,
            title: "5 Specialist Judges",
            desc: "Innovation, Technical, Business, Presentation & Clarity",
        },
        {
            icon: Shield,
            title: "Bias Auditor",
            desc: "Automated bias detection & score validation",
        },
        {
            icon: BarChart3,
            title: "Real-time Leaderboard",
            desc: "Live rankings with dimension breakdowns",
        },
    ];

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
            {/* Overlay HTML Content */}
            <div className="relative z-10 text-center p-6 max-w-5xl mx-auto">
                <motion.div
                    custom={0}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8 backdrop-blur-sm"
                >
                    <Zap className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-gray-300">
                        AI-Powered Hackathon Evaluation
                    </span>
                </motion.div>

                <motion.div
                    custom={0.5}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center justify-center gap-4 mb-6"
                >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-purple-500/20">
                        <Music className="w-7 h-7 text-white" />
                    </div>
                </motion.div>

                <motion.h1
                    custom={1}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-5xl md:text-8xl font-bold tracking-tighter mb-6 gradient-text"
                >
                    Orchestra
                </motion.h1>

                <motion.p
                    custom={1.5}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 mb-12 leading-relaxed"
                >
                    A multi-agent AI pipeline that evaluates hackathon submissions across 5 dimensions, 
                    detects scoring bias, and generates comprehensive feedback — all automatically.
                </motion.p>

                <motion.div
                    custom={2}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex gap-4 justify-center mb-20"
                >
                    <Link href="/dashboard">
                        <button className="px-8 py-4 bg-white text-black font-semibold rounded-xl shadow-lg hover:bg-gray-100 transition-all duration-300 flex items-center gap-2 hover:shadow-xl hover:scale-[1.02]">
                            Open Dashboard
                            <ArrowRight className="h-5 w-5" />
                        </button>
                    </Link>
                    <Link href="/upload">
                        <button className="px-8 py-4 bg-transparent border border-white/40 text-white font-semibold rounded-xl shadow-lg hover:bg-white/25 hover:border-white/40 transition-all duration-300 flex items-center gap-2">
                            Upload Submissions
                        </button>
                    </Link>
                </motion.div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {features.map((feat, idx) => (
                        <motion.div
                            key={feat.title}
                            custom={2.5 + idx * 0.15}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                            className="glass-card glass-card-hover p-6 text-left text-white"
                        >
                            <feat.icon className="w-8 h-8 text-purple-400 mb-3" />
                            <h2 className="text-white font-semibold mb-1">{feat.title}</h2>
                            <p className="text-lightgray-500 text-sm leading-relaxed">{feat.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AetherFlowHero;
