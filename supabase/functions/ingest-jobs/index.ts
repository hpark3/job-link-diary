import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IngestJob {
  date: string;
  role: string;
  region: string;
  platform: string;
  linkedin_search_url?: string;
  source_url?: string;
  job_title?: string;
  company_name?: string;
  location_detail?: string;
  salary_range?: string;
  description?: string;
  skills?: string[];
  keyword_hits?: string[];
  keyword_score?: number;
  seniority_hint?: boolean;
  preview_snippet?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const jobs: IngestJob[] = Array.isArray(body) ? body : body.jobs ?? [body];

    if (jobs.length === 0) {
      return new Response(
        JSON.stringify({ error: "No jobs provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    for (const job of jobs) {
      if (!job.date || !job.role || !job.region || !job.platform) {
        return new Response(
          JSON.stringify({ error: "Each job must have date, role, region, platform" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const rows = jobs.map((j) => ({
      date: j.date,
      role: j.role,
      region: j.region,
      platform: j.platform,
      linkedin_search_url: j.linkedin_search_url ?? j.source_url ?? "",
      source_url: j.source_url ?? null,
      job_title: j.job_title ?? j.role,
      company_name: j.company_name ?? null,
      location_detail: j.location_detail ?? null,
      salary_range: j.salary_range ?? null,
      description: j.description ?? null,
      skills: j.skills ?? [],
      keyword_hits: j.keyword_hits ?? [],
      keyword_score: j.keyword_score ?? 0,
      seniority_hint: j.seniority_hint ?? false,
      preview_snippet: j.preview_snippet ?? (j.description ? j.description.slice(0, 200) : null),
    }));

    const { error } = await supabase.from("snapshots").upsert(rows, {
      onConflict: "date,role,region,platform",
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, ingested: rows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
