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
    <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full min-w-[520px] text-left text-sm text-foreground">
        <caption className="sr-only">{caption}</caption>

        <thead className="border-b border-border text-muted-foreground">
          <tr>
            <th className="px-4 py-3 w-16 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Player</th>
            <th className="px-4 py-3 w-28 text-right font-semibold">Points</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-muted-foreground" colSpan={3}>
                No results yet.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const rank = ranks[i];
              const isFirst = rank === 1;

              return (
                <tr
                  key={`${r.display_name ?? "unknown"}-${i}`}
                  className="border-b border-border/60 last:border-b-0 hover:bg-accent/40 transition-colors"
                >
                  <td
                    className={[
                      "px-4 py-3 tabular-nums",
                      isFirst ? "font-semibold text-primary" : "text-muted-foreground",
                    ].join(" ")}
                    style={isFirst ? { textShadow: "var(--p1-glow)" } : undefined}
                  >
                    {rank}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={isFirst ? "font-semibold" : "font-medium"}
                      style={isFirst ? { textShadow: "var(--p1-glow)" } : undefined}
                    >
                      {r.display_name ?? "Unnamed"}
                    </span>
                  </td>

                  <td
                    className={[
                      "px-4 py-3 text-right tabular-nums",
                      isFirst ? "font-semibold text-primary" : "font-medium",
                    ].join(" ")}
                    style={isFirst ? { textShadow: "var(--p1-glow)" } : undefined}
                  >
                    {r.points}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
