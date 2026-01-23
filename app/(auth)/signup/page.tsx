"use client";

import { useState } from "react";
import Link from "next/link";
import { signUpWithEmail } from "../../../lib/auth";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { data, error } = await signUpWithEmail(email, password);

    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    // If email confirmation is OFF, user is already signed in
    if (data.session) {
      router.push("/leaderboard");
      return;
    }

    setMsg(
      "Account created. Check your email for a confirmation link (if email confirmations are enabled)."
    );
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl font-bold">Create account</h1>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm text-white/70">Email</label>
            <input
              className="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/30"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70">Password</label>
            <input
              className="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/30"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-lg bg-white px-4 py-2 font-medium text-black hover:bg-white/90 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        {msg && <p className="mt-4 text-sm text-white/70">{msg}</p>}

        <p className="mt-6 text-sm text-white/60">
          Already have an account?{" "}
          <Link className="underline" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
