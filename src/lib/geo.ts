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
