"use client";

type Row = {
  display_name: string | null;
  points: number;
};

function denseRanks(points: number[]) {
  // Dense ranking: 1,2,2,3...
  let rank = 0;
  let prev: number | null = null;
  return points.map((p) => {
    if (prev === null || p !== prev) rank += 1;
    prev = p;
    return rank;
  });
}

export function LeaderboardTable({
  rows,
  caption,
}: {
  rows: Row[];
  caption: string;
}) {
  const ranks = denseRanks(rows.map((r) => r.points));

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#7700F6]/25 bg-black/40">
      <table className="w-full min-w-130 text-left text-sm text-white">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-white/10 text-white/80">
          <tr>
            <th className="px-4 py-3 w-16">#</th>
            <th className="px-4 py-3">Player</th>
            <th className="px-4 py-3 w-28 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-neutral-400" colSpan={3}>
                No results yet.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr
                key={`${r.display_name ?? "unknown"}-${i}`}
                className="border-b border-white/5 last:border-b-0 hover:bg-white/5"
              >
                <td className="px-4 py-3 text-neutral-300">{ranks[i]}</td>
                <td className="px-4 py-3 text-neutral-100">
                  {r.display_name ?? "Unnamed"}
                </td>
                <td className="px-4 py-3 text-right text-neutral-100 tabular-nums">
                  {r.points}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
