// /app/(app)/account/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ArrowRight, Trash2, User } from "lucide-react";
import Link from "next/link";

function normalizeDisplayName(s: string) {
  return s.trim();
}

function validateDisplayName(name: string) {
  const n = normalizeDisplayName(name);

  if (n.length < 3) return "Display name must be at least 3 characters.";
  if (n.length > 20) return "Display name must be 20 characters or fewer.";
  if (!/^[a-zA-Z0-9_]+$/.test(n))
    return "Use only letters, numbers, and underscores (_). No spaces.";
  return null;
}

export default function AccountPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [currentName, setCurrentName] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const nameError = useMemo(() => validateDisplayName(nameInput), [nameInput]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setMsg(null);
      setOk(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        setMsg(error.message);
        setOk(false);
      } else {
        const dn = data?.display_name ?? "";
        setCurrentName(dn);
        setNameInput(dn);
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function checkNameAvailable(name: string) {
    // Best-effort check. If RLS blocks SELECT on other users, DB unique constraint should still protect.
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("display_name", name)
      .limit(1);

    if (error) return { available: true, reason: null as string | null }; // fallback
    if (!data || data.length === 0) return { available: true, reason: null };
    if (data[0].id === userId) return { available: true, reason: null };
    return { available: false, reason: "That display name is already taken." };
  }

  async function saveDisplayName() {
    if (!userId) return;
    setMsg(null);
    setOk(false);

    const err = validateDisplayName(nameInput);
    if (err) {
      setMsg(err);
      return;
    }

    const normalized = normalizeDisplayName(nameInput);

    setSaving(true);
    try {
      const avail = await checkNameAvailable(normalized);
      if (!avail.available) {
        setMsg(avail.reason);
        setOk(false);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({ id: userId, display_name: normalized }, { onConflict: "id" });

      if (error) {
        setMsg(error.message);
        setOk(false);
        return;
      }

      setCurrentName(normalized);
      setOk(true);
      setMsg("Display name updated.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function deleteAccount() {
    setDeleting(true);
    setMsg(null);
    setOk(false);

    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        setMsg(sessionErr.message);
        return;
      }

      const token = sessionData.session?.access_token;
      if (!token) {
        setMsg("You must be logged in to delete your account.");
        return;
      }

      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(json?.error ?? "Failed to delete account.");
        return;
      }

      await supabase.auth.signOut();
      router.push("/");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to delete account.");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set a unique display name for leaderboards and submissions.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl border border-border bg-accent/40 grid place-items-center"
            style={{ boxShadow: "var(--p1-glow)" }}
          >
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">Display name</div>
            <div className="text-xs text-muted-foreground">
              Current: <span className="text-foreground font-semibold">{currentName || "Not set"}</span>
            </div>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent/40"
          >
            Sign out <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-foreground">Choose a unique name</label>
          <input
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none
                       focus-visible:ring-2 focus-visible:ring-ring"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="example: SyedF1_26"
            autoComplete="off"
          />

          <div className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Use only letters, numbers, and underscores. Please pick an appropriate name. Inappropriate names may result
            in account deletion.
          </div>

          {msg ? (
            <div
              className={[
                "mt-4 rounded-xl border px-4 py-3 text-sm",
                ok ? "border-border bg-background text-foreground" : "border-destructive/30 bg-destructive/10 text-foreground",
              ].join(" ")}
            >
              {msg}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveDisplayName}
              disabled={saving || !!nameError}
              className={[
                "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
                saving || !!nameError
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:opacity-95",
              ].join(" ")}
              style={!(saving || !!nameError) ? { boxShadow: "var(--p1-glow)" } : undefined}
            >
              {saving ? "Saving..." : "Save display name"}
            </button>

            <Link
              href="/leaderboard"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-accent/40"
            >
              Go to leaderboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {nameError ? (
            <div className="mt-2 text-xs text-destructive">{nameError}</div>
          ) : null}
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 md:p-6">
        <div className="text-sm font-semibold text-foreground">Danger zone</div>
        <p className="mt-2 text-sm text-muted-foreground">
          Deleting your account is permanent and removes your profile and predictions.
        </p>

        {!deleteOpen ? (
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete account
          </button>
        ) : (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-background p-4">
            <div className="text-sm font-semibold text-foreground">Confirm deletion</div>
            <div className="mt-1 text-sm text-muted-foreground">
              This cannot be undone. Are you sure?
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={deleteAccount}
                disabled={deleting}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                  deleting
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-destructive text-destructive-foreground hover:opacity-95",
                ].join(" ")}
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>

              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent/40"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}