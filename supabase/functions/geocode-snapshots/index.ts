import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Crystal Palace, London — fixed home base
const HOME_LAT = 51.4183;
const HOME_LNG = -0.0739;

/** Haversine distance in km */
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

/** Geocode a location string using OpenStreetMap Nominatim */
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch UK snapshots missing geocoding data
    const { data: rows, error: fetchErr } = await supabase
      .from("snapshots")
      .select("id, location_detail, job_title, region")
      .eq("region", "London, United Kingdom")
      .is("latitude", null)
      .limit(50); // batch to respect Nominatim rate limits

    if (fetchErr) throw fetchErr;
    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, geocoded: 0, message: "No UK snapshots to geocode" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let geocoded = 0;

    for (const row of rows) {
      // Try location_detail first, fall back to job_title + "London"
      const searchTerm =
        row.location_detail ||
        (row.job_title ? `${row.job_title}, London` : "London, UK");

      const coords = await geocode(searchTerm);

      if (coords) {
        const distance = haversineKm(HOME_LAT, HOME_LNG, coords.lat, coords.lng);
        const { error: updateErr } = await supabase
          .from("snapshots")
          .update({
            latitude: coords.lat,
            longitude: coords.lng,
            distance_km: Math.round(distance * 10) / 10,
          })
          .eq("id", row.id);

        if (!updateErr) geocoded++;
      }

      // Respect Nominatim rate limit: 1 req/sec
      await new Promise((r) => setTimeout(r, 1100));
    }

    return new Response(
      JSON.stringify({ success: true, geocoded, total: rows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
