import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEARCH_QUERIES, REGIONS, buildLinkedInSearchUrl, buildIndeedSearchUrl, extractSignals, normalizeRole } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function GenerateButton() {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      const allRows = SEARCH_QUERIES.flatMap((query) =>
        REGIONS.flatMap((region) => {
          const signals = extractSignals(query);
          const role = normalizeRole(query);
          return [
            {
              date: today,
              role,
              region: region.name,
              platform: "LinkedIn",
              linkedin_search_url: buildLinkedInSearchUrl(query, region.geoId),
              job_title: query,
              keyword_hits: signals.keyword_hits,
              keyword_score: signals.keyword_score,
              seniority_hint: signals.seniority_hint,
            },
            {
              date: today,
              role,
              region: region.name,
              platform: "Indeed",
              linkedin_search_url: buildIndeedSearchUrl(query, region.indeedDomain, region.indeedLocation),
              job_title: query,
              keyword_hits: signals.keyword_hits,
              keyword_score: signals.keyword_score,
              seniority_hint: signals.seniority_hint,
            },
          ];
        })
      );

      // Deduplicate by conflict key (date,role,region,platform) – first occurrence wins
      const seen = new Set<string>();
      const rows = allRows.filter((r) => {
        const key = `${r.date}|${r.role}|${r.region}|${r.platform}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const { error } = await supabase.from("snapshots").upsert(rows, {
        onConflict: "date,role,region,platform",
      });

      if (error) throw error;

      toast({ title: "Snapshots generated", description: `${rows.length} snapshots for ${today}` });
      await queryClient.invalidateQueries({ queryKey: ["snapshots"], refetchType: "active" });
      await queryClient.invalidateQueries({ queryKey: ["snapshot-dates"], refetchType: "active" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="filter-chip flex items-center gap-2 border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
      <span className="text-xs">{loading ? "Generating..." : "Generate Today"}</span>
    </button>
  );
}
