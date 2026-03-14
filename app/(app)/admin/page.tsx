import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function getRaces() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("races")
    .select("id, name, round")
    .order("round", { ascending: false });

  return data ?? [];
}

async function scoreRace(formData: FormData) {
  "use server";

  const raceId = formData.get("raceId") as string;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/score-race?raceId=${raceId}`,
    {
      method: "POST",
      headers: {
        "x-admin-secret": process.env.ADMIN_SCORE_SECRET!,
      },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Scoring failed");
  }
}

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) ?? [];

  if (!adminEmails.includes(user.email ?? "")) {
    redirect("/");
  }

  const races = await getRaces();

  return (
    <div className="max-w-xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Admin – Score Race</h1>

      <form action={scoreRace} className="space-y-4">

        <select
          name="raceId"
          required
          className="border p-2 rounded w-full"
        >
          <option value="">Select race</option>

          {races.map((race) => (
            <option key={race.id} value={race.id}>
              Round {race.round} — {race.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          Score Race
        </button>

      </form>
    </div>
  );
}