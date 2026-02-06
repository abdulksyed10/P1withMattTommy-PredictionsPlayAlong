// This still needs work, but it's a starting point for the POST handler to submit predictions.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabaseClient";
// import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

type Pick =
  | { kind: "driver"; id: string }
  | { kind: "team"; id: string }
  | null;

type Body = {
  // optional later when you move to /predict/[raceId]
  raceId?: string;

  goodSurprise: Pick;
  bigFlop: Pick;
  p3: string | null;
  p2: string | null;
  winner: string | null;
};

const QUESTION_KEYS = {
  GOOD_SURPRISE: "good_surprise",
  BIG_FLOP: "big_flop",
  P3: "p3",
  P2: "p2",
  WINNER: "p1_winner",
} as const;

export const runtime = "nodejs";

// export async function POST(req: Request) {
//   const supabase = createRouteHandlerClient({ cookies });
supabase.auth.getUser().then(({ data: { user }, error }) => {
  console.log("User:", user, "Error:", error);
});

export async function POST(req: Request) {
  // 0) Auth
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await req.json()) as Body;

  // 1) Validate podium uniqueness
  const podium = [body.winner, body.p2, body.p3].filter(Boolean) as string[];
  if (new Set(podium).size !== podium.length) {
    return NextResponse.json(
      { error: "Winner, P2, and P3 must be different drivers." },
      { status: 400 }
    );
  }

  // 2) Determine race
  let raceId = body.raceId;

  if (!raceId) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const { data: race, error: raceErr } = await supabase
      .from("races")
      .select("id, race_date, seasons!inner(is_active)")
      .eq("seasons.is_active", true)
      .gte("race_date", today)
      .order("race_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (raceErr || !race) {
      return NextResponse.json(
        { error: "No upcoming race found in active season." },
        { status: 400 }
      );
    }

    raceId = race.id as string;
  }

  // 3) Lock check: FP1
  const { data: fp1, error: fp1Err } = await supabase
    .from("race_sessions")
    .select("starts_at")
    .eq("race_id", raceId)
    .eq("session", "fp1")
    .maybeSingle();

  if (fp1Err || !fp1?.starts_at) {
    return NextResponse.json(
      { error: "FP1 starts_at not configured for this race." },
      { status: 400 }
    );
  }

  const lockAt = new Date(fp1.starts_at);
  if (Date.now() >= lockAt.getTime()) {
    return NextResponse.json(
      { error: "Predictions are locked (FP1 has started)." },
      { status: 403 }
    );
  }

  // 4) Fetch question IDs by key
  const keys = Object.values(QUESTION_KEYS);

  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("id, key")
    .in("key", keys);

  if (qErr || !questions || questions.length !== keys.length) {
    return NextResponse.json(
      { error: "Questions missing. Check questions.key values." },
      { status: 400 }
    );
  }

  const qidByKey = new Map<string, string>();
  for (const q of questions as any[]) qidByKey.set(q.key, q.id);

  // 5) Upsert prediction_set (one per user+race)
  const nowIso = new Date().toISOString();

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
    return NextResponse.json(
      { error: setErr?.message ?? "Failed to upsert prediction_set." },
      { status: 500 }
    );
  }

  const predictionSetId = setRow.id as string;

  // 6) Upsert predictions rows (one per question)
  const rows = [
    {
      prediction_set_id: predictionSetId,
      question_id: qidByKey.get(QUESTION_KEYS.GOOD_SURPRISE),
      answer_driver_id: body.goodSurprise?.kind === "driver" ? body.goodSurprise.id : null,
      answer_team_id: body.goodSurprise?.kind === "team" ? body.goodSurprise.id : null,
      answer_int: null,
      answer_text: null,
      updated_at: nowIso,
    },
    {
      prediction_set_id: predictionSetId,
      question_id: qidByKey.get(QUESTION_KEYS.BIG_FLOP),
      answer_driver_id: body.bigFlop?.kind === "driver" ? body.bigFlop.id : null,
      answer_team_id: body.bigFlop?.kind === "team" ? body.bigFlop.id : null,
      answer_int: null,
      answer_text: null,
      updated_at: nowIso,
    },
    {
      prediction_set_id: predictionSetId,
      question_id: qidByKey.get(QUESTION_KEYS.P3),
      answer_driver_id: body.p3,
      answer_team_id: null,
      answer_int: null,
      answer_text: null,
      updated_at: nowIso,
    },
    {
      prediction_set_id: predictionSetId,
      question_id: qidByKey.get(QUESTION_KEYS.P2),
      answer_driver_id: body.p2,
      answer_team_id: null,
      answer_int: null,
      answer_text: null,
      updated_at: nowIso,
    },
    {
      prediction_set_id: predictionSetId,
      question_id: qidByKey.get(QUESTION_KEYS.WINNER),
      answer_driver_id: body.winner,
      answer_team_id: null,
      answer_int: null,
      answer_text: null,
      updated_at: nowIso,
    },
  ];

  const { error: predErr } = await supabase
    .from("predictions")
    .upsert(rows, { onConflict: "prediction_set_id,question_id" });

  if (predErr) {
    return NextResponse.json(
      { error: predErr.message ?? "Failed to save predictions." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, raceId, lockedAt: fp1.starts_at });
}
