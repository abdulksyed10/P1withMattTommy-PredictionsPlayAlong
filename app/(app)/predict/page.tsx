// /app/(app)/predict/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import SectionHeader from "@/components/predictions/SectionHeader";
import QuestionCard from "@/components/predictions/QuestionCard";
import DriverGrid from "@/components/predictions/DriverGrid";
import DriverOrTeamGrid from "@/components/predictions/DriverOrTeamGrid";
import type { DriverRow, TeamRow, Pick } from "@/components/predictions/types";

export default function PredictPage() {
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [currentRace, setCurrentRace] = useState<{ id: string; label: string } | null>(null);

  const [authed, setAuthed] = useState<boolean | null>(null);

  // expanded sections
  const [openKey, setOpenKey] = useState<"good" | "flop" | "pole_position" | "p3" | "p2" | "win" | null>("good");

  // selections
  const [goodSurprise, setGoodSurprise] = useState<Pick>(null);
  const [bigFlop, setBigFlop] = useState<Pick>(null);
  const [pole_position, setPolePosition] = useState<string | null>(null);
  const [p3, setP3] = useState<string | null>(null);
  const [p2, setP2] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);

  // tab state for driver/team questions (buttons)
  const [goodTab, setGoodTab] = useState<"drivers" | "teams">("drivers");
  const [flopTab, setFlopTab] = useState<"drivers" | "teams">("drivers");

  const cardRefs = useRef<
    Record<NonNullable<typeof openKey>, HTMLDivElement | null>
  >({
    good: null,
    flop: null,
    pole_position: null,
    p3: null,
    p2: null,
    win: null,
  });

  function scrollToCard(key: NonNullable<typeof openKey>) {
    const el = cardRefs.current[key];
    if (!el) return;

    const headerEl = document.querySelector("[data-fixed-header]") as HTMLElement | null;
    const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;

    const EXTRA_GAP = 12;
    const y = el.getBoundingClientRect().top + window.scrollY - headerH - EXTRA_GAP;

    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }

  useEffect(() => {
    if (!openKey) return;
    const id = window.setTimeout(() => scrollToCard(openKey), 0);
    return () => window.clearTimeout(id);
  }, [openKey]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setLoading(true);
        setErr(null);

        // Auth state (for the disclaimer banner)
        const { data: userData } = await supabase.auth.getUser();
        if (mounted) setAuthed(!!userData.user);

        const today = new Date().toISOString().slice(0, 10);

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

          supabase
            .from("races")
            .select("id, name, round, race_date, seasons!inner(is_active)")
            .eq("seasons.is_active", true)
            .gte("race_date", today)
            .order("race_date", { ascending: true })
            .limit(1)
            .maybeSingle(),
        ]);

        if (de) throw de;
        if (te) throw te;
        if (re) throw re;

        if (!mounted) return;

        setDrivers((d ?? []) as DriverRow[]);
        setTeams((t ?? []) as TeamRow[]);

        if (r) {
          setCurrentRace({ id: r.id, label: `Round ${r.round}: ${r.name}` });
        } else {
          setCurrentRace(null);
        }
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message ?? "Failed to load drivers/teams/race.");
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

  function pickKey(p: Pick) {
    if (!p) return null;
    return `${p.kind}:${p.id}`;
  }


  const podiumError = useMemo(() => {
    const ids = [winner, p2, p3].filter(Boolean) as string[];
    const set = new Set(ids);
    if (ids.length !== set.size) return "Winner, P2, and P3 must be different drivers.";
    return null;
  }, [winner, p2, p3]);

  const surpriseFlopError = useMemo(() => {
    const a = pickKey(goodSurprise);
    const b = pickKey(bigFlop);

    if (a && b && a === b) {
      return "Good Surprise and Big Flop cannot be the same pick.";
    }
    return null;
  }, [goodSurprise, bigFlop]);

  const nextKey: Record<
    NonNullable<typeof openKey>,
    typeof openKey
  > = {
    good: "flop",
    flop: "pole_position",
    pole_position: "p3",
    p3: "p2",
    p2: "win",
    win: null,
  };

  function advance(from: NonNullable<typeof openKey>) {
    setOpenKey(nextKey[from]);
  }

  function keyOfPick(p: Pick) {
  if (!p) return null;
  return `${p.kind}:${p.id}`;
}

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

