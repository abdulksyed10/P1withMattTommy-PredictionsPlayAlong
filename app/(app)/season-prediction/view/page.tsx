// /app/(app)/season-prediction/view/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

import SectionHeader from "@/components/predictions/SectionHeader";
import QuestionCard from "@/components/predictions/QuestionCard";
import type { DriverRow, TeamRow } from "@/components/predictions/types";

type SeasonLite = { id: string; label: string };

type SeasonPredictionRow = {
  question_id: string;
  answer_driver_id: string | null;
  answer_team_id: string | null;
};

const QUESTION_KEYS = [
  "season_good_surprise",
  "season_big_flop",
  "season_first_time_winner",
  "season_constructors_champion",
  "season_world_champion",
] as const;

const QUESTION_META: Record<(typeof QUESTION_KEYS)[number], { title: string }> = {
  season_good_surprise: { title: "Good Surprise" },
  season_big_flop: { title: "Big Flop" },
  season_first_time_winner: { title: "First-time Race Winner" },
  season_constructors_champion: { title: "Constructors’ Champion" },
  season_world_champion: { title: "World Champion" },
};

function SelectedChip(props: { kind: "driver" | "team"; name: string; code: string }) {
  const { kind, name, code } = props;

  const [imgError, setImgError] = useState(false);

  const src = kind === "driver" ? `/images/drivers/${code}.png` : `/images/teams/${code}.png`;

  return (
    <div className="mt-3 inline-flex items-center gap-5 rounded-2xl border border-border bg-card px-5 py-4">
      {/* 4x+ larger than 40px */}
      <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
        {!imgError ? (
          <Image
            src={src}
            alt={name}
            fill
            sizes="160px"
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
            priority
          />
        ) : (
          <span className="text-base font-semibold text-muted-foreground">{code}</span>
        )}
      </div>

      <div className="leading-tight">
        <div className="text-lg font-semibold text-foreground">{name}</div>
        <div className="text-sm text-muted-foreground">
          {kind === "driver" ? "Driver" : "Team"} • {code}
        </div>
      </div>
    </div>
  );
}

