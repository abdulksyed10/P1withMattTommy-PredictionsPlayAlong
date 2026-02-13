// /app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmail } from "../../../lib/auth";
import Image from "next/image";
import { ArrowRight, LogIn } from "lucide-react";

function GlowBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
      <div
        className="absolute -top-24 left-1/2 h-105 w-105 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "var(--p1-gradient)", opacity: 0.16 }}
      />
      <div
        className="absolute top-40 -right-30 h-90 w-90 rounded-full blur-3xl"
        style={{ background: "var(--p1-gradient)", opacity: 0.12 }}
      />
      <div
        className="absolute -bottom-40 -left-40 h-105 w-105 rounded-full blur-3xl"
        style={{ background: "var(--p1-gradient)", opacity: 0.10 }}
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { error } = await signInWithEmail(email, password);

    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    router.push("/leaderboard");
  }

  return (
    <main className="relative overflow-hidden min-h-[calc(100vh-112px)] md:min-h-[calc(100vh-64px)] bg-background text-foreground">
      <GlowBackdrop />

      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">Welcome back</div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Sign in
              </h1>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none
                             focus-visible:ring-2 focus-visible:ring-ring"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none
                             focus-visible:ring-2 focus-visible:ring-ring"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>

              {msg ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">
                  {msg}
                </div>
              ) : null}

              <button
                disabled={loading}
                className={[
                  "w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition",
                  loading
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:opacity-95",
                ].join(" ")}
                style={!loading ? { boxShadow: "var(--p1-glow)" } : undefined}
              >
                <LogIn className="h-4 w-4" />
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="text-right pb-0 mt-1">
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:opacity-90"
              >
                Forgot password?
              </Link>
            </div>

            <div className="mt-5 text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link className="text-primary font-semibold hover:opacity-90" href="/signup">
                Create one <ArrowRight className="inline h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}