function willConflictPodium(nextWinner: string | null, nextP2: string | null, nextP3: string | null) {
  const ids = [nextWinner, nextP2, nextP3].filter(Boolean) as string[];
  return new Set(ids).size !== ids.length;
}

function openAndScrollPodiumFocus(preferred?: "p3" | "p2" | "win") {
  const k: "p3" | "p2" | "win" =
    preferred ?? (openKey === "win" || openKey === "p2" || openKey === "p3" ? openKey : "win");
  setOpenKey(k);
  window.setTimeout(() => scrollToCard(k), 0);
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

    // 1) validate good surprise, flop, and podium uniqueness
    if (surpriseFlopError) {
      const k = openKey === "flop" ? "flop" : "good";
      setOpenKey(k);
      window.setTimeout(() => scrollToCard(k), 0);
      alert(surpriseFlopError);
      return;
    }
    if (podiumError) {
      openAndScrollPodiumFocus();
      alert(podiumError);
      return;
    }

    const missing: string[] = [];
    if (!goodSurprise) missing.push("Good Surprise");
    if (!bigFlop) missing.push("Big Flop");
    if (!pole_position) missing.push("Pole Position");
    if (!p3) missing.push("P3");
    if (!p2) missing.push("P2");
    if (!winner) missing.push("Race Winner");

    if (missing.length) {
      alert(`Missing: ${missing.join(", ")}`);
      return;
    }

    // 2) determine race (next upcoming race in active season)
    if (!currentRace?.id) {
      alert("No upcoming race found in active season.");
      return;
    }
    const raceId = currentRace.id;

    // 3) lock check via FP1
    const { data: fp1, error: fp1Err } = await supabase
      .from("race_sessions")
      .select("starts_at")
      .eq("race_id", raceId)
      .eq("session", "fp1")
      .maybeSingle();

    if (fp1Err || !fp1?.starts_at) {
      alert(fp1Err?.message ?? "FP1 starts_at not configured for this race.");
      return;
    }

    if (Date.now() >= new Date(fp1.starts_at).getTime()) {
      alert("Predictions are locked (FP1 has started).");
      return;
    }

    // 4) fetch question IDs by key
    const QUESTION_KEYS = ["good_surprise", "big_flop", "pole_position", "p3", "p2", "p1_winner"] as const;

    const { data: questions, error: qErr } = await supabase
      .from("questions")
      .select("id, key")
      .in("key", [...QUESTION_KEYS]);

    if (qErr || !questions || questions.length !== QUESTION_KEYS.length) {
      alert(qErr?.message ?? "Questions missing. Check questions.key values.");
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

    // 5) upsert prediction_set
    const { data: setRow, error: setErr } = await supabase
      .from("prediction_sets")
      .upsert(
        {
          user_id: user.id,
          race_id: raceId,
          status: "submitted",
          submitted_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: "user_id,race_id" }
      )
      .select("id")
      .single();

    if (setErr || !setRow) {
      alert(setErr?.message ?? "Failed to save prediction set.");
      return;
    }

    const predictionSetId = setRow.id as string;

    // 6) upsert predictions
    const rows = [
      {
        prediction_set_id: predictionSetId,
        question_id: qidByKey.get("good_surprise"),
        answer_driver_id: goodSurprise?.kind === "driver" ? goodSurprise.id : null,
        answer_team_id: goodSurprise?.kind === "team" ? goodSurprise.id : null,
        answer_int: null,
        answer_text: null,
      },
      {
        prediction_set_id: predictionSetId,
        question_id: qidByKey.get("big_flop"),
        answer_driver_id: bigFlop?.kind === "driver" ? bigFlop.id : null,
        answer_team_id: bigFlop?.kind === "team" ? bigFlop.id : null,
        answer_int: null,
        answer_text: null,
      },
      {
        prediction_set_id: predictionSetId,
        question_id: qidByKey.get("pole_position"),
        answer_driver_id: pole_position,
        answer_team_id: null,
        answer_int: null,
        answer_text: null,
      },
      {
        prediction_set_id: predictionSetId,
        question_id: qidByKey.get("p3"),
        answer_driver_id: p3,
        answer_team_id: null,
        answer_int: null,
        answer_text: null,
      },
      {
        prediction_set_id: predictionSetId,
        question_id: qidByKey.get("p2"),
        answer_driver_id: p2,
        answer_team_id: null,
        answer_int: null,
        answer_text: null,
      },
      {
        prediction_set_id: predictionSetId,
        question_id: qidByKey.get("p1_winner"),
        answer_driver_id: winner,
        answer_team_id: null,
        answer_int: null,
        answer_text: null,
      },
    ];

      const { error: predErr } = await supabase
        .from("predictions")
        .upsert(rows, { onConflict: "prediction_set_id,question_id" });

      if (predErr) {
        alert(predErr.message ?? "Failed to save predictions.");
        return;
      }

      alert("Predictions submitted.");
    } catch (e: any) {
      alert(e?.message ?? "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeader title="Predictions" subtitle="Loading drivers and teams…" />
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeader title="Predictions" subtitle="Could not load data." />
        <div className="rounded-2xl border bg-card p-6">
          <div className="text-sm text-red-600">{err}</div>
          <div className="text-xs text-muted-foreground mt-2">
            Check Supabase RLS policies for <code>drivers</code> and <code>teams</code> SELECT.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="no-scroll-anchor mx-auto max-w-6xl px-4 py-8 pb-28">
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
          title="Predictions"
          subtitle="Submit before Practice 1. First race week is standard (no sprint)."
        />
        <div className="text-right shrink-0">
          <div className="text-xs text-muted-foreground">Predicting for</div>
          <div className="text-sm font-semibold">
            {currentRace ? currentRace.label : "—"}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div ref={(el) => { cardRefs.current.good = el; }}>
          <QuestionCard
            title="Good Surprise"
            description="Pick the driver or team you think will pleasantly outperform expectations."
            expanded={openKey === "good"}
            onToggle={() => setOpenKey(openKey === "good" ? null : "good")}
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
                if (willConflictIfSetGood(p)) {
                  setOpenKey("good");
                  window.setTimeout(() => scrollToCard("good"), 0);
                  return;
                }
                advance("good");
              }}
              tab={goodTab}
              onTabChange={setGoodTab}
            />
          </QuestionCard>
        </div>

        <div ref={(el) => { cardRefs.current.flop = el; }}>
          <QuestionCard
            title="Big Flop"
            description="Pick the driver or team you think will underperform expectations."
            expanded={openKey === "flop"}
            onToggle={() => setOpenKey(openKey === "flop" ? null : "flop")}
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
                if (willConflictIfSetFlop(p)) {
                  setOpenKey("flop");
                  window.setTimeout(() => scrollToCard("flop"), 0);
                  return;
                }
                advance("flop");
              }}
              tab={flopTab}
              onTabChange={setFlopTab}
            />
          </QuestionCard>
        </div>

        <div ref={(el) => { cardRefs.current.pole_position = el; }}>
          <QuestionCard
            title="Race Pole Position"
            description="Pick the driver who will start from pole position."
            expanded={openKey === "pole_position"}
            onToggle={() => setOpenKey(openKey === "pole_position" ? null : "pole_position")}
            summary={pole_position ? `${driverById.get(pole_position)?.full_name ?? "Selected"}` : "None"}
          >
            <DriverGrid drivers={drivers} selectedId={pole_position} onSelect={setPolePosition} onPicked={() => advance("pole_position")} />
          </QuestionCard>
        </div>

        <div ref={(el) => { cardRefs.current.p3 = el; }}>
          <QuestionCard
            title="Third Position (P3)"
            description="Pick the driver who will finish P3."
            expanded={openKey === "p3"}
            onToggle={() => setOpenKey(openKey === "p3" ? null : "p3")}
            summary={p3 ? `${driverById.get(p3)?.full_name ?? "Selected"}` : "None"}
          >
            {podiumError ? (
              <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700">
                {podiumError}
              </div>
            ) : null}
            <DriverGrid 
              drivers={drivers}
              selectedId={p3}
              onSelect={(id) => {
                setP3(id);
                const conflict = willConflictPodium(winner, p2, id);
                if (conflict) {
                  setOpenKey("p3");
                  window.setTimeout(() => scrollToCard("p3"), 0);
                  return;
                }
                advance("p3");
              }}
            />
          </QuestionCard>
        </div>

        <div ref={(el) => { cardRefs.current.p2 = el; }}>
          <QuestionCard
            title="Second Position (P2)"
            description="Pick the driver who will finish P2."
            expanded={openKey === "p2"}
            onToggle={() => setOpenKey(openKey === "p2" ? null : "p2")}
            summary={p2 ? `${driverById.get(p2)?.full_name ?? "Selected"}` : "None"}
          >
            {podiumError ? (
              <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700">
                {podiumError}
              </div>
            ) : null}
            <DriverGrid 
              drivers={drivers}
              selectedId={p2}
              onSelect={(id) => {
                setP2(id);
                const conflict = willConflictPodium(winner, id, p3);
                if (conflict) {
                  setOpenKey("p2");
                  window.setTimeout(() => scrollToCard("p2"), 0);
                  return;
                }
                advance("p2");
              }}
            />
          </QuestionCard>
        </div>

        <div ref={(el) => { cardRefs.current.win = el; }}>
          <QuestionCard
            title="Race Winner (P1)"
            description="Pick the driver who will win the race."
            expanded={openKey === "win"}
            onToggle={() => setOpenKey(openKey === "win" ? null : "win")}
            summary={winner ? `${driverById.get(winner)?.full_name ?? "Selected"}` : "None"}
          >
            {podiumError ? (
              <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700">
                {podiumError}
              </div>
            ) : null}
            <DriverGrid
              drivers={drivers}
              selectedId={winner}
              onSelect={(id) => {
                setWinner(id);
                const conflict = willConflictPodium(id, p2, p3);
                if (conflict) {
                  setOpenKey("win");
                  window.setTimeout(() => scrollToCard("win"), 0);
                  return;
                }
                advance("win");
              }}
            />
          </QuestionCard>
        </div>
      </div>

      {/* Sticky submit bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
          {/* <div className="text-sm text-muted-foreground min-w-0 space-y-1">
            <div className="hidden sm:block space-y-1">
              <div className="truncate">
                Good Surprise: <span className="text-foreground">{pickLabel(goodSurprise)}</span>
              </div>
              <div className="truncate">
                Big Flop: <span className="text-foreground">{pickLabel(bigFlop)}</span>
              </div>
              <div className="truncate">
                Pole Position: <span className="text-foreground">{driverLabel(pole_position)}</span>
              </div>
              <div className="truncate">
                Race Winner (P1): <span className="text-foreground">{driverLabel(winner)}</span>
              </div>
              <div className="truncate">
                P2: <span className="text-foreground">{driverLabel(p2)}</span>
              </div>
              <div className="truncate">
                P3: <span className="text-foreground">{driverLabel(p3)}</span>
              </div>
            </div>
          </div> */}

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-accent/40"
              onClick={() => {
                setGoodSurprise(null);
                setBigFlop(null);
                setPolePosition(null);
                setP3(null);
                setP2(null);
                setWinner(null);
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
                podiumError || surpriseFlopError || submitting
                  ? "bg-muted cursor-not-allowed"
                  : "bg-primary hover:opacity-95",
              ].join(" ")}
              disabled={!!podiumError || !!surpriseFlopError || submitting}
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