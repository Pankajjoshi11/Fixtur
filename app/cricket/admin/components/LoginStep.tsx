import React, { useState } from 'react';

export default function LoginStep({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@gmail.com' && password === 'admin') {
      onLoginSuccess();
    } else {
      setLoginError('Invalid credentials');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-lg">
      <h2 className="text-xl font-bold mb-6">Admin Login</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-slate-200 focus:outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-slate-200 focus:outline-none focus:border-emerald-500" />
        </div>
        {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded transition-colors">
          Login
        </button>
      </form>
    </div>
  );
}