"use client";

import Link from "next/link";

export default function AuthButtons() {
  return (
    <>
      <Link
        href="/cricket/live/login"
        className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
      >
        Login
      </Link>
      <Link
        href="/cricket/live/signup"
        className="text-sm font-medium text-white bg-emerald-600 px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
      >
        Sign Up
      </Link>
    </>
  );
}
