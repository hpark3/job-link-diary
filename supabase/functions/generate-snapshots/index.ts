import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ROLES = [
  "Business Analyst",
  "Product Analyst",
  "Product Operations",
  "Systems Analyst",
];

const REGIONS = [
  { name: "Seoul, South Korea", geoId: "105149562" },
  { name: "London, United Kingdom", geoId: "102257491" },
];

function buildLinkedInSearchUrl(role: string, geoId: string): string {
  const keywords = encodeURIComponent(role);
  return `https://www.linkedin.com/jobs/search/?keywords=${keywords}&location=&geoId=${geoId}&f_TPR=r86400`;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    return new Response(
      JSON.stringify({ success: true, count: rows.length, date: today }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
