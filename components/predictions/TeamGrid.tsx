"use client";

import Tile from "@/components/predictions/Tile";
import { safeImg } from "@/components/predictions/utils";
import type { TeamRow } from "@/components/predictions/types";

export default function TeamGrid({
  teams,
  selectedId,
  onSelect,
  onPicked,
  size = "lg",
}: {
  teams: TeamRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPicked?: () => void;
  size?: "md" | "lg";
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {teams.map((t) => (
        <Tile
          key={t.id}
          title={t.name}
          subtitle={t.code}
          imgSrc={safeImg(`/images/teams/${t.code}.png`)}
          selected={selectedId === t.id}
          onClick={() => {
            onSelect(t.id);
            onPicked?.();
        }}
          size={size}
        />
      ))}
    </div>
  );
}