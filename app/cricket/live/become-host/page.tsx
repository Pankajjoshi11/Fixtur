'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCog, CheckCircle, Trophy, Calendar, Users } from 'lucide-react';

export default function BecomeHostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBecomeHost = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'HOST' }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/cricket/host/dashboard');
        }, 2000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to upgrade to host');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 text-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <CheckCircle size={64} className="mx-auto text-emerald-500 mb-4" />
          <h1 className="text-2xl font-bold text-emerald-400 mb-2">Welcome, Host!</h1>
          <p className="text-slate-400">
            You are now a tournament host. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <UserCog size={64} className="mx-auto text-emerald-500 mb-4" />
          <h1 className="text-3xl font-bold text-emerald-400 mb-2">Become a Host</h1>
          <p className="text-slate-400">
            Create and manage your own tournaments, teams, and matches.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Host Privileges</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Trophy size={20} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300">Create and manage your own tournaments</span>
            </li>
            <li className="flex items-start gap-3">
              <Users size={20} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300">Add and manage teams and players</span>
            </li>
            <li className="flex items-start gap-3">
              <Calendar size={20} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300">Schedule matches and run live scoring</span>
            </li>
          </ul>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Important Notes</h2>
          <ul className="text-sm text-slate-400 space-y-2">
            <li>• You can edit tournament details at any time</li>
            <li>• You can add or remove players from your tournaments</li>
            <li>• You have full control over matches in your tournaments</li>
            <li>• Super Admins can view and manage all tournaments</li>
          </ul>
        </div>

        <button
          onClick={handleBecomeHost}
          disabled={loading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          {loading ? 'Processing...' : 'Become a Host'}
        </button>

        <p className="text-center text-sm text-slate-500 mt-4">
          By becoming a host, you agree to manage your tournaments responsibly.
        </p>
      </div>
    </div>
  );
}