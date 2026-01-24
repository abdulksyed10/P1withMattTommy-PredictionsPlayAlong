// app/api/admin/score-race/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type PredictionRow = {
  prediction_set_id: string;
  question_id: string;
  answer_driver_id: string | null;
  answer_team_id: string | null;
};

function requireAdmin(req: Request): boolean {
  const secret = req.headers.get("x-admin-secret");
  return !!process.env.ADMIN_SCORE_SECRET && secret === process.env.ADMIN_SCORE_SECRET;
}

export async function POST(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const raceId = searchParams.get("raceId");
  if (!raceId) {
    return NextResponse.json({ error: "Missing raceId" }, { status: 400 });
  }

  // 1) Race -> season
  const { data: race, error: raceErr } = await supabaseAdmin
    .from("races")
    .select("id, season_id")
    .eq("id", raceId)
    .single();

  if (raceErr || !race) {
    return NextResponse.json({ error: raceErr?.message ?? "Race not found" }, { status: 404 });
  }

  const seasonId = race.season_id as string;

  // 2) Scoring rules for season: question_id -> (points_driver, points_team)
  const { data: scoring, error: scoringErr } = await supabaseAdmin
    .from("question_scoring")
    .select("question_id, points_driver, points_team")
    .eq("season_id", seasonId);

  if (scoringErr) {
    return NextResponse.json({ error: scoringErr.message }, { status: 500 });
  }

  const pointsByQuestion = new Map<string, { driver: number; team: number }>();
  for (const s of scoring ?? []) {
    pointsByQuestion.set(s.question_id as string, {
      driver: s.points_driver as number,
      team: s.points_team as number,
    });
  }

  // 3) Published answer keys for this race
  const { data: keys, error: keysErr } = await supabaseAdmin
    .from("race_question_answer_keys")
    .select("id, question_id, published_at")
    .eq("race_id", raceId)
    .not("published_at", "is", null);

  if (keysErr) {
    return NextResponse.json({ error: keysErr.message }, { status: 500 });
  }

  if (!keys || keys.length === 0) {
    return NextResponse.json({ ok: true, message: "No published results for this race yet." });
  }

  // Build mapping:
  // question_id -> answer_key_id
  // answer_key_id -> question_id
  const keyIdByQuestion = new Map<string, string>();
  const questionByKeyId = new Map<string, string>();
  const answerKeyIds: string[] = [];

  for (const k of keys) {
    const qid = k.question_id as string;
    const kid = k.id as string;
    keyIdByQuestion.set(qid, kid);
    questionByKeyId.set(kid, qid);
    answerKeyIds.push(kid);
  }

  // Load correct choices for these published keys
  const { data: choices, error: choicesErr } = await supabaseAdmin
    .from("race_question_correct_choices")
    .select("answer_key_id, choice_kind, driver_id, team_id")
    .in("answer_key_id", answerKeyIds);

  if (choicesErr) {
    return NextResponse.json({ error: choicesErr.message }, { status: 500 });
  }

  // correct sets per question
  const correctDriversByQuestion = new Map<string, Set<string>>();
  const correctTeamsByQuestion = new Map<string, Set<string>>();

  for (const qid of keyIdByQuestion.keys()) {
    correctDriversByQuestion.set(qid, new Set());
    correctTeamsByQuestion.set(qid, new Set());
  }

  for (const c of (choices ?? []) as any[]) {
    const qid = questionByKeyId.get(c.answer_key_id as string);
    if (!qid) continue;

    if (c.choice_kind === "driver" && c.driver_id) {
      correctDriversByQuestion.get(qid)!.add(c.driver_id as string);
    } else if (c.choice_kind === "team" && c.team_id) {
      correctTeamsByQuestion.get(qid)!.add(c.team_id as string);
    }
  }

  // 4) Prediction sets for this race (all users)
  const { data: sets, error: setsErr } = await supabaseAdmin
    .from("prediction_sets")
    .select("id, user_id")
    .eq("race_id", raceId);

  if (setsErr) {
    return NextResponse.json({ error: setsErr.message }, { status: 500 });
  }

  if (!sets || sets.length === 0) {
    return NextResponse.json({ ok: true, message: "No prediction sets for this race." });
  }

  const setIds = sets.map((s) => s.id as string);

  // Map set_id -> user_id
  const userBySet = new Map<string, string>();
  for (const s of sets) userBySet.set(s.id as string, s.user_id as string);

  // 5) Predictions for those sets (driver/team scoring only for MVP)
  const { data: preds, error: predsErr } = await supabaseAdmin
    .from("predictions")
    .select("prediction_set_id, question_id, answer_driver_id, answer_team_id")
    .in("prediction_set_id", setIds);

  if (predsErr) {
    return NextResponse.json({ error: predsErr.message }, { status: 500 });
  }

  // 6) Compute total points per user for this race
  const totalByUser = new Map<string, number>();

  for (const p of (preds ?? []) as unknown as PredictionRow[]) {
    const userId = userBySet.get(p.prediction_set_id);
    if (!userId) continue;

    const qid = p.question_id;

    // Only score questions that have published results
    if (!keyIdByQuestion.has(qid)) continue;

    const scoringRule = pointsByQuestion.get(qid);
    if (!scoringRule) continue;

    let earned = 0;

    if (p.answer_driver_id) {
      const correct = correctDriversByQuestion.get(qid)?.has(p.answer_driver_id) ?? false;
      if (correct) earned = scoringRule.driver;
    } else if (p.answer_team_id) {
      const correct = correctTeamsByQuestion.get(qid)?.has(p.answer_team_id) ?? false;
      if (correct) earned = scoringRule.team;
    }

    totalByUser.set(userId, (totalByUser.get(userId) ?? 0) + earned);
  }

  // Ensure everyone with a prediction_set gets a row (even if 0 points)
  const computedAt = new Date().toISOString();
  const upsertRaceRows = sets.map((s) => {
    const uid = s.user_id as string;
    return {
      user_id: uid,
      race_id: raceId,
      total_points: totalByUser.get(uid) ?? 0,
      computed_at: computedAt,
    };
  });

  const { error: upsertRaceErr } = await supabaseAdmin
    .from("user_race_scores")
    .upsert(upsertRaceRows, { onConflict: "user_id,race_id" });

  if (upsertRaceErr) {
    return NextResponse.json({ error: upsertRaceErr.message }, { status: 500 });
  }

  // 7) Recompute season totals from user_race_scores for this season
  const { data: seasonRaces, error: seasonRacesErr } = await supabaseAdmin
    .from("races")
    .select("id")
    .eq("season_id", seasonId);

  if (seasonRacesErr) {
    return NextResponse.json({ error: seasonRacesErr.message }, { status: 500 });
  }

  const seasonRaceIds = (seasonRaces ?? []).map((r) => r.id as string);
  if (seasonRaceIds.length === 0) {
    return NextResponse.json({ ok: true, message: "No races in this season to sum." });
  }

  const { data: raceScores, error: raceScoresErr } = await supabaseAdmin
    .from("user_race_scores")
    .select("user_id, total_points")
    .in("race_id", seasonRaceIds);

  if (raceScoresErr) {
    return NextResponse.json({ error: raceScoresErr.message }, { status: 500 });
  }

  const seasonTotalByUser = new Map<string, number>();
  for (const rs of raceScores ?? []) {
    const uid = rs.user_id as string;
    const pts = rs.total_points as number;
    seasonTotalByUser.set(uid, (seasonTotalByUser.get(uid) ?? 0) + pts);
  }

  const upsertSeasonRows = [...seasonTotalByUser.entries()].map(([user_id, total_points]) => ({
    user_id,
    season_id: seasonId,
    total_points,
    computed_at: computedAt,
  }));

  const { error: upsertSeasonErr } = await supabaseAdmin
    .from("user_season_scores")
    .upsert(upsertSeasonRows, { onConflict: "user_id,season_id" });

  if (upsertSeasonErr) {
    return NextResponse.json({ error: upsertSeasonErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    raceId,
    seasonId,
    prediction_sets_scored: sets.length,
    questions_with_published_results: keys.length,
  });
}
