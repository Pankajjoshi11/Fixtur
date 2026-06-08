import { Trophy, Shield, ArrowRight, Sparkles, Activity } from "lucide-react"
import Link from "next/link"

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0710] text-white">
      {/* Subtle grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Purple radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(124,58,237,0.35), rgba(124,58,237,0.08), transparent)",
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-12">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs font-semibold tracking-[0.2em] text-white/80">
            VERSION 2026 LIVE DEPLOYMENT
          </span>
        </div>

        {/* Wordmark */}
        <h1 className="mt-16 text-center text-[8rem] font-extrabold leading-none tracking-tighter md:text-[11rem]">
          <span className="text-white">Fixtur</span>
          <span className="text-violet-500">.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-8 max-w-2xl text-center text-lg leading-relaxed text-white/55">
          A unified broadcast-grade operating layer for cricket, football and
          every fixture in between. Select a sport engine to enter the control
          deck.
        </p>

        {/* Cards */}
        <div className="mt-16 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
          
          {/* Cricket - Now a clickable Link */}
          <Link 
            href="/cricket/live"
            className="group relative block rounded-2xl border border-white/10 bg-[#100c18]/80 p-8 transition-colors hover:border-violet-500/40"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15">
                <Trophy className="h-6 w-6 text-violet-300" />
              </div>
              <span className="rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1 text-[11px] font-bold tracking-wider text-violet-300">
                CORE ENGINE
              </span>
            </div>
            <h2 className="mt-10 text-4xl font-bold tracking-tight">Cricket</h2>
            <p className="mt-4 max-w-md leading-relaxed text-white/50">
              Voice-driven live scoring, ball-by-ball telemetry, and tournament
              orchestration.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition-colors group-hover:text-violet-300">
              Enter live deck
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Football */}
          <article className="relative rounded-2xl border border-white/10 bg-[#0d0a13]/80 p-8">
            <div className="flex items-start justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                <Shield className="h-6 w-6 text-white/60" />
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold tracking-wider text-white/50">
                IN DEVELOPMENT
              </span>
            </div>
            <h2 className="mt-10 text-4xl font-bold tracking-tight text-white/85">
              Football
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-white/45">
              Match cards, lineup automations and live event ingestion. Shipping
              soon.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-white/40">
              <Activity className="h-4 w-4" />
              Engine warming up
            </div>
          </article>
        </div>
      </div>
    </main>
  )
}