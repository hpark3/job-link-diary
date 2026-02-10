import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { MatchResult } from "@/lib/matchScore";

const levelStyles: Record<MatchResult["level"], string> = {
  high: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-red-100 text-red-600 border-red-200",
};

const levelLabel: Record<MatchResult["level"], string> = {
  high: "High",
  medium: "Med",
  low: "Low",
};

export function MatchBadge({ match }: { match: MatchResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${levelStyles[match.level]}`}
      >
        <span className="font-bold">{match.score}</span>
        <span className="opacity-70">·</span>
        <span>{levelLabel[match.level]}</span>
        {expanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {expanded && (
        <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
          {match.reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-1">
              <span className="shrink-0 mt-0.5">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
