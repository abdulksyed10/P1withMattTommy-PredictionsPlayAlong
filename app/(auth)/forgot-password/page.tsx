"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Mail } from "lucide-react";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setOk(false);

    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      setOk(true);
      setMsg("If an account exists for that email, a reset link has been sent.");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative overflow-hidden min-h-[calc(100vh-112px)] md:min-h-[calc(100vh-64px)] bg-background text-foreground">
      <GlowBackdrop />

      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-3">
            
            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">Account help</div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Reset your password
              </h1>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enter your email and we’ll send you a password reset link.
            </p>

            <form onSubmit={onSubmit} className="mt-4 space-y-4">
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
                <Mail className="h-4 w-4" />
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <div className="mt-5 text-sm text-muted-foreground">
              <Link className="text-primary font-semibold hover:opacity-90" href="/login">
                Back to sign in <ArrowRight className="inline h-4 w-4" />
              </Link>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">
              Tip: check spam/junk if you don’t see the email.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}