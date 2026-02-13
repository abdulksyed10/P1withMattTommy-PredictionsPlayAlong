"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type DriverRow = {
  id: string;
  code: string;
  full_name: string;
  is_active: boolean;
};

type TeamRow = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
};

type Pick =
  | { kind: "driver"; id: string }
  | { kind: "team"; id: string }
  | null;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

function safeImg(src: string) {
  return src;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
      {subtitle ? <p className="text-sm text-muted-foreground mt-1">{subtitle}</p> : null}
    </div>
  );
}

function Tile({
  title,
  subtitle,
  imgSrc,
  selected,
  onClick,
  size = "lg",
}: {
  title: string;
  subtitle?: string;
  imgSrc?: string;
  selected: boolean;
  onClick: () => void;
  size?: "md" | "lg";
}) {
  const imgSize = size === "lg" ? 64 : 52;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative w-full rounded-xl border p-3 text-left transition",
        "hover:border-primary/40 hover:bg-accent/40",
        selected ? "border-primary bg-accent/60" : "border-border bg-background",
      ].join(" ")}
      aria-pressed={selected}
    >
      <div className="flex items-center gap-3">
        <div
          className="relative rounded-lg overflow-hidden border bg-muted flex items-center justify-center"
          style={{ width: imgSize, height: imgSize }}
        >
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={title}
              fill
              sizes={`${imgSize}px`}
              className="object-cover"
            />
          ) : (
            <div className="text-xs font-semibold text-muted-foreground">{initials(title)}</div>
          )}
        </div>

        <div className="min-w-0">
          <div className="font-semibold leading-tight truncate">{title}</div>
          {subtitle ? (
            <div className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</div>
          ) : null}
        </div>

        <div className="ml-auto">
          {selected ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <div className="h-5 w-5 rounded-full border border-muted-foreground/30 group-hover:border-primary/40" />
          )}
        </div>
      </div>
    </button>
  );
}

