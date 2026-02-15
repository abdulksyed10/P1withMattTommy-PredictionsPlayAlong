// /components/predictions/DriverGrid.tsx
"use client";

import Tile from "@/components/predictions/Tile";
import { safeImg } from "@/components/predictions/utils";
import type { DriverRow } from "@/components/predictions/types";

export default function DriverGrid({
  drivers,
  selectedId,
  onSelect,
  onPicked,
  size = "lg",
}: {
  drivers: DriverRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPicked?: () => void;
  size?: "md" | "lg";
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {drivers.map((d) => (
        <Tile
          key={d.id}
          title={d.full_name}
          subtitle={d.code}
          imgSrc={safeImg(`/images/drivers/${d.code}.png`)}
          selected={selectedId === d.id}
          onClick={() => {
            onSelect(d.id);
            onPicked?.();
        }}
          size={size}
        />
      ))}
    </div>
  );
}