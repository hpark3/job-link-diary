
/** Crystal Palace, London — fixed home base */
export const HOME_LAT = 51.4183;
export const HOME_LNG = -0.0739;

import { supabase } from "@/integrations/supabase/client"; // supabase 클라이언트가 정의된 파일

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
// src/lib/geo.ts

/**
 * 하이브리드 지역 분류기
 * 1단계: 텍스트 휴리스틱 (즉각 응답)
 * 2단계: ONS/Postcode 데이터를 통한 표준 지역 분류
 */
export function classifyUKRegion(distanceKm: number | null | undefined, locationDetail?: string | null): string {
  if (!locationDetail) return "UK – Remote / Hybrid";
  const detail = locationDetail.toLowerCase().trim();

  // [변경] 리모트/하이브리드 키워드를 최상단으로 올립니다.
  if (detail.includes("remote")) return "UK – Remote";
  if (detail.includes("hybrid")) return "UK – Hybrid";

  // [Level 1] 텍스트 우선 순위 (ONS 표준 권역 기반)
  
  // 1. Greater Manchester (North West England)
  if (detail.includes("manchester") || detail.includes("salford") || detail.includes("trafford") || detail.includes("bolton") || detail.includes("bury")) {
    return "Greater Manchester";
  }

  // 2. London - Inner (ONS 표준: Westminster, City, Camden 등)
  const innerLondon = ["westminster", "the city", "central london", "islington", "camden", "hackney", "southwark", "lambeth"];
  if (innerLondon.some(kw => detail.includes(kw))) return "London – Inner";

  // 3. London - Outer (ONS 표준: Croydon, Sutton, Kingston, New Malden 등)
  const outerLondon = ["croydon", "sutton", "kingston", "new malden", "morden", "bromley", "merton", "mitcham", "richmond"];
  if (outerLondon.some(kw => detail.includes(kw))) return "London – Outer";

  // 4. London - Commuter Belt (Home Counties)
  const commuterBelt = ["surrey", "kent", "essex", "hertfordshire", "berkshire", "slough", "reading"];
  if (commuterBelt.some(kw => detail.includes(kw))) return "London – Commuter Belt";

  // [Level 2] 거리 기반 보정 (Home Base: Crystal Palace 기준)
  if (distanceKm != null && distanceKm > 0) {
    if (distanceKm <= 12) return "London – Inner";
    if (distanceKm <= 25) return "London – Outer";
    if (distanceKm <= 45) return "London – Commuter Belt";
  }

  // [Level 3] API 백업 및 기타
  if (detail.includes("london")) return "London – Outer";
  if (detail.includes("remote")) return "UK – Remote";
  if (detail.includes("hybrid")) return "UK – Hybrid";

  return "UK – Regional";
}

/** * [백업 API] 실시간으로 더 정밀한 지역 정보가 필요할 때 사용 (비동기)
 * Postcodes.io를 통해 ONS 표준 지역(Region/Admin District)을 가져옵니다.
 */
export async function getONSStandardRegion(postcodeOrArea: string) {
  try {
    const res = await fetch(`https://api.postcodes.io/outcodes/${postcodeOrArea}`);
    const data = await res.json();
    if (data.status === 200 && data.result) {
      // ONS 표준 권역(Region) 반환 (예: London, North West, South East 등)
      return data.result.admin_district?.[0] || data.result.region;
    }
  } catch (e) {
    return null;
  }
}

/** Get distance band label for CSV export */
export function getDistanceBandLabel(km: number | null | undefined): string {
  if (km == null) return "";
  return getDistanceBand(km).label;
}

// src/lib/geo.ts 파일 맨 아래에 추가
/** 2. 추가하신 fetchAvailableRegions 함수 */
export async function fetchAvailableRegions() {
  const { data, error } = await supabase
    .from('snapshots')
    .select('region')
    .not('region', 'is', null)
    .order('region', { ascending: true });

  if (error) {
    console.error("Error fetching regions:", error);
    return [];
  }

  // 중복 제거 및 데이터 포맷팅
  const uniqueNames = Array.from(new Set(data.map((item: any) => item.region)));

  return uniqueNames.map((name: any) => ({
    key: name.toLowerCase().replace(/\s+/g, '_'),
    name: name
  }));
}