function QuestionCard({
  title,
  description,
  expanded,
  onToggle,
  summary,
  children,
}: {
  title: string;
  description?: string;
  expanded: boolean;
  onToggle: () => void;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex items-start justify-between gap-4 p-4 md:p-5">
        <div className="min-w-0">
          <div className="text-lg font-semibold">{title}</div>
          {description ? <div className="text-sm text-muted-foreground mt-1">{description}</div> : null}
          <div className="text-sm mt-2">
            <span className="text-muted-foreground">Selected: </span>
            <span className={summary === "None" ? "text-muted-foreground" : ""}>{summary}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-accent/40"
          aria-expanded={expanded}
        >
          {expanded ? "Collapse" : "Expand"}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded ? (
        <div className="px-4 pb-4 md:px-5 md:pb-5">
          <div className="h-px bg-border mb-4" />
          {children}
        </div>
      ) : null}
    </div>
  );
}

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

      // 1) validate podium uniqueness
      const podium = [winner, p2, p3].filter(Boolean) as string[];
      if (new Set(podium).size !== podium.length) {
        alert("Winner, P2, and P3 must be different drivers.");
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

  const driverGrid = (selectedId: string | null, setSelected: (id: string) => void) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {drivers.map((d) => (
        <Tile
          key={d.id}
          title={d.full_name}
          subtitle={d.code}
          imgSrc={safeImg(`/images/drivers/${d.code}.png`)}
          selected={selectedId === d.id}
          onClick={() => setSelected(d.id)}
          size="lg"
        />
      ))}
    </div>
  );

  function DriverTeamToggle({
    value,
    onChange,
  }: {
    value: "drivers" | "teams";
    onChange: (v: "drivers" | "teams") => void;
  }) {
    return (
      <div className="inline-flex rounded-xl border overflow-hidden">
        <button
          type="button"
          className={[
            "px-4 py-2 text-sm font-semibold transition",
            value === "drivers" ? "bg-accent/60" : "bg-background hover:bg-accent/30",
          ].join(" ")}
          onClick={() => onChange("drivers")}
          aria-pressed={value === "drivers"}
        >
          Drivers
        </button>
        <button
          type="button"
          className={[
            "px-4 py-2 text-sm font-semibold border-l transition",
            value === "teams" ? "bg-accent/60" : "bg-background hover:bg-accent/30",
          ].join(" ")}
          onClick={() => onChange("teams")}
          aria-pressed={value === "teams"}
        >
          Teams
        </button>
      </div>
    );
  }

  const driverOrTeamGrid = (
    value: Pick,
    setValue: (p: Pick) => void,
    tab: "drivers" | "teams",
    setTab: (t: "drivers" | "teams") => void
  ) => {
    return (
      <div className="space-y-4">
        <DriverTeamToggle value={tab} onChange={setTab} />

        <div className="text-xs text-muted-foreground">
          You can pick either a driver or a team for this question.
        </div>

        {tab === "drivers" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {drivers.map((d) => (
              <Tile
                key={`d-${d.id}`}
                title={d.full_name}
                subtitle={`Driver • ${d.code}`}
                imgSrc={safeImg(`/images/drivers/${d.code}.png`)}
                selected={value?.kind === "driver" && value.id === d.id}
                onClick={() => setValue({ kind: "driver", id: d.id })}
                size="lg"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teams.map((t) => (
              <Tile
                key={`t-${t.id}`}
                title={t.name}
                subtitle={`Team • ${t.code}`}
                imgSrc={safeImg(`/images/teams/${t.code}.png`)}
                selected={value?.kind === "team" && value.id === t.id}
                onClick={() => setValue({ kind: "team", id: t.id })}
                size="lg"
              />
            ))}
          </div>
        )}
      </div>
    );
  };

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
        <QuestionCard
          title="Good Surprise"
          description="Pick the driver or team you think will pleasantly outperform expectations."
          expanded={openKey === "good"}
          onToggle={() => setOpenKey(openKey === "good" ? "flop" : "good")}
          summary={pickLabel(goodSurprise)}
        >
          {surpriseFlopError ? (
            <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700">
              {surpriseFlopError}
            </div>
          ) : null}
          {driverOrTeamGrid(goodSurprise, setGoodSurprise, goodTab, setGoodTab)}
        </QuestionCard>

        <QuestionCard
          title="Big Flop"
          description="Pick the driver or team you think will underperform expectations."
          expanded={openKey === "flop"}
          onToggle={() => setOpenKey(openKey === "flop" ? "pole_position" : "flop")}
          summary={pickLabel(bigFlop)}
        >
          {surpriseFlopError ? (
            <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700">
              {surpriseFlopError}
            </div>
          ) : null}
          {driverOrTeamGrid(bigFlop, setBigFlop, flopTab, setFlopTab)}
        </QuestionCard>

        <QuestionCard
          title="Race Pole Position"
          description="Pick the driver who will start from pole position."
          expanded={openKey === "pole_position"}
          onToggle={() => setOpenKey(openKey === "pole_position" ? "p3" : "pole_position")}
          summary={pole_position ? `${driverById.get(pole_position)?.full_name ?? "Selected"}` : "None"}
        >
          {driverGrid(pole_position, (id) => setPolePosition(id))}
        </QuestionCard>

        <QuestionCard
          title="Third Position (P3)"
          description="Pick the driver who will finish P3."
          expanded={openKey === "p3"}
          onToggle={() => setOpenKey(openKey === "p3" ? "p2" : "p3")}
          summary={p3 ? `${driverById.get(p3)?.full_name ?? "Selected"}` : "None"}
        >
          {podiumError ? (
            <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700">
              {podiumError}
            </div>
          ) : null}
          {driverGrid(p3, (id) => setP3(id))}
        </QuestionCard>

        <QuestionCard
          title="Second Position (P2)"
          description="Pick the driver who will finish P2."
          expanded={openKey === "p2"}
          onToggle={() => setOpenKey(openKey === "p2" ? "win" : "p2")}
          summary={p2 ? `${driverById.get(p2)?.full_name ?? "Selected"}` : "None"}
        >
          {podiumError ? (
            <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700">
              {podiumError}
            </div>
          ) : null}
          {driverGrid(p2, (id) => setP2(id))}
        </QuestionCard>

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
          {driverGrid(winner, (id) => setWinner(id))}
        </QuestionCard>
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



// "use client";

// import Image from "next/image";
// import { useEffect, useMemo, useState } from "react";
// // import { createClient } from "@supabase/supabase-js";
// import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
// import { supabase } from "@/lib/supabaseClient";

// type DriverRow = {
//   id: string;
//   code: string;
//   full_name: string;
//   is_active: boolean;
// };

// type TeamRow = {
//   id: string;
//   code: string;
//   name: string;
//   is_active: boolean;
// };

// type Pick =
//   | { kind: "driver"; id: string }
//   | { kind: "team"; id: string }
//   | null;

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// // const supabase = createClient(supabaseUrl, supabaseAnonKey);

// function initials(name: string) {
//   return name
//     .split(" ")
//     .filter(Boolean)
//     .slice(0, 2)
//     .map((s) => s[0]?.toUpperCase())
//     .join("");
// }

// function safeImg(src: string) {
//   return src; // keep simple; missing files will show fallback UI
// }

// function SectionHeader({
//   title,
//   subtitle,
// }: {
//   title: string;
//   subtitle?: string;
// }) {
//   return (
//     <div className="mb-4">
//       <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
//         {title}
//       </h1>
//       {subtitle ? (
//         <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
//       ) : null}
//     </div>
//   );
// }

// function Tile({
//   title,
//   subtitle,
//   imgSrc,
//   selected,
//   onClick,
// }: {
//   title: string;
//   subtitle?: string;
//   imgSrc?: string;
//   selected: boolean;
//   onClick: () => void;
// }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className={[
//         "group relative w-full rounded-xl border p-3 text-left transition",
//         "hover:border-primary/40 hover:bg-accent/40",
//         selected ? "border-primary bg-accent/60" : "border-border bg-background",
//       ].join(" ")}
//       aria-pressed={selected}
//     >
//       <div className="flex items-center gap-3">
//         <div className="relative h-12 w-12 rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
//           {imgSrc ? (
//             <Image
//               src={imgSrc}
//               alt={title}
//               fill
//               sizes="48px"
//               className="object-cover"
//             />
//           ) : (
//             <div className="text-xs font-semibold text-muted-foreground">
//               {initials(title)}
//             </div>
//           )}
//         </div>

//         <div className="min-w-0">
//           <div className="font-semibold leading-tight truncate">{title}</div>
//           {subtitle ? (
//             <div className="text-xs text-muted-foreground truncate mt-0.5">
//               {subtitle}
//             </div>
//           ) : null}
//         </div>

//         <div className="ml-auto">
//           {selected ? (
//             <CheckCircle2 className="h-5 w-5 text-primary" />
//           ) : (
//             <div className="h-5 w-5 rounded-full border border-muted-foreground/30 group-hover:border-primary/40" />
//           )}
//         </div>
//       </div>
//     </button>
//   );
// }

// function QuestionCard({
//   title,
//   description,
//   expanded,
//   onToggle,
//   summary,
//   children,
// }: {
//   title: string;
//   description?: string;
//   expanded: boolean;
//   onToggle: () => void;
//   summary: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="rounded-2xl border bg-card">
//       <div className="flex items-start justify-between gap-4 p-4 md:p-5">
//         <div className="min-w-0">
//           <div className="text-lg font-semibold">{title}</div>
//           {description ? (
//             <div className="text-sm text-muted-foreground mt-1">
//               {description}
//             </div>
//           ) : null}
//           <div className="text-sm mt-2">
//             <span className="text-muted-foreground">Selected: </span>
//             <span className={summary === "None" ? "text-muted-foreground" : ""}>
//               {summary}
//             </span>
//           </div>
//         </div>

//         <button
//           type="button"
//           onClick={onToggle}
//           className="shrink-0 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-accent/40"
//           aria-expanded={expanded}
//         >
//           {expanded ? "Collapse" : "Expand"}
//           {expanded ? (
//             <ChevronUp className="h-4 w-4" />
//           ) : (
//             <ChevronDown className="h-4 w-4" />
//           )}
//         </button>
//       </div>

//       {expanded ? (
//         <div className="px-4 pb-4 md:px-5 md:pb-5">
//           <div className="h-px bg-border mb-4" />
//           {children}
//         </div>
//       ) : null}
//     </div>
//   );
// }

// export default function PredictPage() {
//   const [loading, setLoading] = useState(true);
//   const [drivers, setDrivers] = useState<DriverRow[]>([]);
//   const [teams, setTeams] = useState<TeamRow[]>([]);
//   const [err, setErr] = useState<string | null>(null);

//   // expanded sections
//   const [openKey, setOpenKey] = useState<
//     "good" | "flop" | "p3" | "p2" | "win"
//   >("good");

//   // selections
//   const [goodSurprise, setGoodSurprise] = useState<Pick>(null);
//   const [bigFlop, setBigFlop] = useState<Pick>(null);
//   const [p3, setP3] = useState<string | null>(null);
//   const [p2, setP2] = useState<string | null>(null);
//   const [winner, setWinner] = useState<string | null>(null);

//   useEffect(() => {
//     let mounted = true;

//     async function run() {
//       try {
//         setLoading(true);
//         setErr(null);

//         const [{ data: d, error: de }, { data: t, error: te }] =
//           await Promise.all([
//             supabase
//               .from("drivers")
//               .select("id, code, full_name, is_active")
//               .eq("is_active", true)
//               .order("full_name", { ascending: true }),
//             supabase
//               .from("teams")
//               .select("id, code, name, is_active")
//               .eq("is_active", true)
//               .order("name", { ascending: true }),
//           ]);

//         if (de) throw de;
//         if (te) throw te;

//         if (!mounted) return;

//         setDrivers((d ?? []) as DriverRow[]);
//         setTeams((t ?? []) as TeamRow[]);
//       } catch (e: any) {
//         if (!mounted) return;
//         setErr(e?.message ?? "Failed to load drivers/teams.");
//       } finally {
//         if (!mounted) return;
//         setLoading(false);
//       }
//     }

//     run();
//     return () => {
//       mounted = false;
//     };
//   }, []);

//   const driverById = useMemo(() => {
//     const m = new Map<string, DriverRow>();
//     for (const d of drivers) m.set(d.id, d);
//     return m;
//   }, [drivers]);

//   const teamById = useMemo(() => {
//     const m = new Map<string, TeamRow>();
//     for (const t of teams) m.set(t.id, t);
//     return m;
//   }, [teams]);

//   function pickLabel(p: Pick) {
//     if (!p) return "None";
//     if (p.kind === "driver") {
//       const d = driverById.get(p.id);
//       return d ? `${d.full_name} (${d.code})` : "Driver selected";
//     }
//     const t = teamById.get(p.id);
//     return t ? `${t.name} (${t.code})` : "Team selected";
//   }

//   const podiumError = useMemo(() => {
//     // enforce unique among Winner, P2, P3
//     const ids = [winner, p2, p3].filter(Boolean) as string[];
//     const set = new Set(ids);
//     if (ids.length !== set.size) return "Winner, P2, and P3 must be different drivers.";
//     return null;
//   }, [winner, p2, p3]);

//   if (loading) {
//     return (
//       <div className="mx-auto max-w-6xl px-4 py-8">
//         <SectionHeader
//           title="Predictions"
//           subtitle="Loading drivers and teams…"
//         />
//         <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
//           Loading…
//         </div>
//       </div>
//     );
//   }

//   if (err) {
//     return (
//       <div className="mx-auto max-w-6xl px-4 py-8">
//         <SectionHeader title="Predictions" subtitle="Could not load data." />
//         <div className="rounded-2xl border bg-card p-6">
//           <div className="text-sm text-red-600">{err}</div>
//           <div className="text-xs text-muted-foreground mt-2">
//             Check Supabase RLS policies for <code>drivers</code> and{" "}
//             <code>teams</code> SELECT, and ensure NEXT_PUBLIC keys are set.
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const driverGrid = (selectedId: string | null, setSelected: (id: string) => void) => (
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
//       {drivers.map((d) => (
//         <Tile
//           key={d.id}
//           title={d.full_name}
//           subtitle={d.code}
//           imgSrc={safeImg(`/images/drivers/${d.code}.png`)}
//           selected={selectedId === d.id}
//           onClick={() => setSelected(d.id)}
//         />
//       ))}
//     </div>
//   );

//   const driverOrTeamGrid = (value: Pick, setValue: (p: Pick) => void) => {
//     const isDriver = value?.kind === "driver";
//     const isTeam = value?.kind === "team";

//     return (
//       <div className="space-y-4">
//         <div className="inline-flex rounded-xl border overflow-hidden">
//           <button
//             type="button"
//             className={[
//               "px-4 py-2 text-sm font-semibold",
//               isDriver || !value ? "bg-accent/60" : "bg-background hover:bg-accent/30",
//             ].join(" ")}
//             onClick={() => {
//               // no-op; tab is purely visual here
//             }}
//           >
//             Drivers
//           </button>
//           <button
//             type="button"
//             className={[
//               "px-4 py-2 text-sm font-semibold border-l",
//               isTeam ? "bg-accent/60" : "bg-background hover:bg-accent/30",
//             ].join(" ")}
//             onClick={() => {
//               // no-op; tab is purely visual here
//             }}
//           >
//             Teams
//           </button>
//         </div>

//         <div className="text-xs text-muted-foreground">
//           You can pick either a driver or a team for this question.
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
//           {drivers.map((d) => (
//             <Tile
//               key={`d-${d.id}`}
//               title={d.full_name}
//               subtitle={`Driver • ${d.code}`}
//               imgSrc={safeImg(`/images/drivers/${d.code}.png`)}
//               selected={value?.kind === "driver" && value.id === d.id}
//               onClick={() => setValue({ kind: "driver", id: d.id })}
//             />
//           ))}
//           {teams.map((t) => (
//             <Tile
//               key={`t-${t.id}`}
//               title={t.name}
//               subtitle={`Team • ${t.code}`}
//               imgSrc={safeImg(`/images/teams/${t.code}.png`)}
//               selected={value?.kind === "team" && value.id === t.id}
//               onClick={() => setValue({ kind: "team", id: t.id })}
//             />
//           ))}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="mx-auto max-w-6xl px-4 py-8 pb-28">
//       <SectionHeader
//         title="Predictions"
//         subtitle="Submit before Practice 1. First race week is standard (no sprint)."
//       />

//       <div className="space-y-4">
//         <QuestionCard
//           title="Good Surprise"
//           description="Pick the driver or team you think will pleasantly outperform expectations."
//           expanded={openKey === "good"}
//           onToggle={() => setOpenKey(openKey === "good" ? "flop" : "good")}
//           summary={pickLabel(goodSurprise)}
//         >
//           {driverOrTeamGrid(goodSurprise, setGoodSurprise)}
//         </QuestionCard>

//         <QuestionCard
//           title="Big Flop"
//           description="Pick the driver or team you think will underperform expectations."
//           expanded={openKey === "flop"}
//           onToggle={() => setOpenKey(openKey === "flop" ? "p3" : "flop")}
//           summary={pickLabel(bigFlop)}
//         >
//           {driverOrTeamGrid(bigFlop, setBigFlop)}
//         </QuestionCard>

//         <QuestionCard
//           title="Third Position (P3)"
//           description="Pick the driver who will finish P3."
//           expanded={openKey === "p3"}
//           onToggle={() => setOpenKey(openKey === "p3" ? "p2" : "p3")}
//           summary={p3 ? `${driverById.get(p3)?.full_name ?? "Selected"}` : "None"}
//         >
//           {driverGrid(p3, (id) => setP3(id))}
//         </QuestionCard>

//         <QuestionCard
//           title="Second Position (P2)"
//           description="Pick the driver who will finish P2."
//           expanded={openKey === "p2"}
//           onToggle={() => setOpenKey(openKey === "p2" ? "win" : "p2")}
//           summary={p2 ? `${driverById.get(p2)?.full_name ?? "Selected"}` : "None"}
//         >
//           {driverGrid(p2, (id) => setP2(id))}
//         </QuestionCard>

//         <QuestionCard
//           title="Race Winner (P1)"
//           description="Pick the driver who will win the race."
//           expanded={openKey === "win"}
//           onToggle={() => setOpenKey(openKey === "win" ? "good" : "win")}
//           summary={
//             winner ? `${driverById.get(winner)?.full_name ?? "Selected"}` : "None"
//           }
//         >
//           {podiumError ? (
//             <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700">
//               {podiumError}
//             </div>
//           ) : null}
//           {driverGrid(winner, (id) => setWinner(id))}
//         </QuestionCard>
//       </div>

//       {/* Sticky submit bar */}
//       <div className="fixed bottom-0 left-0 right-0 border-t bg-background/90 backdrop-blur">
//         <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
//           <div className="text-sm text-muted-foreground min-w-0">
//             <div className="truncate">
//               Good Surprise: <span className="text-foreground">{pickLabel(goodSurprise)}</span>
//             </div>
//             <div className="truncate">
//               Big Flop: <span className="text-foreground">{pickLabel(bigFlop)}</span>
//             </div>
//           </div>

//           <div className="ml-auto flex items-center gap-3">
//             <button
//               type="button"
//               className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-accent/40"
//               onClick={() => {
//                 setGoodSurprise(null);
//                 setBigFlop(null);
//                 setP3(null);
//                 setP2(null);
//                 setWinner(null);
//                 setOpenKey("good");
//               }}
//             >
//               Reset
//             </button>

//             <button
//               type="button"
//               className={[
//                 "rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground",
//                 podiumError ? "bg-muted cursor-not-allowed" : "bg-primary hover:opacity-95",
//               ].join(" ")}
//               disabled={!!podiumError}
//               onClick={() => {
//                 // DB write will be added next (predictions table upsert).
//                 // For now: confirm payload structure in console.
//                 console.log({
//                   goodSurprise,
//                   bigFlop,
//                   p3,
//                   p2,
//                   winner,
//                 });
//                 alert("UI is connected to DB for drivers/teams. Submit write comes next.");
//               }}
//             >
//               Submit Predictions
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
