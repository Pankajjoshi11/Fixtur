"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import Toast from "@/components/Toast";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        age: parseInt(age),
        gender,
        email,
        password,
      }),
    });
    
    setLoading(false);
    
    if (res.ok) {
      const data = await res.json();
      setToastMessage(`Congratulations! You have registered with Fixtur. Your player ID is ${data.playerId}`);
      setShowToast(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/cricket/live/login");
      }, 3000);
    } else {
      alert("Signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50">
      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={5000}
      />

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/cricket/live" className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <UserPlus className="text-emerald-500" size={28} />
              <div>
                <h1 className="text-xl font-bold text-emerald-500">Fixtur</h1>
                <p className="text-xs text-slate-500">Create your account</p>
              </div>
            </div>
            <Link
              href="/cricket/live/login"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Already have an account? Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Create your account</h2>
            
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-400 mb-1">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-slate-400 mb-1">
                  Age
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  required
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  placeholder="Enter your age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-slate-400 mb-1">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading || showToast}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {loading ? "Creating account..." : showToast ? "Account created!" : "Sign up"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/cricket/live/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}