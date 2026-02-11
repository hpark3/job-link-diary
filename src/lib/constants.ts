/** Canonical role categories – the ONLY roles stored/displayed */
export const CANONICAL_ROLES = [
  "Business Analyst",
  "Business Operations",
  "Product Analyst",
  "IT Operations",
  "Business Process Analyst",
  "System Analyst",
  "Others",
] as const;

export type CanonicalRole = (typeof CANONICAL_ROLES)[number];

/**
 * Search queries used to generate snapshots on job platforms.
 * Each query is mapped to a canonical role after results are stored.
 */
export const SEARCH_QUERIES = [
  "Business Analyst",
  "Product Analyst",
  "Product Operations",
  "Systems Analyst",
  "Business Operations",
  "IT Operations",
  "Business Process Analyst",
] as const;

/** Map a search query (or raw job title) to a canonical role */
export function normalizeRole(raw: string): CanonicalRole {
  const t = raw.toLowerCase();

  if (t.includes("business process")) return "Business Process Analyst";
  if (t.includes("system") && t.includes("analyst")) return "System Analyst";
  if (t.includes("systems") && t.includes("analyst")) return "System Analyst";
  if (t.includes("it") && t.includes("operat")) return "IT Operations";
  if (t.includes("product") && t.includes("operat")) return "Business Operations";
  if (t.includes("business") && t.includes("operat")) return "Business Operations";
  if (t.includes("product") && t.includes("analyst")) return "Product Analyst";
  if (t.includes("business") && t.includes("analyst")) return "Business Analyst";

  // Broad fallbacks
  if (t.includes("analyst")) return "Others";
  if (t.includes("operat")) return "Others";

  return "Others";
}

/** Keep backward compat – ROLES alias used by FilterBar */
export const ROLES = CANONICAL_ROLES;
export type Role = CanonicalRole;

export const REGIONS = [
  { name: "Seoul, South Korea", key: "seoul", geoId: "105149562", indeedDomain: "kr.indeed.com", indeedLocation: "Seoul", glassdoorLocId: "3080052" },
  { name: "London, United Kingdom", key: "london", geoId: "102257491", indeedDomain: "uk.indeed.com", indeedLocation: "London", glassdoorLocId: "2671300" },
  { name: "Singapore", key: "singapore", geoId: "102454443", indeedDomain: "sg.indeed.com", indeedLocation: "Singapore", glassdoorLocId: "3235921" },
] as const;

/** Extended regions including distance-based UK classification */
export const DISPLAY_REGIONS = [
  { name: "Seoul, South Korea", key: "seoul" },
  { name: "London, United Kingdom", key: "london" },
  { name: "London – Inner", key: "london-inner" },
  { name: "London – Outer", key: "london-outer" },
  { name: "London – Commuter Belt", key: "london-commuter" },
  { name: "UK – Remote / Hybrid", key: "uk-remote" },
  { name: "Singapore", key: "singapore" },
] as const;

export type RegionKey = (typeof REGIONS)[number]["key"];

export const PLATFORMS = [
  { name: "LinkedIn", key: "linkedin", icon: "🔗" },
  { name: "Indeed", key: "indeed", icon: "🟦" },
] as const;

export type PlatformKey = (typeof PLATFORMS)[number]["key"];

export const RECENCY_OPTIONS = [
  { label: "All Time", value: "all", days: null },
  { label: "Past 24h", value: "1d", days: 1 },
  { label: "Past 7 days", value: "7d", days: 7 },
  { label: "Past 30 days", value: "30d", days: 30 },
] as const;

export type RecencyValue = (typeof RECENCY_OPTIONS)[number]["value"];

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  "Business Analyst":
    "Focuses on bridging business needs and technology solutions. Key skills include requirements gathering, process mapping, data analysis, and stakeholder management.",
  "Business Operations":
    "Ensures efficient day-to-day business processes. Covers workflow optimization, cross-functional coordination, and operational strategy.",
  "Product Analyst":
    "Drives data-informed product decisions. Involves A/B testing, funnel analysis, user behavior tracking, and KPI reporting to optimize product performance.",
  "IT Operations":
    "Manages and maintains IT infrastructure and services. Covers monitoring, incident management, automation, and system reliability.",
  "Business Process Analyst":
    "Analyzes and improves business processes through documentation, gap analysis, and workflow redesign to increase efficiency.",
  "System Analyst":
    "Designs and improves IT systems to meet business requirements. Involves system architecture, integration planning, technical documentation, and process optimization.",
  "Others":
    "Roles that don't fit neatly into the defined categories, including general analyst, data analyst, operations manager, and other mixed titles.",
};

/** Predefined skill keywords for lightweight signal extraction */
export const SIGNAL_KEYWORDS = [
  "SQL", "Python", "Excel", "Tableau", "Power BI", "CRM", "UAT",
  "Analytics", "Agile", "Scrum", "JIRA", "Confluence", "SAP",
  "Salesforce", "Data", "KPI", "Dashboard", "Automation", "API",
  "ETL", "A/B Testing", "Stakeholder", "Requirements", "Process",
  "Strategy", "Reporting", "Forecasting", "Machine Learning", "AI",
] as const;

/** Seniority keywords grouped by level */
export const SENIORITY_KEYWORDS: Record<string, string[]> = {
  junior: ["junior", "associate", "entry", "intern", "graduate", "trainee"],
  mid: ["analyst", "specialist", "coordinator", "consultant"],
  senior: ["senior", "lead", "principal", "staff", "head"],
  executive: ["director", "manager", "vp", "chief", "executive"],
};

export function extractSignals(role: string, previewSnippet?: string): {
  keyword_hits: string[];
  keyword_score: number;
  seniority_hint: boolean;
} {
  const text = `${role} ${previewSnippet ?? ""}`.toLowerCase();
  const keyword_hits = SIGNAL_KEYWORDS.filter((kw) =>
    text.includes(kw.toLowerCase())
  );
  const keyword_score = Math.min(
    100,
    Math.round((keyword_hits.length / Math.max(SIGNAL_KEYWORDS.length, 1)) * 100)
  );
  const allSeniorityWords = Object.values(SENIORITY_KEYWORDS).flat();
  const seniority_hint = allSeniorityWords.some((w) =>
    role.toLowerCase().includes(w)
  );
  return { keyword_hits, keyword_score, seniority_hint };
}

export const REGION_DESCRIPTIONS: Record<string, string> = {
  "Seoul, South Korea":
    "Major tech hub in Asia. Growing demand in fintech, e-commerce, and enterprise SaaS. Korean language proficiency often preferred.",
  "London, United Kingdom":
    "Europe's largest financial and tech center. Strong demand across banking, consulting, and scale-ups. Global talent market.",
  "Singapore":
    "Asia-Pacific financial hub with strong demand in banking, fintech, and tech. English-speaking, multicultural work environment with competitive compensation.",
};

export function buildLinkedInSearchUrl(role: string, geoId: string): string {
  const keywords = encodeURIComponent(role);
  return `https://www.linkedin.com/jobs/search/?keywords=${keywords}&location=&geoId=${geoId}&f_TPR=r86400`;
}

export function buildIndeedSearchUrl(role: string, domain: string, location: string): string {
  const keywords = encodeURIComponent(role);
  return `https://${domain}/jobs?q=${keywords}&l=${encodeURIComponent(location)}&fromage=1`;
}

