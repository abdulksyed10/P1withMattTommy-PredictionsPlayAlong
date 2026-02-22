// /app/(app)/predict/view/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

import SectionHeader from "@/components/predictions/SectionHeader";
import QuestionCard from "@/components/predictions/QuestionCard";
import type { DriverRow, TeamRow } from "@/components/predictions/types";

type RaceLite = { id: string; label: string };

type PredictionRow = {
  question_id: string;
  answer_driver_id: string | null;
  answer_team_id: string | null;
};

const QUESTION_KEYS = ["good_surprise", "big_flop", "pole_position", "p3", "p2", "p1_winner"] as const;

const QUESTION_META: Record<(typeof QUESTION_KEYS)[number], { title: string }> = {
  good_surprise: { title: "Good Surprise" },
  big_flop: { title: "Big Flop" },
  pole_position: { title: "Race Pole Position" },
  p3: { title: "Third Position (P3)" },
  p2: { title: "Second Position (P2)" },
  p1_winner: { title: "Race Winner (P1)" },
};

function SelectedChip(props: { kind: "driver" | "team"; name: string; code: string }) {
  const { kind, name, code } = props;

  const [imgError, setImgError] = useState(false);

  const src = kind === "driver" ? `/images/drivers/${code}.png` : `/images/teams/${code}.png`;

  return (
    <div className="mt-3 inline-flex items-center gap-5 rounded-2xl border border-border bg-card px-5 py-4">
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

export default function PredictViewPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [authed, setAuthed] = useState<boolean | null>(null);

  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);

  // ✅ CHANGE: list of races + selected race (dropdown)
  const [races, setRaces] = useState<RaceLite[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);

  // ✅ CHANGE: if user has no prediction set for selected race
  const [hasPredictionsForRace, setHasPredictionsForRace] = useState<boolean>(true);

  const [predictionsByKey, setPredictionsByKey] = useState<
    Partial<Record<(typeof QUESTION_KEYS)[number], PredictionRow>>
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

  // ✅ CHANGE: loads auth + drivers/teams + races + default selectedRaceId (most recently updated/submitted)
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
        { data: r, error: re },
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
        // ✅ CHANGE: get all races (active season only), not just next race
        supabase
          .from("races")
          .select("id, name, round, race_date, seasons!inner(is_active)")
          .eq("seasons.is_active", true)
          .order("race_date", { ascending: true }),
      ]);

      if (de) throw de;
      if (te) throw te;
      if (re) throw re;

      setDrivers((d ?? []) as DriverRow[]);
      setTeams((t ?? []) as TeamRow[]);

      const raceOptions: RaceLite[] = ((r ?? []) as any[]).map((x) => ({
        id: x.id,
        label: `Round ${x.round}: ${x.name}`,
      }));
      setRaces(raceOptions);

      // If not logged in, stop here (we still show dropdown shell)
      if (!user) {
        setSelectedRaceId(raceOptions[0]?.id ?? null);
        setPredictionsByKey({});
        setHasPredictionsForRace(false);
        return;
      }

      // ✅ CHANGE: choose default race = most recently updated/submitted prediction_set
      const { data: latestSet, error: latestErr } = await supabase
        .from("prediction_sets")
        .select("race_id, updated_at, submitted_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestErr) throw latestErr;

      const defaultRaceId =
        (latestSet?.race_id as string | undefined) ??
        raceOptions[0]?.id ??
        null;

      setSelectedRaceId(defaultRaceId);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load predictions view.");
    } finally {
      fetchInFlight.current = false;
      setLoading(false);
      didInitialLoad.current = true;
    }
  }

  // ✅ CHANGE: load predictions for a specific race (runs when selectedRaceId changes)
  async function loadPredictionsForRace(raceId: string) {
    if (fetchInFlight.current) return;
    fetchInFlight.current = true;

    try {
      setErr(null);
      setHasPredictionsForRace(true);
      setPredictionsByKey({});

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userData.user ?? null;
      setAuthed(!!user);

      if (!user) {
        setHasPredictionsForRace(false);
        return;
      }

      // Map question_id -> key
      const { data: qs, error: qErr } = await supabase
        .from("questions")
        .select("id, key")
        .in("key", [...QUESTION_KEYS]);
      if (qErr) throw qErr;

      const qIdToKey = new Map<string, (typeof QUESTION_KEYS)[number]>();
      for (const q of (qs ?? []) as any[]) {
        if (QUESTION_KEYS.includes(q.key)) qIdToKey.set(q.id, q.key);
      }

      // Find set for race
      const { data: setRow, error: setRowErr } = await supabase
        .from("prediction_sets")
        .select("id")
        .eq("user_id", user.id)
        .eq("race_id", raceId)
        .maybeSingle();
      if (setRowErr) throw setRowErr;

      if (!setRow?.id) {
        setHasPredictionsForRace(false);
        setPredictionsByKey({});
        return;
      }

      // Predictions
      const { data: preds, error: pErr } = await supabase
        .from("predictions")
        .select("question_id, answer_driver_id, answer_team_id")
        .eq("prediction_set_id", setRow.id);
      if (pErr) throw pErr;

      const byKey: Partial<Record<(typeof QUESTION_KEYS)[number], PredictionRow>> = {};
      for (const r of (preds ?? []) as any[]) {
        const key = qIdToKey.get(r.question_id);
        if (!key) continue;
        byKey[key] = r;
      }

      setHasPredictionsForRace(true);
      setPredictionsByKey(byKey);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load race predictions.");
    } finally {
      fetchInFlight.current = false;
    }
  }

  useEffect(() => {
    loadAll();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        loadAll({ soft: true });
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ CHANGE: load predictions when race changes (after initial default is set)
  useEffect(() => {
    if (!selectedRaceId) return;
    if (authed === false) return;
    loadPredictionsForRace(selectedRaceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRaceId]);

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

  const selectedRaceLabel = useMemo(() => {
    if (!selectedRaceId) return "—";
    return races.find((r) => r.id === selectedRaceId)?.label ?? "—";
  }, [races, selectedRaceId]);

  if (loading && !didInitialLoad.current) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeader title="Your Predictions" subtitle="Loading your picks…" />
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeader title="Your Predictions" subtitle="Could not load your picks." />
        <div className="rounded-2xl border bg-card p-6">
          <div className="text-sm text-red-600">{err}</div>
          <div className="text-xs text-muted-foreground mt-2">
            Check Supabase RLS for <code>prediction_sets</code> and <code>predictions</code> SELECT.
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
          to view your predictions.
        </div>
      ) : null}

      <div className="flex items-start justify-between mb-6 gap-6">
        <SectionHeader title="Your Predictions" subtitle="Here’s what you’ve locked in for this race." />
        <div className="shrink-0 flex flex-col items-end gap-2 text-right md:flex-row md:items-start md:gap-8">
          {/* ✅ CHANGE: race selector */}
          <div>
            <div className="text-xs text-muted-foreground">Your Predictions for</div>
            <div className="mt-1">
              <select
                className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent/20"
                value={selectedRaceId ?? ""}
                onChange={(e) => setSelectedRaceId(e.target.value)}
                disabled={races.length === 0}
              >
                {races.length === 0 ? (
                  <option value="">—</option>
                ) : null}
                {races.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sr-only">{selectedRaceLabel}</div>
          </div>
        </div>
      </div>

      {/* ✅ CHANGE: empty state for selected race */}
      {authed === true && selectedRaceId && !hasPredictionsForRace ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-sm text-foreground font-semibold">No predictions made for this race.</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Head to{" "}
            <Link href="/predict" className="text-primary font-semibold hover:opacity-90 underline underline-offset-4">
              the predict page
            </Link>{" "}
            to make your predictions.
          </div>
        </div>
      ) : null}

      {/* Cards */}
      {authed === true && selectedRaceId && hasPredictionsForRace ? (
        <div className="space-y-4">
          {QUESTION_KEYS.map((k) => (
            <QuestionCard
              key={k}
              title={QUESTION_META[k].title}
              description={""}
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
      ) : null}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
          <div className="ml-auto flex items-center gap-3">
            <Link href="/predict" className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-accent/40">
              Edit Predictions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}