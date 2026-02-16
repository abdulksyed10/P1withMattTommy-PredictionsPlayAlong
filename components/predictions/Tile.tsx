// /components/predictions/Tile.tsx
"use client";

import Image from "next/image";
import { initials } from "./utils";

export default function Tile({
  title,
  subtitle,
  imgSrc,
  selected,
  onClick,
  size = "lg",
}: {
  title: string;
  subtitle?: string;
  imgSrc?: string;
  selected: boolean;
  onClick: () => void;
  size?: "md" | "lg";
}) {
  const imgSize = size === "lg" ? 64 : 52;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative w-full rounded-xl border p-3 text-left transition",
        "hover:border-primary/40 hover:bg-accent/40",
        selected ? "border-primary bg-accent/60" : "border-border bg-background",
      ].join(" ")}
      aria-pressed={selected}
    >
      <div className="flex items-center gap-3">
        <div
          className="relative shrink-0 rounded-lg overflow-hidden border bg-muted flex items-center justify-center"
          style={{
            width: imgSize,
            height: imgSize,
            minWidth: imgSize,
            minHeight: imgSize,
          }}
        >
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={title}
              fill
              sizes={`${imgSize}px`}
              className="object-cover"
            />
          ) : (
            <div className="text-xs font-semibold text-muted-foreground">
              {initials(title)}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="font-semibold leading-tight line-clamp-2">{title}</div>

          {/* Hide on small screens to reduce tile height */}
          {subtitle ? (
            <div className="hidden sm:block text-xs text-muted-foreground truncate mt-0.5">
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}