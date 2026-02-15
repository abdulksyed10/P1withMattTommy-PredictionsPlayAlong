// /components/predictions/QuestionCard.tsx
"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

export default function QuestionCard({
  title,
  description,
  expanded,
  onToggle,
  summary,
  children,
}: {
  title: string;
  description?: string;
  expanded: boolean;
  onToggle: () => void;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex items-start justify-between gap-4 p-4 md:p-5">
        <div className="min-w-0">
          <div className="text-lg font-semibold">{title}</div>
          {description ? (
            <div className="text-sm text-muted-foreground mt-1">
              {description}
            </div>
          ) : null}
          <div className="text-sm mt-2">
            <span className="text-muted-foreground">Selected: </span>
            <span className={summary === "None" ? "text-muted-foreground" : ""}>
              {summary}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-accent/40"
          aria-expanded={expanded}
        >
          {expanded ? "Collapse" : "Expand"}
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {expanded ? (
        <div className="px-4 pb-4 md:px-5 md:pb-5">
          <div className="h-px bg-border mb-4" />
          {children}
        </div>
      ) : null}
    </div>
  );
}