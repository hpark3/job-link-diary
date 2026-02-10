export const ROLES = [
  "Business Analyst",
  "Product Analyst",
  "Product Operations",
  "Systems Analyst",
  "Analyst OR Operations",
] as const;

export const REGIONS = [
  { name: "Seoul, South Korea", key: "seoul", geoId: "105149562", indeedDomain: "kr.indeed.com", indeedLocation: "Seoul", glassdoorLocId: "3080052" },
  { name: "London, United Kingdom", key: "london", geoId: "102257491", indeedDomain: "uk.indeed.com", indeedLocation: "London", glassdoorLocId: "2671300" },
  { name: "Singapore", key: "singapore", geoId: "102454443", indeedDomain: "sg.indeed.com", indeedLocation: "Singapore", glassdoorLocId: "3235921" },
] as const;

export type Role = (typeof ROLES)[number];
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
  "Product Analyst":
    "Drives data-informed product decisions. Involves A/B testing, funnel analysis, user behavior tracking, and KPI reporting to optimize product performance.",
  "Product Operations":
    "Ensures smooth product delivery and cross-functional alignment. Covers workflow automation, tool management, release coordination, and operational efficiency.",
  "Systems Analyst":
    "Designs and improves IT systems to meet business requirements. Involves system architecture, integration planning, technical documentation, and process optimization.",
  "Analyst OR Operations":
    "Broad search capturing all roles containing 'Analyst' or 'Operations'. Covers business, data, product, systems analyst roles as well as operations-focused positions.",
};

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

