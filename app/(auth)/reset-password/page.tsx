"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

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

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Supabase sets a recovery session when landing here from the email link.
  // We don't need to parse tokens manually; just ensure the user is in a valid session.
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      // If no session, user likely opened page directly.
      if (!data.session) {
        setMsg("This reset link is invalid or has expired. Please request a new one.");
        setOk(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setOk(false);

    if (password.length < 8) {
      setMsg("Password must be at least 8 characters.");
      return;
    }
    
    // Uppercase, lowercase, and number check
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setMsg("Password must include uppercase, lowercase, and a number.");
      return;
    }

    if (password !== confirm) {
      setMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMsg(error.message);
        setOk(false);
        return;
      }

      setOk(true);
      setMsg("Password updated. You can now sign in.");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to update password.");
      setOk(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-112px)] md:min-h-[calc(100vh-64px)] bg-background text-foreground">
      <GlowBackdrop />

      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-3">

            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">Finalize reset</div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Set a new password
              </h1>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  New password
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none
                             focus-visible:ring-2 focus-visible:ring-ring"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="At least 8 characters, uppercase, lowercase, number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Confirm new password
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none
                             focus-visible:ring-2 focus-visible:ring-ring"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                />
              </div>

              {msg ? (
                <div
                  className={[
                    "rounded-xl border px-4 py-3 text-sm",
                    ok
                      ? "border-border bg-background text-foreground"
                      : "border-destructive/30 bg-destructive/10 text-foreground",
                  ].join(" ")}
                >
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
                <KeyRound className="h-4 w-4" />
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>

            <div className="mt-5 text-sm text-muted-foreground">
              <Link className="text-primary font-semibold hover:opacity-90" href="/login">
                Go to sign in <ArrowRight className="inline h-4 w-4" />
              </Link>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">
              If you opened this page directly, request a new link from{" "}
              <Link className="text-primary font-semibold hover:opacity-90" href="/forgot-password">
                Forgot password
              </Link>
              .
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}