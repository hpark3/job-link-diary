import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Crystal Palace, London — fixed home base
const HOME_LAT = 51.4183;
const HOME_LNG = -0.0739;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocode(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1&countrycodes=gb`;
    const res = await fetch(url, {
      headers: { "User-Agent": "JobRadar/1.0 (personal-project)" },
    });
    if (!res.ok) return null;
    const results = await res.json();
    if (results.length === 0) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch {
    return null;
  }
}

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
  latitude?: number;
  longitude?: number;
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

    const rows = [];

    for (const j of jobs) {
      let latitude = j.latitude ?? null;
      let longitude = j.longitude ?? null;
      let distance_km: number | null = null;

      // Auto-geocode UK jobs with location_detail
      if (
        !latitude &&
        j.region?.includes("United Kingdom") &&
        j.location_detail
      ) {
        const coords = await geocode(j.location_detail);
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lng;
        }
        // Nominatim rate limit
        await new Promise((r) => setTimeout(r, 1100));
      }

      if (latitude != null && longitude != null) {
        distance_km = Math.round(haversineKm(HOME_LAT, HOME_LNG, latitude, longitude) * 10) / 10;
      }

      rows.push({
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
        latitude,
        longitude,
        distance_km,
      });
    }

    // index.ts 하단부 수정
    const { error } = await supabase.from("snapshots").upsert(rows, {
      // 기준을 '날짜, 직무명, 회사명, 플랫폼'으로 조합하는 것이 더 정확합니다.
      onConflict: "date,job_title,company_name,platform",
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
