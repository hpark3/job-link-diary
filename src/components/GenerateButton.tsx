import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ROLES, REGIONS, buildLinkedInSearchUrl } from "@/lib/constants";
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
        REGIONS.map((region) => ({
          date: today,
          role,
          region: region.name,
          linkedin_search_url: buildLinkedInSearchUrl(role, region.geoId),
        }))
      );

      const { error } = await supabase.from("snapshots").upsert(rows, {
        onConflict: "date,role,region",
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
