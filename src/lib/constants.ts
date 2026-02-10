export const ROLES = [
  "Business Analyst",
  "Product Analyst",
  "Product Operations",
  "Systems Analyst",
] as const;

export const REGIONS = [
  { name: "Seoul, South Korea", key: "seoul", geoId: "105149562" },
  { name: "London, United Kingdom", key: "london", geoId: "102257491" },
] as const;

export type Role = (typeof ROLES)[number];
export type RegionKey = (typeof REGIONS)[number]["key"];

export function buildLinkedInSearchUrl(role: string, geoId: string): string {
  const keywords = encodeURIComponent(role);
  return `https://www.linkedin.com/jobs/search/?keywords=${keywords}&location=&geoId=${geoId}&f_TPR=r86400`;
}
