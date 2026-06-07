'use client';

import React from 'react';
import { Sparkles, Terminal, BookOpen, CheckCircle, ShieldAlert } from 'lucide-react';

export function AuthHero() {
  return (
    <div className="w-full max-w-lg flex flex-col gap-8 relative z-10">
      {/* Background glowing decorations */}
      <div className="absolute -top-32 -left-32 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl" />

      {/* Main SaaS Brand Section */}
      <div className="flex flex-col gap-2 text-white">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm tracking-wider uppercase">
          <Sparkles className="w-4 h-4 animate-pulse" />
          AI-Powered Prep Platform
        </div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
          Master Your Next Tech Interview
        </h2>
        <p className="text-slate-400 text-base max-w-sm mt-1">
          Prepare with contextual AI guidance, detailed progress analytics, and expert technical insights.
        </p>
      </div>

      {/* Showcase Grid / Feature Highlights */}
      <div className="flex flex-col gap-4">
        {/* Glass Card 1: AI Assitant */}
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-5 rounded-2xl flex gap-4 transition-all hover:translate-y-[-2px]">
          <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-xl h-fit">
            <Terminal className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-semibold text-slate-200">Interactive Code Questions</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Navigate question-by-question across core engineering topics like JavaScript, SQL, and Architecture.
            </p>
          </div>
        </div>

        {/* Glass Card 2: Hint Box Mockup */}
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-5 rounded-2xl flex gap-4 transition-all hover:translate-y-[-2px]">
          <div className="bg-teal-500/10 text-teal-400 p-3 rounded-xl h-fit">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <h4 className="text-sm font-semibold text-slate-200">Ask AI Hint Guidance</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Request guidance once per question. Returns concept resources without giving direct solutions.
            </p>
            {/* Embedded Hint Mockup */}
            <div className="bg-slate-900/60 border border-slate-700/30 p-3 rounded-lg flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-[10px] text-teal-400 uppercase tracking-widest font-semibold">
                <Sparkles className="w-3 h-3" />
                AI Hint Generation
              </div>
              <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                "Think about variable scopes. Closures allow functions to retain lexical reference to outer variables even after execution context is closed."
              </p>
            </div>
          </div>
        </div>

        {/* Glass Card 3: Progress Tracker Mockup */}
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-5 rounded-2xl flex gap-4 transition-all hover:translate-y-[-2px]">
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl h-fit">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-semibold text-slate-200">Session Completion Metrics</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete your assessment to generate metrics, duration stats, and individual AI assistance telemetry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
