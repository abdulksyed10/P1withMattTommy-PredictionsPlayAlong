import { supabase } from "../../../../lib/supabaseClient";

export default async function DbTestPage() {
  const [{ data: teams, error: teamsErr }, { data: drivers, error: driversErr }] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, code, name, is_active")
        .order("name"),
      supabase
        .from("drivers")
        .select("id, code, full_name, is_active")
        .order("full_name"),
    ]);

  return (
    <main className="p-6 space-y-8">
      <section>
        <h1 className="text-xl font-semibold">DB Test</h1>
        <p className="text-sm text-gray-500">
          Reading teams/drivers from Supabase
        </p>
      </section>

      <section>
        <h2 className="text-lg font-medium">Teams</h2>
        {teamsErr && (
          <pre className="text-red-600">{teamsErr.message}</pre>
        )}
        <pre className="bg-gray-100 p-3 rounded">
          {JSON.stringify(teams, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="text-lg font-medium">Drivers</h2>
        {driversErr && (
          <pre className="text-red-600">{driversErr.message}</pre>
        )}
        <pre className="bg-gray-100 p-3 rounded">
          {JSON.stringify(drivers, null, 2)}
        </pre>
      </section>
    </main>
  );
}
