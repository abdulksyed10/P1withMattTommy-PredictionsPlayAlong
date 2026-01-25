export type LeaderboardSeasonRow = {
  user_id: string;
  display_name: string | null;
  points: number;
};

export type LeaderboardRaceRow = {
  race_id: string;
  user_id: string;
  display_name: string | null;
  points: number;
};

export type RaceOption = {
  id: string;
  round: number | null;
  name: string;
  race_date: string | null; // ISO
};
