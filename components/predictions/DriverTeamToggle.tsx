// /components/predictions/DriverTeamToggle.tsx
"use client";

export default function DriverTeamToggle({
  value,
  onChange,
}: {
  value: "drivers" | "teams";
  onChange: (v: "drivers" | "teams") => void;
}) {
  return (
    <div className="inline-flex rounded-xl border overflow-hidden">
      <button
        type="button"
        className={[
          "px-4 py-2 text-sm font-semibold transition",
          value === "drivers"
            ? "bg-accent/60"
            : "bg-background hover:bg-accent/30",
        ].join(" ")}
        onClick={() => onChange("drivers")}
        aria-pressed={value === "drivers"}
      >
        Drivers
      </button>
      <button
        type="button"
        className={[
          "px-4 py-2 text-sm font-semibold border-l transition",
          value === "teams"
            ? "bg-accent/60"
            : "bg-background hover:bg-accent/30",
        ].join(" ")}
        onClick={() => onChange("teams")}
        aria-pressed={value === "teams"}
      >
        Teams
      </button>
    </div>
  );
}