import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ROLES = [
  "Business Analyst",
  "Product Analyst",
  "Product Operations",
  "Systems Analyst",
  "Analyst OR Operations",
];

const REGIONS = [
  { name: "Seoul, South Korea", geoId: "105149562", indeedDomain: "kr.indeed.com", indeedLocation: "Seoul", glassdoorLocId: "3080052" },
  { name: "London, United Kingdom", geoId: "102257491", indeedDomain: "uk.indeed.com", indeedLocation: "London", glassdoorLocId: "2671300" },
  { name: "Singapore", geoId: "102454443", indeedDomain: "sg.indeed.com", indeedLocation: "Singapore", glassdoorLocId: "3235921" },
];

function buildLinkedInSearchUrl(role: string, geoId: string): string {
  const keywords = encodeURIComponent(role);
  return `https://www.linkedin.com/jobs/search/?keywords=${keywords}&location=&geoId=${geoId}&f_TPR=r86400`;
}

function buildIndeedSearchUrl(role: string, domain: string, location: string): string {
  const keywords = encodeURIComponent(role);
  return `https://${domain}/jobs?q=${keywords}&l=${encodeURIComponent(location)}&fromage=1`;
}

function buildGlassdoorSearchUrl(role: string, locId: string): string {
  const keywords = encodeURIComponent(role);
  return `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${keywords}&locId=${locId}&locT=C&fromAge=1`;
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
