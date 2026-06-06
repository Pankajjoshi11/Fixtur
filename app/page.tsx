import Link from 'next/link';
import { ArrowRight, Trophy, Activity } from 'lucide-react';
// Assuming Shadcn UI Card components are available at these paths in the full project
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SportSelectionHub() {
  return (
    <main className="min-h-screen bg-zinc-950 text-slate-50 selection:bg-emerald-500/30 flex flex-col items-center justify-center p-6 sm:p-24">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-zinc-950 -z-10"></div>
      
      <div className="max-w-4xl w-full space-y-12 text-center">
        <div className="space-y-4 animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-500">
            Fixtur.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light">
            The premium multi-sport management and live-streaming platform. Select a discipline to access live dashboards and administration panels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mt-12">
          {/* Cricket Card */}
          <Link href="/cricket" className="group">
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 transition-all duration-300 hover:border-emerald-500/50 hover:bg-zinc-800/80 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] h-full flex flex-col text-left">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity size={120} />
              </div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-100 mb-3 group-hover:text-emerald-400 transition-colors">Cricket</h2>
                  <p className="text-slate-400 leading-relaxed mb-8">
                    Access the automated live scoring engine, dynamic points tables, and complete tournament administration interface.
                  </p>
                </div>
                
                <div className="flex items-center text-emerald-400 font-medium">
                  <span>Launch Portal</span>
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </Link>

          {/* Football Card */}
          <Link href="/football" className="group">
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 transition-all duration-300 hover:border-blue-500/50 hover:bg-zinc-800/80 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] h-full flex flex-col text-left">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy size={120} />
              </div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-100 mb-3 group-hover:text-blue-400 transition-colors">Football</h2>
                  <p className="text-slate-400 leading-relaxed mb-8">
                    Preview the structural layout for live scores, tournament tables, and team management dashboards.
                  </p>
                </div>
                
                <div className="flex items-center text-blue-400 font-medium">
                  <span>View Prototype</span>
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}