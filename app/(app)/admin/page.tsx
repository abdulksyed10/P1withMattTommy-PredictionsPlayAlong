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

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) ?? [];

  if (!adminEmails.includes(user.email ?? "")) {
    throw new Error("Not authorized");
  }

  const raceId = formData.get("raceId") as string;

  if (!raceId) throw new Error("Race not selected");

  // run scoring directly using DB function
  const { error } = await supabase.rpc("score_race", {
    race_id: raceId,
  });

  if (error) {
    console.error(error);
    throw new Error("Scoring failed");
  }
}

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/admin");

  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) ?? [];

  if (!adminEmails.includes(user.email ?? "")) {
    redirect("/");
  }

  const races = await getRaces();

  return (
    <div className="max-w-xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

      <form action={scoreRace} className="space-y-4">

        <select name="raceId" required className="border p-2 rounded w-full">
          <option value="">Select race</option>

          {races.map((race) => (
            <option key={race.id} value={race.id}>
              Round {race.round} — {race.name}
            </option>
          ))}
        </select>

        <button
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          Score Race
        </button>

      </form>
    </div>
  );
}