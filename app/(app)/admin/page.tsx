"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [races, setRaces] = useState<any[]>([]);
  const [raceId, setRaceId] = useState("");

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();

      const email = data.user?.email;

      const admins =
        process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").map((e) => e.trim()) ??
        [];

      if (!email) {
        router.push("/login?redirect=/admin");
        return;
      }

      if (!admins.includes(email)) {
        router.push("/");
        return;
      }

      setLoading(false);

      const { data: raceData } = await supabase
        .from("races")
        .select("id,name,round")
        .order("round", { ascending: false });

      setRaces(raceData ?? []);
    }

    checkUser();
  }, []);

  async function scoreRace() {
    if (!raceId) {
      alert("Select a race first");
      return;
    }

    const res = await fetch(`/api/admin/score-race?raceId=${raceId}`, {
      method: "POST",
      headers: {
        "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SCORE_SECRET!,
      },
    });

    const text = await res.text();

    if (!res.ok) {
      alert(text);
      return;
    }

    alert("Race scored successfully");
  }

  if (loading) {
    return <div className="p-8">Checking admin access...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-8 space-y-6">

      <h1 className="text-2xl font-bold">
        Admin – Score Race
      </h1>

      <select
        value={raceId}
        onChange={(e) => setRaceId(e.target.value)}
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
        onClick={scoreRace}
        className="bg-purple-600 text-white px-4 py-2 rounded"
      >
        Score Race
      </button>

    </div>
  );
}