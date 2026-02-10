import type { CandidateProfile } from "@/hooks/useProfile";
import type { Snapshot } from "@/hooks/useSnapshots";
import { REGIONS, SENIORITY_KEYWORDS } from "@/lib/constants";

export interface MatchResult {
  score: number;
  level: "high" | "medium" | "low";
  reasons: string[];
}

/** Rule-based scoring using snapshot metadata + job signals. */
export function computeMatch(
  snapshot: Snapshot,
  profile: CandidateProfile
): MatchResult {
  const reasons: string[] = [];
  let score = 0;

  // --- Role match (0–35) ---
  if (profile.targetRoles.length > 0) {
    const exact = profile.targetRoles.some(
      (r) => r.toLowerCase() === snapshot.role.toLowerCase()
    );
    const partial = profile.targetRoles.some(
      (r) =>
        snapshot.role.toLowerCase().includes(r.toLowerCase()) ||
        r.toLowerCase().includes(snapshot.role.toLowerCase())
    );
    if (exact) {
      score += 35;
      reasons.push(`Exact role match: ${snapshot.role}`);
    } else if (partial) {
      score += 20;
      reasons.push(`Partial role match: ${snapshot.role}`);
    } else {
      reasons.push("Role doesn't match your targets");
    }
  } else {
    score += 17;
  }

  // --- Region match (0–20) ---
  if (profile.preferredRegions.length > 0) {
    const regionKey =
      REGIONS.find((r) => r.name === snapshot.region)?.key ?? "";
    if (profile.preferredRegions.includes(regionKey)) {
      score += 20;
      reasons.push(`Preferred region: ${snapshot.region}`);
    } else {
      reasons.push(`Region ${snapshot.region} is not in your preferences`);
    }
  } else {
    score += 10;
  }

  // --- Keyword signal match (0–25) ---
  const profileKeywords = [...profile.skills, ...profile.domains].map((k) => k.toLowerCase());
  if (profileKeywords.length > 0 && snapshot.keyword_hits?.length > 0) {
    const overlap = snapshot.keyword_hits.filter((hit) =>
      profileKeywords.some((pk) => pk.includes(hit.toLowerCase()) || hit.toLowerCase().includes(pk))
    );
    const keyScore = Math.min(25, Math.round((overlap.length / Math.max(profileKeywords.length, 1)) * 25));
    score += keyScore;
    if (overlap.length > 0) {
      reasons.push(`Keyword overlap: ${overlap.join(", ")}`);
    }
  } else if (profileKeywords.length === 0) {
    score += 12;
  }

  // --- Seniority alignment (0–20) ---
  if (snapshot.seniority_hint) {
    const myLevel = profile.experienceLevel;
    const myWords = SENIORITY_KEYWORDS[myLevel] ?? [];
    const roleLower = snapshot.role.toLowerCase();
    if (myWords.some((w) => roleLower.includes(w))) {
      score += 20;
      reasons.push(`Seniority aligns with ${myLevel} level`);
    } else {
      score += 5;
      reasons.push("Seniority detected but doesn't match your level");
    }
  } else {
    score += 8;
  }

  score = Math.max(0, Math.min(100, score));

  const level: MatchResult["level"] =
    score >= 70 ? "high" : score >= 40 ? "medium" : "low";

  return { score, level, reasons };
}
