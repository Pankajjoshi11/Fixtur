'use client';

import { Button } from '@/components/ui/button'; // Assuming you have a Shadcn UI Button component
import { LogIn, UserPlus } from 'lucide-react';

export default function AuthButtons() {
  const handleLogin = () => {
    // Implement login logic here (e.g., open a modal, redirect to login page)
    alert('Login functionality to be implemented. Player ID will be generated upon registration.');
  };

  const handleSignup = () => {
    // Implement signup logic here
    alert('Signup functionality to be implemented. Player ID will be generated upon registration.');
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleLogin} className="text-slate-400 hover:text-white border-zinc-700 hover:border-emerald-500/50"><LogIn size={16} className="mr-2" /> Login</Button>
      <Button variant="default" size="sm" onClick={handleSignup} className="bg-emerald-600 hover:bg-emerald-700 text-white"><UserPlus size={16} className="mr-2" /> Sign Up</Button>
    </div>
  );
}