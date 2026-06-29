"use client";

import { useSession } from "next-auth/react";
import LiveViewerDashboard from './LiveViewerDashboard';

export default function LivePage() {
  const { data: session, status } = useSession();
  
  const user = session?.user ? {
    id: (session.user as any).id || '',
    email: session.user.email || '',
    name: session.user.name || '',
    image: session.user.image || '',
  } : null;

  const playerId = session?.user ? (session.user as any).playerId : undefined;
  const userRole = session?.user ? (session.user as any).role || 'USER' : 'USER';

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return <LiveViewerDashboard user={user} playerId={playerId} userRole={userRole} />;
}