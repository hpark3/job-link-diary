/** Crystal Palace, London — fixed home base */
export const HOME_LAT = 51.4183;
export const HOME_LNG = -0.0739;

export const DISTANCE_BANDS = [
  { label: "0–5 km", min: 0, max: 5, color: "hsl(145,60%,42%)" },
  { label: "5–15 km", min: 5, max: 15, color: "hsl(200,70%,50%)" },
  { label: "15–30 km", min: 15, max: 30, color: "hsl(45,85%,55%)" },
  { label: "30+ km", min: 30, max: Infinity, color: "hsl(8,78%,62%)" },
] as const;

export function getDistanceBand(km: number): (typeof DISTANCE_BANDS)[number] {
  return DISTANCE_BANDS.find((b) => km >= b.min && km < b.max) ?? DISTANCE_BANDS[3];
}

/** Distance-based UK region classification */
export const UK_DISTANCE_REGIONS = [
  { label: "London – Inner", maxKm: 10 },
  { label: "London – Outer", maxKm: 20 },
  { label: "London – Commuter Belt", maxKm: 35 },
  { label: "UK – Remote / Hybrid", maxKm: Infinity },
] as const;

export type UKDistanceRegion = (typeof UK_DISTANCE_REGIONS)[number]["label"];

/** Classify a UK snapshot into a distance-based region */
export function classifyUKRegion(distanceKm: number | null | undefined): UKDistanceRegion {
  if (distanceKm == null) return "UK – Remote / Hybrid";
  for (const band of UK_DISTANCE_REGIONS) {
    if (distanceKm <= band.maxKm) return band.label;
  }
  return "UK – Remote / Hybrid";
}

/** Get distance band label for CSV export */
export function getDistanceBandLabel(km: number | null | undefined): string {
  if (km == null) return "";
  return getDistanceBand(km).label;
}