export default function SeasonPredictionViewPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [activeSeason, setActiveSeason] = useState<SeasonLite | null>(null);

  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);

  const [predictionsByKey, setPredictionsByKey] = useState<
    Partial<Record<(typeof QUESTION_KEYS)[number], SeasonPredictionRow>>
  >({});

  // collapse state
  const [open, setOpen] = useState<Record<(typeof QUESTION_KEYS)[number], boolean>>(
    () => Object.fromEntries(QUESTION_KEYS.map((k) => [k, true])) as any
  );

  const fetchInFlight = useRef(false);
  const didInitialLoad = useRef(false);

  const driverById = useMemo(() => {
    const m = new Map<string, DriverRow>();
    for (const d of drivers) m.set(d.id, d);
    return m;
  }, [drivers]);

  const teamById = useMemo(() => {
    const m = new Map<string, TeamRow>();
    for (const t of teams) m.set(t.id, t);
    return m;
  }, [teams]);

  async function loadAll(opts?: { soft?: boolean }) {
    if (fetchInFlight.current) return;
    fetchInFlight.current = true;

    try {
      if (!opts?.soft) setLoading(true);
      setErr(null);

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userData.user ?? null;
      setAuthed(!!user);

      const [
        { data: d, error: de },
        { data: t, error: te },
        { data: s, error: se },
      ] = await Promise.all([
        supabase
          .from("drivers")
          .select("id, code, full_name, is_active")
          .eq("is_active", true)
          .order("full_name", { ascending: true }),
        supabase
          .from("teams")
          .select("id, code, name, is_active")
          .eq("is_active", true)
          .order("name", { ascending: true }),
        supabase
          .from("seasons")
          .select("id, year, name, is_active")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle(),
      ]);

      if (de) throw de;
      if (te) throw te;
      if (se) throw se;

      setDrivers((d ?? []) as DriverRow[]);
      setTeams((t ?? []) as TeamRow[]);

      const season = s ? ({ id: s.id, label: `${s.year} • ${s.name}` } as SeasonLite) : null;
      setActiveSeason(season);

      // If not logged in or no active season, clear and stop.
      if (!user || !season?.id) {
        setPredictionsByKey({});
        return;
      }

      // Map question_id -> key for this season
      const { data: qs, error: qErr } = await supabase
        .from("questions")
        .select("id, key")
        .eq("season_id", season.id)
        .in("key", [...QUESTION_KEYS]);
      if (qErr) throw qErr;

      const qIdToKey = new Map<string, (typeof QUESTION_KEYS)[number]>();
      for (const q of (qs ?? []) as any[]) {
        if (QUESTION_KEYS.includes(q.key)) qIdToKey.set(q.id, q.key);
      }

      // Find set
      const { data: setRow, error: spSetErr } = await supabase
        .from("season_prediction_sets")
        .select("id")
        .eq("user_id", user.id)
        .eq("season_id", season.id)
        .maybeSingle();
      if (spSetErr) throw spSetErr;

      if (!setRow?.id) {
        setPredictionsByKey({});
        return;
      }

      // Predictions
      const { data: preds, error: pErr } = await supabase
        .from("season_predictions")
        .select("question_id, answer_driver_id, answer_team_id")
        .eq("season_prediction_set_id", setRow.id);
      if (pErr) throw pErr;

      const byKey: Partial<Record<(typeof QUESTION_KEYS)[number], SeasonPredictionRow>> = {};
      for (const r of (preds ?? []) as any[]) {
        const key = qIdToKey.get(r.question_id);
        if (!key) continue;
        byKey[key] = r;
      }
      setPredictionsByKey(byKey);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load season predictions.");
    } finally {
      fetchInFlight.current = false;
      setLoading(false);
      didInitialLoad.current = true;
    }
  }

  useEffect(() => {
    loadAll();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // Avoid the “page refresh” feeling on tab focus / token refresh.
      // Only reload the data on real sign-in/out transitions.
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        loadAll({ soft: true });
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderSummaryForKey(k: (typeof QUESTION_KEYS)[number]) {
    const row = predictionsByKey[k];
    if (!row) return "Not submitted";

    if (row.answer_driver_id) {
      const d = driverById.get(row.answer_driver_id);
      return d ? `${(d as any).full_name} (${(d as any).code})` : "Driver selected";
    }

    if (row.answer_team_id) {
      const t = teamById.get(row.answer_team_id);
      return t ? `${(t as any).name} (${(t as any).code})` : "Team selected";
    }

    return "Not submitted";
  }

  function renderSelectedForKey(k: (typeof QUESTION_KEYS)[number]) {
    const row = predictionsByKey[k];
    if (!row) return <div className="mt-2 text-sm text-muted-foreground">No selection.</div>;

    if (row.answer_driver_id) {
      const d = driverById.get(row.answer_driver_id);
      if (!d) return <div className="mt-2 text-sm text-muted-foreground">Driver selected.</div>;
      return <SelectedChip kind="driver" name={d.full_name} code={d.code} />;
    }

    if (row.answer_team_id) {
      const t = teamById.get(row.answer_team_id);
      if (!t) return <div className="mt-2 text-sm text-muted-foreground">Team selected.</div>;
      return <SelectedChip kind="team" name={t.name} code={t.code} />;
    }

    return <div className="mt-2 text-sm text-muted-foreground">No selection.</div>;
  }

  if (loading && !didInitialLoad.current) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeader title="Your Season Predictions" subtitle="Loading your picks…" />
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeader title="Your Season Predictions" subtitle="Could not load your picks." />
        <div className="rounded-2xl border bg-card p-6">
          <div className="text-sm text-red-600">{err}</div>
          <div className="text-xs text-muted-foreground mt-2">
            Check Supabase RLS for <code>season_prediction_sets</code> and <code>season_predictions</code> SELECT.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="no-scroll-anchor mx-auto max-w-6xl px-4 py-12 pb-28">
      {authed === false ? (
        <div className="mb-4 rounded-2xl border border-border bg-accent/30 px-4 py-3 text-sm text-foreground">
          <span className="font-semibold">Login required:</span> You must{" "}
          <a href="/login" className="text-primary font-semibold hover:opacity-90 underline underline-offset-4">
            sign in
          </a>{" "}
          to view your season predictions.
        </div>
      ) : null}

      <div className="flex items-start justify-between mb-6 gap-6">
        <SectionHeader title="Your Season Predictions" subtitle="Here’s what you’ve locked in for the season." />
        <div className="shrink-0 flex flex-col items-end gap-2 text-right md:flex-row md:items-start md:gap-8">
          <div>
            <div className="text-xs text-muted-foreground">Season</div>
            <div className="text-sm font-semibold">{activeSeason ? activeSeason.label : "—"}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {QUESTION_KEYS.map((k) => (
          <QuestionCard
            key={k}
            title={QUESTION_META[k].title}
            description={""} // remove the “Pick the …” line
            expanded={open[k]}
            onToggle={() => setOpen((prev) => ({ ...prev, [k]: !prev[k] }))}
            summary={renderSummaryForKey(k)}
          >
            {authed !== true ? (
              <div className="mt-2 text-sm text-muted-foreground">Sign in to view your selection.</div>
            ) : (
              renderSelectedForKey(k)
            )}
          </QuestionCard>
        ))}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
          <div className="ml-auto flex items-center gap-3">
            <Link href="/season-prediction" className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-accent/40">
              Edit Predictions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}