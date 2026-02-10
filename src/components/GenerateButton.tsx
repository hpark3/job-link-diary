import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ROLES, REGIONS, buildLinkedInSearchUrl, buildIndeedSearchUrl } from "@/lib/constants";
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

      const rows = ROLES.flatMap((role) =>
        REGIONS.flatMap((region) => [
          {
            date: today,
            role,
            region: region.name,
            platform: "LinkedIn",
            linkedin_search_url: buildLinkedInSearchUrl(role, region.geoId),
          },
          {
            date: today,
            role,
            region: region.name,
            platform: "Indeed",
            linkedin_search_url: buildIndeedSearchUrl(role, region.indeedDomain, region.indeedLocation),
          },
          {
            date: today,
            role,
            region: region.name,
            platform: "Glassdoor",
            linkedin_search_url: buildGlassdoorSearchUrl(role, region.glassdoorLocId),
          },
        ])
      );

      const { error } = await supabase.from("snapshots").upsert(rows, {
        onConflict: "date,role,region,platform",
      });

      if (error) throw error;

      toast({ title: "Snapshots generated", description: `${rows.length} snapshots for ${today}` });
      queryClient.invalidateQueries({ queryKey: ["snapshots"] });
      queryClient.invalidateQueries({ queryKey: ["snapshot-dates"] });
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
