import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SEARCH_QUERIES = [
  "Business Analyst",
  "Product Analyst",
  "Product Operations",
  "Systems Analyst",
  "Business Operations",
  "IT Operations",
  "Business Process Analyst",
];

function normalizeRole(raw: string): string {
  const t = raw.toLowerCase();
  if (t.includes("business process")) return "Business Process Analyst";
  if (t.includes("system") && t.includes("analyst")) return "System Analyst";
  if (t.includes("systems") && t.includes("analyst")) return "System Analyst";
  if (t.includes("it") && t.includes("operat")) return "IT Operations";
  if (t.includes("product") && t.includes("operat")) return "Business Operations";
  if (t.includes("business") && t.includes("operat")) return "Business Operations";
  if (t.includes("product") && t.includes("analyst")) return "Product Analyst";
  if (t.includes("business") && t.includes("analyst")) return "Business Analyst";
  if (t.includes("analyst")) return "Others";
  if (t.includes("operat")) return "Others";
  return "Others";
}

const REGIONS = [
  { name: "Seoul, South Korea", geoId: "105149562", indeedDomain: "kr.indeed.com", indeedLocation: "Seoul" },
  { name: "London, United Kingdom", geoId: "102257491", indeedDomain: "uk.indeed.com", indeedLocation: "London" },
  { name: "Singapore", geoId: "102454443", indeedDomain: "sg.indeed.com", indeedLocation: "Singapore" },
];

const SIGNAL_KEYWORDS = [
  "SQL", "Python", "Excel", "Tableau", "Power BI", "CRM", "UAT",
  "Analytics", "Agile", "Scrum", "JIRA", "Confluence", "SAP",
  "Salesforce", "Data", "KPI", "Dashboard", "Automation", "API",
  "ETL", "A/B Testing", "Stakeholder", "Requirements", "Process",
  "Strategy", "Reporting", "Forecasting", "Machine Learning", "AI",
];

const SENIORITY_WORDS = [
  "junior", "associate", "entry", "intern", "graduate", "trainee",
  "analyst", "specialist", "coordinator", "consultant",
  "senior", "lead", "principal", "staff", "head",
  "director", "manager", "vp", "chief", "executive",
];

function extractSignals(role: string) {
  const text = role.toLowerCase();
  const keyword_hits = SIGNAL_KEYWORDS.filter((kw) => text.includes(kw.toLowerCase()));
  const keyword_score = Math.min(100, Math.round((keyword_hits.length / SIGNAL_KEYWORDS.length) * 100));
  const seniority_hint = SENIORITY_WORDS.some((w) => text.includes(w));
  return { keyword_hits, keyword_score, seniority_hint };
}

function buildLinkedInSearchUrl(role: string, geoId: string): string {
  const keywords = encodeURIComponent(role);
  return `https://www.linkedin.com/jobs/search/?keywords=${keywords}&location=&geoId=${geoId}&f_TPR=r86400`;
}

function buildIndeedSearchUrl(role: string, domain: string, location: string): string {
  const keywords = encodeURIComponent(role);
  return `https://${domain}/jobs?q=${keywords}&l=${encodeURIComponent(location)}&fromage=1`;
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

    const rows = SEARCH_QUERIES.flatMap((query) => {
      const signals = extractSignals(query);
      const role = normalizeRole(query);
      return REGIONS.flatMap((region) => [
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
      ]);
    });

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
