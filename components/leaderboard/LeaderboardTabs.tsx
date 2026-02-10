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

type Tab = "season" | "race";

function formatRaceLabel(r: RaceOption) {
  const date = r.race_date ? new Date(r.race_date).toLocaleDateString() : "";
  const round = r.round ? `R${r.round} — ` : "";
  return `${round}${r.name}${date ? ` (${date})` : ""}`;
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

  const selectedRace = useMemo(
    () => races.find((r) => r.id === selectedRaceId),
    [races, selectedRaceId]
  );

  // Initial load: season leaderboard + races list
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [season, raceOptions] = await Promise.all([
          fetchSeasonLeaderboard(),
          fetchRaceOptions(),
        ]);

        if (cancelled) return;

        setSeasonRows(season);
        setRaces(raceOptions);

        // Default race selection: first race that has any leaderboard rows (best effort)
        // If you have a "scored_at" or similar, replace this logic later.
        if (raceOptions.length > 0) {
          setSelectedRaceId(raceOptions[0].id);
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

  // Load race leaderboard when race changes (only when race tab is used OR always; your call)
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
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Leaderboard</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Season totals by default. Switch to Race for per-race results.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <button
          className={[
            "rounded-lg px-3 py-2 text-sm font-semibold border transition",
            "focus:outline-none focus:ring-2 focus:ring-[#7700F6]/40",
            tab === "season"
              ? "border-[#7700F6]/60 bg-[#7700F6]/15 text-white"
              : "border-white/10 bg-transparent text-white/70 hover:bg-white/5 hover:text-white",
          ].join(" ")}
          onClick={() => setTab("season")}
        >
          Season
        </button>
        <button
          className={[
            "rounded-lg px-3 py-2 text-sm font-semibold border transition",
            "focus:outline-none focus:ring-2 focus:ring-[#7700F6]/40",
            tab === "race"
              ? "border-[#7700F6]/60 bg-[#7700F6]/15 text-white"
              : "border-white/10 bg-transparent text-white/70 hover:bg-white/5 hover:text-white",
          ].join(" ")}
          onClick={() => setTab("race")}
        >
          Race
        </button>

        <div className="ml-auto" />

        {tab === "race" && (
          <select
            className="max-w-85 rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white
              focus:outline-none focus:ring-2 focus:ring-[#7700F6]/40 focus:border-[#7700F6]/60"
            value={selectedRaceId}
            onChange={(e) => setSelectedRaceId(e.target.value)}
          >
            {races.map((r) => (
              <option key={r.id} value={r.id}>
                {formatRaceLabel(r)}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-6 text-neutral-300">
          Loading…
        </div>
      ) : tab === "season" ? (
        <LeaderboardTable
          caption="Season leaderboard"
          rows={seasonRows.map((r) => ({
            display_name: r.display_name,
            points: r.total_points,
          }))}
        />
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-neutral-400">
            {selectedRace ? formatRaceLabel(selectedRace) : "Select a race."}
            {loadingRace ? " — loading…" : ""}
          </div>
          <LeaderboardTable
            caption="Race leaderboard"
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
