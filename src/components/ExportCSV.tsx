import { Download } from "lucide-react";
import type { Snapshot } from "@/hooks/useSnapshots";
import { getDistanceBandLabel } from "@/lib/geo";

interface ExportCSVProps {
  snapshots: Snapshot[];
}

function escapeCSV(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function ExportCSV({ snapshots }: ExportCSVProps) {
  const exportCSV = () => {
    const headers = [
      "date", "role", "region", "platform", "job_title",
      "company_name", "location_detail", "salary_range",
      "keyword_hits", "keyword_score", "seniority_hint",
      "latitude", "longitude", "distance_km", "distance_band",
      "preview_snippet", "search_url", "source_url",
    ];

    const rows = snapshots.map((s) => [
      s.date,
      s.role,
      s.region,
      s.platform,
      s.job_title ?? s.role,
      s.company_name ?? "",
      s.location_detail ?? "",
      s.salary_range ?? "",
      (s.keyword_hits ?? []).join("; "),
      s.keyword_score ?? 0,
      s.seniority_hint ? "Yes" : "No",
      s.latitude ?? "",
      s.longitude ?? "",
      s.distance_km ?? "",
      getDistanceBandLabel(s.distance_km),
      s.preview_snippet ?? "",
      s.linkedin_search_url,
      s.source_url ?? "",
    ]);

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((r) => r.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snapshots-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (snapshots.length === 0) return null;

  return (
    <button
      onClick={exportCSV}
      className="filter-chip flex items-center gap-2 border-accent/40 text-accent hover:bg-accent hover:text-accent-foreground"
    >
      <Download className="w-3.5 h-3.5" />
      <span className="text-xs">Export CSV</span>
    </button>
  );
}
