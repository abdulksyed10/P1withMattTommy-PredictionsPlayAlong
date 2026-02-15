// /components/predictions/DriverOrTeamGrid.tsx
"use client";

import DriverTeamToggle from "@/components/predictions/DriverTeamToggle";
import Tile from "@/components/predictions/Tile";
import { safeImg } from "@/components/predictions/utils";
import type { DriverRow, TeamRow, Pick } from "@/components/predictions/types";

export default function DriverOrTeamGrid({
  drivers,
  teams,
  value,
  onChange,
  tab,
  onTabChange,
  onPicked,
  size = "lg",
}: {
  drivers: DriverRow[];
  teams: TeamRow[];
  value: Pick;
  onChange: (p: Pick) => void;
  tab: "drivers" | "teams";
  onTabChange: (t: "drivers" | "teams") => void;
  onPicked?: () => void;
  size?: "md" | "lg";
}) {
  return (
    <div className="space-y-4">
      <DriverTeamToggle value={tab} onChange={onTabChange} />

      <div className="text-xs text-muted-foreground">
        You can pick either a driver or a team for this question.
      </div>

      {tab === "drivers" ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {drivers.map((d) => (
            <Tile
              key={`d-${d.id}`}
              title={d.full_name}
              subtitle={`Driver • ${d.code}`}
              imgSrc={safeImg(`/images/drivers/${d.code}.png`)}
              selected={value?.kind === "driver" && value.id === d.id}
              onClick={() => {
                onChange({ kind: "driver", id: d.id });
                onPicked?.();
            }}
              size={size}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {teams.map((t) => (
            <Tile
              key={`t-${t.id}`}
              title={t.name}
              subtitle={`Team • ${t.code}`}
              imgSrc={safeImg(`/images/teams/${t.code}.png`)}
              selected={value?.kind === "team" && value.id === t.id}
              onClick={() => {
                onChange({ kind: "team", id: t.id });
                onPicked?.();
            }}
              size={size}
            />
          ))}
        </div>
      )}
    </div>
  );
}