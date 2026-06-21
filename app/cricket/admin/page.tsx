'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new dashboard
    router.replace('/cricket/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 flex items-center justify-center">
      <p className="text-slate-500">Redirecting to dashboard...</p>
    </div>
  );
}