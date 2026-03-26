// /app/(app)/race-results/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import SectionHeader from "@/components/predictions/SectionHeader";
import QuestionCard from "@/components/predictions/QuestionCard";
import DisplayGrid from "@/components/race-results/DisplayGrid";
import type { DriverRow, TeamRow } from "@/components/predictions/types";

/**
 * These keys must exactly match the values stored in questions.key
 */
const QUESTION_KEYS = [
  "good_surprise",
  "big_flop",
  "sprint_pole",
  "sprint_winner",
  "pole_position",
  "p3",
  "p2",
  "p1_winner",
] as const;

type QuestionKey = (typeof QUESTION_KEYS)[number];

const QUESTION_META: Record<QuestionKey, { title: string }> = {
  good_surprise: { title: "Good Surprise" },
  big_flop: { title: "Big Flop" },
  sprint_pole: { title: "Sprint Pole" },
  sprint_winner: { title: "Sprint Winner" },
  pole_position: { title: "Race Pole Position" },
  p3: { title: "Third Position (P3)" },
  p2: { title: "Second Position (P2)" },
  p1_winner: { title: "Race Winner (P1)" },
};

type RaceLite = {
  id: string;
  label: string;
  hasSprint: boolean;
};

/**
 * For each question, store the list of correct driver ids and team ids.
 * GS/BF can have many. The others usually have one driver.
 */
type ResultRow = {
  drivers: string[];
  teams: string[];
};

