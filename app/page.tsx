'use client';

import Link from 'next/link';
import { ArrowRight, Trophy, Sparkles, ShieldCheck } from 'lucide-react';

export default function SportSelectionHub() {
  return (
    <main className="relative min-h-screen bg-[#030303] text-slate-50 flex flex-col items-center justify-center p-6 md:p-24 overflow-hidden font-sans select-none w-full">
      
      {/* Background Layering: Pure Subtle Grid Matrix matching the image */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0b0b0e_1px,transparent_1px),linear-gradient(to_bottom,#0b0b0e_1px,transparent_1px)] bg-[size:3rem_3rem] -z-20 pointer-events-none opacity-80"></div>
      
      {/* Deep Amethyst Dark Ambient Glow centered behind title */}
      <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-purple-600/5 rounded-full blur-[140px] pointer-events-none -z-10"></div>

      <div className="max-w-4xl w-full space-y-7 text-center relative z-10 flex flex-col items-center mx-auto">
        
        {/* Top Feature Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#08080a] border border-zinc-800/80 text-[10px] font-bold uppercase tracking-widest text-zinc-400 shadow-md">
          <Sparkles size={11} className="text-purple-400 animate-pulse" />
          <span>Version 2026 Live Deployment</span>
        </div>

        {/* Hero Copy Deck */}
        <div className="space-y-4 max-w-2xl mx-auto pt-1">
          <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-white select-none pr-1">
            Fixtur<span className="text-[#a855f7] drop-shadow-[0_0_25px_rgba(168,85,247,0.65)] font-black">.</span>
          </h1>
          <p className="text-sm md:text-base text-zinc-400 max-w-lg mx-auto font-normal leading-relaxed tracking-normal opacity-75">
            A unified broadcast-grade operating layer for cricket, football and every fixture in between. Select a sport engine to enter the control deck.
          </p>
        </div>

        {/* Dynamic Card Selection Matrix Layout */}
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 mt-12 w-full max-w-[56rem] mx-auto px-2 md:px-0">
          
          {/* Cricket Card Gateway */}
          <Link href="/cricket" className="group relative block w-full md:w-1/2 text-left max-w-md mx-auto md:mx-0">
            <div className="h-full flex flex-col justify-between rounded-2xl border border-zinc-900/60 bg-[#050507] p-8 transition-all duration-300 hover:border-purple-900/50 hover:bg-[#07070b] shadow-2xl shadow-black">
              
              <div>
                <div className="flex justify-between items-center mb-8">
                  <div className="w-10 h-10 rounded-xl bg-[#08080b] border border-zinc-800/50 flex items-center justify-center text-purple-400 shadow-inner">
                    <Trophy size={16} />
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-400 bg-purple-950/20 border border-purple-900/40 px-3 py-1 rounded-full">
                    Core Engine
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  Cricket
                </h2>
                <p className="text-zinc-400 text-sm font-normal leading-relaxed opacity-75">
                  Voice-driven live scoring, ball-by-ball telemetry, and tournament orchestration.
                </p>
              </div>
              
              <div className="flex items-center text-zinc-300 font-semibold text-xs tracking-wide mt-14 group-hover:text-purple-400 transition-colors gap-1.5">
                <span>Enter live deck</span>
                <ArrowRight className="w-4 h-4 transition-transform transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Football Card Gateway */}
          <div className="relative block w-full md:w-1/2 text-left max-w-md mx-auto md:mx-0 opacity-95">
            <div className="h-full flex flex-col justify-between rounded-2xl border border-zinc-900/60 bg-[#050507] p-8 shadow-2xl shadow-black">
              
              <div>
                <div className="flex justify-between items-center mb-8">
                  <div className="w-10 h-10 rounded-xl bg-[#08080b] border border-zinc-800/50 flex items-center justify-center text-zinc-500 shadow-inner">
                    <ShieldCheck size={16} />
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500 bg-zinc-900/40 border border-zinc-800/60 px-3 py-1 rounded-full">
                    In Development
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  Football
                </h2>
                <p className="text-zinc-400 text-sm font-normal leading-relaxed opacity-75">
                  Match cards, lineup automations and live event ingestion. Shipping soon.
                </p>
              </div>
              
              <div className="flex items-center text-zinc-500 font-medium tracking-wide mt-14">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                  <svg className="w-3.5 h-3.5 text-zinc-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Engine warming up</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}