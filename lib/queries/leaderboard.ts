import { supabase } from "@/lib/supabaseClient";
import type {
  LeaderboardSeasonRow,
  LeaderboardRaceRow,
  RaceOption,
} from "@/lib/types/leaderboard";

export async function fetchSeasonLeaderboard(): Promise<LeaderboardSeasonRow[]> {
  const { data, error } = await supabase
    .from("leaderboard_season")
    .select("user_id, display_name, points")
    .order("points", { ascending: false });

  if (error) throw error;
  return (data ?? []) as LeaderboardSeasonRow[];
}

export async function fetchRaceOptions(): Promise<RaceOption[]> {
  const { data, error } = await supabase
    .from("races")
    .select("id, round, name, race_date")
    .order("race_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as RaceOption[];
}

export async function fetchRaceLeaderboard(
  raceId: string
): Promise<LeaderboardRaceRow[]> {
  const { data, error } = await supabase
    .from("leaderboard_race")
    .select("race_id, user_id, display_name, points")
    .eq("race_id", raceId)
    .order("points", { ascending: false });

  if (error) throw error;
  return (data ?? []) as LeaderboardRaceRow[];
}
