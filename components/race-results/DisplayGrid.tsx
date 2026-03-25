// /components/race-results/DisplayGrid.tsx
"use client";

import Image from "next/image";
import type { DriverRow, TeamRow } from "@/components/predictions/types";

/**
 * A read-only card used only on the race results page.
 * This does NOT reuse Tile because Tile has prediction-specific
 * selected/checkmark behavior that we do not want here.
 */
function ResultCard({
  title,
  subtitle,
  imgSrc,
}: {
  title: string;
  subtitle: string;
  imgSrc: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-4">
        {/* Image block */}
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted sm:h-32 sm:w-32">
          <Image
            src={imgSrc}
            alt={title}
            fill
            sizes="128px"
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Text block */}
        <div className="min-w-0">
          <div className="text-xl font-semibold text-foreground">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

type PickItem =
  | {
      kind: "driver";
      row: DriverRow;
    }
  | {
      kind: "team";
      row: TeamRow;
    };

export default function DisplayGrid({
  items,
  showGroupLabels = false,
}: {
  items: PickItem[];
  showGroupLabels?: boolean;
}) {
  const drivers = items.filter((x): x is { kind: "driver"; row: DriverRow } => x.kind === "driver");
  const teams = items.filter((x): x is { kind: "team"; row: TeamRow } => x.kind === "team");

  if (items.length === 0) {
    return <div className="text-sm text-muted-foreground">No result available.</div>;
  }

  return (
    <div className="space-y-6">
      {drivers.length > 0 ? (
        <div>
          {showGroupLabels ? (
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Drivers
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {drivers.map(({ row }) => (
              <ResultCard
                key={`driver-${row.id}`}
                title={row.full_name}
                subtitle={`Driver • ${row.code}`}
                imgSrc={`/images/drivers/${row.code}.png`}
              />
            ))}
          </div>
        </div>
      ) : null}

      {teams.length > 0 ? (
        <div>
          {showGroupLabels ? (
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Teams
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map(({ row }) => (
              <ResultCard
                key={`team-${row.id}`}
                title={row.name}
                subtitle={`Team • ${row.code}`}
                imgSrc={`/images/teams/${row.code}.png`}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}