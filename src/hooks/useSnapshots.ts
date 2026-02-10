import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Snapshot {
  id: string;
  date: string;
  role: string;
  region: string;
  linkedin_search_url: string;
  created_at: string;
}

export function useSnapshots(filters?: { date?: string; role?: string; region?: string }) {
  return useQuery({
    queryKey: ["snapshots", filters],
    queryFn: async () => {
      let query = supabase
        .from("snapshots")
        .select("*")
        .order("date", { ascending: false });

      if (filters?.date) {
        query = query.eq("date", filters.date);
      }
      if (filters?.role) {
        query = query.eq("role", filters.role);
      }
      if (filters?.region) {
        query = query.eq("region", filters.region);
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
