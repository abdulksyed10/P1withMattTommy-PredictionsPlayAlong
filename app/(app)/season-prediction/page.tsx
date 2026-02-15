// /app/(app)/season-prediction/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import SectionHeader from "@/components/predictions/SectionHeader";
import QuestionCard from "@/components/predictions/QuestionCard";
import DriverGrid from "@/components/predictions/DriverGrid";
import TeamGrid from "@/components/predictions/TeamGrid";
import DriverOrTeamGrid from "@/components/predictions/DriverOrTeamGrid";
import type { DriverRow, TeamRow, Pick } from "@/components/predictions/types";

export default function SeasonPredictionPage() {
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [activeSeason, setActiveSeason] = useState<{ id: string; label: string } | null>(null);

  const [authed, setAuthed] = useState<boolean | null>(null);

  // expanded sections (same UX as predict page)
  const [openKey, setOpenKey] = useState<
    "good" | "flop" | "first_win" | "constructors" | "wdc" | null
  >("good");

  // selections (season questions)
  const [goodSurprise, setGoodSurprise] = useState<Pick>(null);
  const [bigFlop, setBigFlop] = useState<Pick>(null);
  const [firstTimeWinner, setFirstTimeWinner] = useState<string | null>(null);
  const [constructorsChampion, setConstructorsChampion] = useState<string | null>(null);
  const [worldChampion, setWorldChampion] = useState<string | null>(null);

  // tab state for driver/team questions
  const [goodTab, setGoodTab] = useState<"drivers" | "teams">("drivers");
  const [flopTab, setFlopTab] = useState<"drivers" | "teams">("drivers");

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setLoading(true);
        setErr(null);

        // Auth state (for the disclaimer banner)
        const { data: userData } = await supabase.auth.getUser();
        if (mounted) setAuthed(!!userData.user);

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

        if (!mounted) return;

        setDrivers((d ?? []) as DriverRow[]);
        setTeams((t ?? []) as TeamRow[]);

        if (s) {
          setActiveSeason({ id: s.id, label: `${s.year} • ${s.name}` });
        } else {
          setActiveSeason(null);
        }
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message ?? "Failed to load drivers/teams/season.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setAuthed(!!session?.user);
    });

    run();

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

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

  function pickLabel(p: Pick) {
    if (!p) return "None";
    if (p.kind === "driver") {
      const d = driverById.get(p.id);
      return d ? `${d.full_name} (${d.code})` : "Driver selected";
    }
    const t = teamById.get(p.id);
    return t ? `${t.name} (${t.code})` : "Team selected";
  }

  function driverLabel(id: string | null) {
    if (!id) return "None";
    const d = driverById.get(id);
    return d ? `${d.full_name} (${d.code})` : "Selected";
  }

  function teamLabel(id: string | null) {
    if (!id) return "None";
    const t = teamById.get(id);
    return t ? `${t.name} (${t.code})` : "Selected";
  }

  function keyOfPick(p: Pick) {
    if (!p) return null;
    return `${p.kind}:${p.id}`;
  }

  const surpriseFlopError = useMemo(() => {
    const a = keyOfPick(goodSurprise);
    const b = keyOfPick(bigFlop);
    if (a && b && a === b) return "Good Surprise and Big Flop cannot be the same pick.";
    return null;
  }, [goodSurprise, bigFlop]);

  function willConflictIfSetGood(next: Pick) {
    const a = keyOfPick(next);
    const b = keyOfPick(bigFlop);
    return !!(a && b && a === b);
  }

  function willConflictIfSetFlop(next: Pick) {
    const a = keyOfPick(goodSurprise);
    const b = keyOfPick(next);
    return !!(a && b && a === b);
  }

  const nextKey: Record<NonNullable<typeof openKey>, typeof openKey> = {
    good: "flop",
    flop: "first_win",
    first_win: "constructors",
    constructors: "wdc",
    wdc: null,
  };

  function advance(from: NonNullable<typeof openKey>) {
    setOpenKey(nextKey[from]);
  }

  async function handleSubmit() {
    if (submitting) return;

    try {
      setSubmitting(true);

      // 0) must be logged in
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        alert("You must be logged in to submit predictions.");
        return;
      }

      // 1) must have active season
      if (!activeSeason?.id) {
        alert("No active season found.");
        return;
      }
      const seasonId = activeSeason.id;

      // 2) validate required fields
      const missing: string[] = [];
      if (!goodSurprise) missing.push("Good Surprise");
      if (!bigFlop) missing.push("Big Flop");
      if (!firstTimeWinner) missing.push("First-time Race Winner");
      if (!constructorsChampion) missing.push("Constructors’ Champion");
      if (!worldChampion) missing.push("World Champion");

      if (missing.length) {
        alert(`Missing: ${missing.join(", ")}`);
        return;
      }

      if (surpriseFlopError) {
        alert(surpriseFlopError);
        return;
      }

      // 3) fetch question IDs by key
      const QUESTION_KEYS = [
        "season_good_surprise",
        "season_big_flop",
        "season_first_time_winner",
        "season_constructors_champion",
        "season_world_champion",
      ] as const;

      const { data: questions, error: qErr } = await supabase
        .from("questions")
        .select("id, key")
        .eq("season_id", seasonId)
        .in("key", [...QUESTION_KEYS]);

      if (qErr || !questions || questions.length !== QUESTION_KEYS.length) {
        alert(qErr?.message ?? "Season questions missing. Check questions.key values.");
        return;
      }

      const qidByKey = new Map<string, string>();
      for (const q of questions as any[]) qidByKey.set(q.key, q.id);

      for (const k of QUESTION_KEYS) {
        if (!qidByKey.get(k)) {
          alert(`Missing question in DB for key: ${k}`);
          return;
        }
      }

      const nowIso = new Date().toISOString();

      // 4) upsert prediction_set (season-scoped)
      const { data: setRow, error: setErr } = await supabase
        .from("season_prediction_sets")
        .upsert(
          {
            user_id: user.id,
            season_id: seasonId,
            status: "submitted",
            submitted_at: nowIso,
            updated_at: nowIso,
          },
          { onConflict: "user_id,season_id" }
        )
        .select("id")
        .single();

      if (setErr || !setRow) {
        alert(setErr?.message ?? "Failed to save season prediction set.");
        return;
      }

      const predictionSetId = setRow.id as string;

      // 5) upsert predictions
      const rows = [
        {
          season_prediction_set_id: predictionSetId,
          question_id: qidByKey.get("season_good_surprise"),
          answer_driver_id: goodSurprise?.kind === "driver" ? goodSurprise.id : null,
          answer_team_id: goodSurprise?.kind === "team" ? goodSurprise.id : null,
          answer_int: null,
          answer_text: null,
        },
        {
          season_prediction_set_id: predictionSetId,
          question_id: qidByKey.get("season_big_flop"),
          answer_driver_id: bigFlop?.kind === "driver" ? bigFlop.id : null,
          answer_team_id: bigFlop?.kind === "team" ? bigFlop.id : null,
          answer_int: null,
          answer_text: null,
        },
        {
          season_prediction_set_id: predictionSetId,
          question_id: qidByKey.get("season_first_time_winner"),
          answer_driver_id: firstTimeWinner,
          answer_team_id: null,
          answer_int: null,
          answer_text: null,
        },
        {
          season_prediction_set_id: predictionSetId,
          question_id: qidByKey.get("season_constructors_champion"),
          answer_driver_id: null,
          answer_team_id: constructorsChampion,
          answer_int: null,
          answer_text: null,
        },
        {
          season_prediction_set_id: predictionSetId,
          question_id: qidByKey.get("season_world_champion"),
          answer_driver_id: worldChampion,
          answer_team_id: null,
          answer_int: null,
          answer_text: null,
        },
      ];

      const { error: predErr } = await supabase
        .from("season_predictions")
        .upsert(rows, { onConflict: "season_prediction_set_id,question_id" });

      if (predErr) {
        alert(predErr.message ?? "Failed to save season predictions.");
        return;
      }

      alert("Season predictions submitted.");
    } catch (e: any) {
      alert(e?.message ?? "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeader title="Season Predictions" subtitle="Loading drivers and teams…" />
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeader title="Season Predictions" subtitle="Could not load data." />
        <div className="rounded-2xl border bg-card p-6">
          <div className="text-sm text-red-600">{err}</div>
          <div className="text-xs text-muted-foreground mt-2">
            Check Supabase RLS policies for <code>drivers</code>, <code>teams</code>, and <code>seasons</code> SELECT.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-28">
      {authed === false ? (
        <div className="mb-4 rounded-2xl border border-border bg-accent/30 px-4 py-3 text-sm text-foreground">
          <span className="font-semibold">Login required:</span> You can explore the prediction form, but you must{" "}
          <a href="/login" className="text-primary font-semibold hover:opacity-90 underline underline-offset-4">
            sign in
          </a>{" "}
          to submit predictions.
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4 mb-6">
        <SectionHeader
          title="Season Predictions"
          subtitle="Lock in your season-long picks before the season starts."
        />
        <div className="text-right shrink-0">
          <div className="text-xs text-muted-foreground">Predicting for</div>
          <div className="text-sm font-semibold">{activeSeason ? activeSeason.label : "—"}</div>
        </div>
      </div>

      <div className="space-y-4">
        <QuestionCard
          title="Good Surprise"
          description="Pick the driver or team you think will outperform expectations this season."
          expanded={openKey === "good"}
          onToggle={() => setOpenKey(openKey === "good" ? "flop" : "good")}
          summary={pickLabel(goodSurprise)}
        >
          {surpriseFlopError ? (
            <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700">
              {surpriseFlopError}
            </div>
          ) : null}

          <DriverOrTeamGrid
            drivers={drivers}
            teams={teams}
            value={goodSurprise}
            onChange={(p) => {
              setGoodSurprise(p);
              if (!willConflictIfSetGood(p)) advance("good");
              else setOpenKey("good");
            }}
            tab={goodTab}
            onTabChange={setGoodTab}
          />
        </QuestionCard>

        <QuestionCard
          title="Big Flop"
          description="Pick the driver or team you think will underperform expectations this season."
          expanded={openKey === "flop"}
          onToggle={() => setOpenKey(openKey === "flop" ? "first_win" : "flop")}
          summary={pickLabel(bigFlop)}
        >
          {surpriseFlopError ? (
            <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700">
              {surpriseFlopError}
            </div>
          ) : null}

          <DriverOrTeamGrid
            drivers={drivers}
            teams={teams}
            value={bigFlop}
            onChange={(p) => {
              setBigFlop(p);
              if (!willConflictIfSetFlop(p)) advance("flop");
              else setOpenKey("flop");
            }}
            tab={flopTab}
            onTabChange={setFlopTab}
          />
        </QuestionCard>

        <QuestionCard
          title="First-time Race Winner"
          description="Pick the driver who will win their first ever F1 race this season."
          expanded={openKey === "first_win"}
          onToggle={() => setOpenKey(openKey === "first_win" ? "constructors" : "first_win")}
          summary={driverLabel(firstTimeWinner)}
        >
          <DriverGrid
            drivers={drivers}
            selectedId={firstTimeWinner}
            onSelect={(id) => {
              setFirstTimeWinner(id);
              advance("first_win");
            }}
          />
        </QuestionCard>

        <QuestionCard
          title="Constructors’ Champion"
          description="Pick the team that will win the Constructors’ Championship."
          expanded={openKey === "constructors"}
          onToggle={() => setOpenKey(openKey === "constructors" ? "wdc" : "constructors")}
          summary={teamLabel(constructorsChampion)}
        >
          <TeamGrid
            teams={teams}
            selectedId={constructorsChampion}
            onSelect={(id) => {
              setConstructorsChampion(id);
              advance("constructors");
            }}
          />
        </QuestionCard>

        <QuestionCard
          title="World Champion"
          description="Pick the driver who will win the Drivers’ Championship."
          expanded={openKey === "wdc"}
          onToggle={() => setOpenKey(openKey === "wdc" ? null : "wdc")}
          summary={driverLabel(worldChampion)}
        >
          <DriverGrid
            drivers={drivers}
            selectedId={worldChampion}
            onSelect={(id) => {
              setWorldChampion(id);
              advance("wdc");
            }}
          />
        </QuestionCard>
      </div>

      {/* Sticky submit bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-accent/40"
              onClick={() => {
                setGoodSurprise(null);
                setBigFlop(null);
                setFirstTimeWinner(null);
                setConstructorsChampion(null);
                setWorldChampion(null);
                setGoodTab("drivers");
                setFlopTab("drivers");
                setOpenKey("good");
              }}
              disabled={submitting}
            >
              Reset
            </button>

            <button
              type="button"
              className={[
                "rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground",
                surpriseFlopError || submitting ? "bg-muted cursor-not-allowed" : "bg-primary hover:opacity-95",
              ].join(" ")}
              disabled={!!surpriseFlopError || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting..." : "Submit Predictions"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}