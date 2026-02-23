"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchRaceLeaderboard,
  fetchRaceOptions,
  fetchSeasonLeaderboard,
} from "@/lib/queries/leaderboard";
import type {
  LeaderboardRaceRow,
  LeaderboardSeasonRow,
  RaceOption,
} from "@/lib/types/leaderboard";
import { LeaderboardTable } from "./LeaderboardTable";
import { supabase } from "@/lib/supabaseClient";

type Tab = "season" | "race";

function formatRaceLabel(r: RaceOption) {
  const date = r.race_date ? new Date(r.race_date).toLocaleDateString() : "";
  const round = r.round ? `R${r.round} — ` : "";
  return `${round}${r.name}${date ? ` (${date})` : ""}`;
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-4 py-2 text-sm font-semibold border transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-border bg-accent text-accent-foreground shadow-(--p1-glow)"
          : "border-border/70 bg-card text-muted-foreground hover:text-foreground hover:bg-accent/40",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function LeaderboardTabs() {
  const [tab, setTab] = useState<Tab>("season");

  const [seasonRows, setSeasonRows] = useState<LeaderboardSeasonRow[]>([]);
  const [races, setRaces] = useState<RaceOption[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string>("");

  const [raceRows, setRaceRows] = useState<LeaderboardRaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRace, setLoadingRace] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [highlightDisplayName, setHighlightDisplayName] = useState<string | null>(null);

  const selectedRace = useMemo(
    () => races.find((r) => r.id === selectedRaceId),
    [races, selectedRaceId]
  );

  // Default race = most recently SCORED (else Round 1)
  async function pickDefaultRaceId(raceOptions: RaceOption[]) {
    if (!raceOptions.length) return "";

    // Sort by round descending to find “most recently scored”
    const byRoundDesc = [...raceOptions].sort(
      (a, b) => (b.round ?? 0) - (a.round ?? 0)
    );

    for (const r of byRoundDesc) {
      try {
        const rows = await fetchRaceLeaderboard(r.id);
        if (rows && rows.length > 0) return r.id; // scored if it returns rows
      } catch {
        // ignore and continue
      }
    }

    // If none scored: default to Round 1 if present, otherwise the smallest round
    const round1 = raceOptions.find((r) => r.round === 1);
    if (round1) return round1.id;

    const byRoundAsc = [...raceOptions].sort(
      (a, b) => (a.round ?? 0) - (b.round ?? 0)
    );
    return byRoundAsc[0]?.id ?? raceOptions[0].id;
  }

  // Initial load: season leaderboard + races list
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        try {
          const { data: userData } = await supabase.auth.getUser();
          const user = userData.user ?? null;
          if (user) {
            const { data: meRow } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("id", user.id)
              .maybeSingle();

            if (!cancelled) setHighlightDisplayName(meRow?.display_name ?? null);
          } else {
            if (!cancelled) setHighlightDisplayName(null);
          }
        } catch {
          if (!cancelled) setHighlightDisplayName(null);
        }

        const [season, raceOptions] = await Promise.all([
          fetchSeasonLeaderboard(),
          fetchRaceOptions(),
        ]);

        if (cancelled) return;

        setSeasonRows(season);
        setRaces(raceOptions);

        if (raceOptions.length > 0) {
          const defaultId = await pickDefaultRaceId(raceOptions);
          if (!cancelled) setSelectedRaceId(defaultId);
        } else {
          setSelectedRaceId("");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load leaderboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load race leaderboard when race changes
  useEffect(() => {
    if (!selectedRaceId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingRace(true);
        setError(null);
        const rows = await fetchRaceLeaderboard(selectedRaceId);
        if (!cancelled) setRaceRows(rows);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load race results.");
      } finally {
        if (!cancelled) setLoadingRace(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedRaceId]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-foreground">Leaderboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Season totals by default. Switch to Race for per-race results.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <TabButton active={tab === "season"} onClick={() => setTab("season")}>
          Season
        </TabButton>

        <TabButton active={tab === "race"} onClick={() => setTab("race")}>
          Race
        </TabButton>

        <div className="flex-1" />

        {tab === "race" && (
          <label className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Race
            </span>
            <select
              className="w-full sm:w-[320px] rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={selectedRaceId}
              onChange={(e) => setSelectedRaceId(e.target.value)}
            >
              {races.map((r) => (
                <option key={r.id} value={r.id}>
                  {formatRaceLabel(r)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-6 text-muted-foreground">
          Loading…
        </div>
      ) : tab === "season" ? (
        <LeaderboardTable
          caption="Season leaderboard"
          highlightDisplayName={highlightDisplayName}
          rows={seasonRows.map((r) => ({
            display_name: r.display_name,
            points: r.total_points,
          }))}
        />
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {selectedRace ? formatRaceLabel(selectedRace) : "Select a race."}
            {loadingRace ? " — loading…" : ""}
          </div>

          <LeaderboardTable
            caption="Race leaderboard"
            highlightDisplayName={highlightDisplayName}
            rows={raceRows.map((r) => ({
              display_name: r.display_name,
              points: r.total_points,
            }))}
          />
        </div>
      )}
    </div>
  );
}
