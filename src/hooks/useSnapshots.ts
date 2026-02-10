import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";

export interface Snapshot {
  id: string;
  date: string;
  role: string;
  region: string;
  platform: string;
  linkedin_search_url: string;
  created_at: string;
}

export function useSnapshots(filters?: {
  date?: string;
  role?: string;
  region?: string;
  platform?: string;
  recencyDays?: number | null;
}) {
  return useQuery({
    queryKey: ["snapshots", filters],
    queryFn: async () => {
      let query = supabase
        .from("snapshots")
        .select("*")
        .order("date", { ascending: false });

      if (filters?.date) {
        query = query.eq("date", filters.date);
      } else if (filters?.recencyDays) {
        const since = format(subDays(new Date(), filters.recencyDays), "yyyy-MM-dd");
        query = query.gte("date", since);
      }
      if (filters?.role) {
        query = query.eq("role", filters.role);
      }
      if (filters?.region) {
        query = query.eq("region", filters.region);
      }
      if (filters?.platform) {
        query = query.eq("platform", filters.platform);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Snapshot[];
    },
  });
}

export function useAvailableDates() {
  return useQuery({
    queryKey: ["snapshot-dates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("snapshots")
        .select("date")
        .order("date", { ascending: false });

      if (error) throw error;
      const unique = [...new Set(data.map((d) => d.date))];
      return unique;
    },
  });
}