export default function RaceResultsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [races, setRaces] = useState<RaceLite[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);

  const [resultsByKey, setResultsByKey] = useState<Partial<Record<QuestionKey, ResultRow>>>({});

  /**
   * Keep all cards open by default, but let users collapse each one.
   */
  const [open, setOpen] = useState<Record<QuestionKey, boolean>>(
    () =>
      Object.fromEntries(QUESTION_KEYS.map((k) => [k, true])) as Record<QuestionKey, boolean>
  );

  const fetchInFlight = useRef(false);

  /**
   * Fast lookup maps for converting ids -> full rows
   */
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

  const selectedRace = useMemo(() => {
    return races.find((r) => r.id === selectedRaceId) ?? null;
  }, [races, selectedRaceId]);

  const visibleQuestionKeys = useMemo<QuestionKey[]>(() => {
    if (selectedRace?.hasSprint) {
      return [
        "good_surprise",
        "big_flop",
        "sprint_pole",
        "sprint_winner",
        "pole_position",
        "p3",
        "p2",
        "p1_winner",
      ];
    }

    return [
      "good_surprise",
      "big_flop",
      "pole_position",
      "p3",
      "p2",
      "p1_winner",
    ];
  }, [selectedRace?.hasSprint]);

  /**
   * Load:
   * - active drivers
   * - active teams
   * - all races in active season
   * - default selected race = most recently scored race
   */
  async function loadBase() {
    if (fetchInFlight.current) return;
    fetchInFlight.current = true;

    try {
      setLoading(true);
      setErr(null);

      const [
        { data: driverRows, error: driverErr },
        { data: teamRows, error: teamErr },
        { data: raceRows, error: raceErr },
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
          .select("id, name, round, race_date, has_sprint, seasons!inner(is_active)")
          .eq("seasons.is_active", true)
          .order("race_date", { ascending: true }),
      ]);

      if (driverErr) throw driverErr;
      if (teamErr) throw teamErr;
      if (raceErr) throw raceErr;

      setDrivers((driverRows ?? []) as DriverRow[]);
      setTeams((teamRows ?? []) as TeamRow[]);

      const raceOptions: RaceLite[] = ((raceRows ?? []) as any[]).map((r) => ({
        id: r.id,
        label: `Round ${r.round}: ${r.name}`,
        hasSprint: !!r.has_sprint,
      }));

      setRaces(raceOptions);

      /**
       * Most recently scored race:
       * latest final published answer key
       */
      const { data: latestFinal, error: latestErr } = await supabase
        .from("race_question_answer_keys")
        .select("race_id, published_at")
        .eq("is_final", true)
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestErr) throw latestErr;

      setSelectedRaceId(latestFinal?.race_id ?? raceOptions[0]?.id ?? null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load race results page.");
    } finally {
      fetchInFlight.current = false;
      setLoading(false);
    }
  }

  /**
   * Load official results for one selected race.
   *
   * Process:
   * 1) fetch the question ids for the question keys we care about
   * 2) fetch final answer keys for this race
   * 3) fetch correct choices for those answer keys
   * 4) shape everything into resultsByKey
   */
  async function loadResultsForRace(raceId: string) {
    try {
      setErr(null);
      setResultsByKey({});

      const { data: questions, error: qErr } = await supabase
        .from("questions")
        .select("id, key")
        .in("key", [...QUESTION_KEYS]);

      if (qErr) throw qErr;

      const qIdToKey = new Map<string, QuestionKey>();
      for (const q of (questions ?? []) as any[]) {
        if (QUESTION_KEYS.includes(q.key)) {
          qIdToKey.set(q.id, q.key);
        }
      }

      const { data: answerKeys, error: keyErr } = await supabase
        .from("race_question_answer_keys")
        .select("id, question_id")
        .eq("race_id", raceId)
        .eq("is_final", true);

      if (keyErr) throw keyErr;

      if (!answerKeys || answerKeys.length === 0) {
        setResultsByKey({});
        return;
      }

      const answerKeyIds = answerKeys.map((k) => k.id);

      const { data: choices, error: choiceErr } = await supabase
        .from("race_question_correct_choices")
        .select("answer_key_id, driver_id, team_id")
        .in("answer_key_id", answerKeyIds);

      if (choiceErr) throw choiceErr;

      const nextResults: Partial<Record<QuestionKey, ResultRow>> = {};

      for (const keyRow of answerKeys as any[]) {
        const questionKey = qIdToKey.get(keyRow.question_id);
        if (!questionKey) continue;

        const relatedChoices = (choices ?? []).filter((c: any) => c.answer_key_id === keyRow.id);

        nextResults[questionKey] = {
          drivers: relatedChoices
            .filter((c: any) => !!c.driver_id)
            .map((c: any) => c.driver_id as string),
          teams: relatedChoices
            .filter((c: any) => !!c.team_id)
            .map((c: any) => c.team_id as string),
        };
      }

      setResultsByKey(nextResults);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load official race results.");
    }
  }

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    if (!selectedRaceId) return;
    loadResultsForRace(selectedRaceId);
  }, [selectedRaceId]);

  /**
   * Small summary line shown in each card header.
   */
  function renderSummary(k: QuestionKey) {
    const row = resultsByKey[k];
    if (!row) return "Not available";

    const names: string[] = [];

    for (const driverId of row.drivers) {
      const d = driverById.get(driverId);
      if (d) names.push(d.full_name);
    }

    for (const teamId of row.teams) {
      const t = teamById.get(teamId);
      if (t) names.push(t.name);
    }

    return names.length > 0 ? names.join(", ") : "Not available";
  }

  /**
   * Convert stored ids into full rows and pass them to the
   * dedicated read-only DisplayGrid component.
   */
  function renderSelection(k: QuestionKey) {
    const row = resultsByKey[k];

    if (!row) {
      return <div className="mt-2 text-sm text-muted-foreground">No result available.</div>;
    }

    const items = [
      ...row.drivers
        .map((id) => driverById.get(id))
        .filter(Boolean)
        .map((d) => ({ kind: "driver" as const, row: d! })),

      ...row.teams
        .map((id) => teamById.get(id))
        .filter(Boolean)
        .map((t) => ({ kind: "team" as const, row: t! })),
    ];

    /**
     * Show group labels only for the mixed-result questions
     */
    const showGroupLabels = k === "good_surprise" || k === "big_flop";

    return <DisplayGrid items={items} showGroupLabels={showGroupLabels} />;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeader title="Race Results" subtitle="Loading official results…" />
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeader title="Race Results" subtitle="Could not load results." />
        <div className="rounded-2xl border bg-card p-6">
          <div className="text-sm text-red-600">{err}</div>
          <div className="mt-2 text-xs text-muted-foreground">
            Check SELECT access for <code>questions</code>, <code>races</code>, <code>drivers</code>,{" "}
            <code>teams</code>, <code>race_question_answer_keys</code>, and{" "}
            <code>race_question_correct_choices</code>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-16">
      <div className="mb-6 flex items-start justify-between gap-4">
        <SectionHeader title="Race Results"
          subtitle={
            selectedRace?.hasSprint
              ? "Official race outcomes for a sprint weekend"
              : "Official race outcomes"
          } 
        />

        <div className="shrink-0 text-right">
          <div className="text-xs text-muted-foreground">Showing results for</div>
          <div className="mt-1">
            <select
              className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent/20"
              value={selectedRaceId ?? ""}
              onChange={(e) => setSelectedRaceId(e.target.value)}
              disabled={races.length === 0}
            >
              {races.length === 0 ? <option value="">—</option> : null}
              {races.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}{r.hasSprint ? " • Sprint" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedRaceId && Object.keys(resultsByKey).length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-sm font-semibold text-foreground">
            Results are not published for this race yet.
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Select another race from the dropdown to view published results.
          </div>
        </div>
      ) : null}

      {selectedRaceId && Object.keys(resultsByKey).length > 0 ? (
        <div className="space-y-4">
          {QUESTION_KEYS.map((k) => (
            <QuestionCard
              key={k}
              title={QUESTION_META[k].title}
              description=""
              expanded={open[k]}
              onToggle={() => setOpen((prev) => ({ ...prev, [k]: !prev[k] }))}
              summary={renderSummary(k)}
            >
              {renderSelection(k)}
            </QuestionCard>
          ))}
        </div>
      ) : null}
    </div>
  );
}