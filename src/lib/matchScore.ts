import type { CandidateProfile } from "@/hooks/useProfile";
import type { Snapshot } from "@/hooks/useSnapshots";
import { REGIONS } from "@/lib/constants";

export interface MatchResult {
  score: number;
  level: "high" | "medium" | "low";
  reasons: string[];
}

/** Pure rule-based scoring using snapshot metadata only. */
export function computeMatch(
  snapshot: Snapshot,
  profile: CandidateProfile
): MatchResult {
  const reasons: string[] = [];
  let score = 0;

  // --- Role match (0–40) ---
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
      score += 40;
      reasons.push(`Exact role match: ${snapshot.role}`);
    } else if (partial) {
      score += 25;
      reasons.push(`Partial role match: ${snapshot.role}`);
    } else {
      reasons.push("Role doesn't match your targets");
    }
  } else {
    score += 20; // no preference = neutral
  }

  // --- Region match (0–25) ---
  if (profile.preferredRegions.length > 0) {
    const regionKey =
      REGIONS.find((r) => r.name === snapshot.region)?.key ?? "";
    if (profile.preferredRegions.includes(regionKey)) {
      score += 25;
      reasons.push(`Preferred region: ${snapshot.region}`);
    } else {
      reasons.push(`Region ${snapshot.region} is not in your preferences`);
    }
  } else {
    score += 12;
  }

  // --- Domain / skill keyword match (0–20) ---
  if (profile.skills.length > 0 || profile.domains.length > 0) {
    const keywords = [...profile.skills, ...profile.domains].map((k) =>
      k.toLowerCase()
    );
    const roleWords = snapshot.role.toLowerCase();
    const hits = keywords.filter(
      (kw) => roleWords.includes(kw) || kw.includes(roleWords.split(" ")[0])
    );
    const keyScore = Math.min(20, (hits.length / Math.max(keywords.length, 1)) * 20);
    score += Math.round(keyScore);
    if (hits.length > 0) {
      reasons.push(`Skill/domain overlap: ${hits.join(", ")}`);
    }
  } else {
    score += 10;
  }

  // --- Experience / seniority alignment (0–15) ---
  const roleLower = snapshot.role.toLowerCase();
  const seniorityHints: Record<string, string[]> = {
    junior: ["junior", "associate", "entry", "intern"],
    mid: ["analyst", "specialist", "coordinator"],
    senior: ["senior", "lead", "principal", "staff"],
    lead: ["lead", "head", "director", "manager", "vp"],
  };
  const myHints = seniorityHints[profile.experienceLevel] ?? [];
  if (myHints.some((h) => roleLower.includes(h))) {
    score += 15;
    reasons.push(`Seniority aligns with ${profile.experienceLevel} level`);
  } else {
    score += 5;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  const level: MatchResult["level"] =
    score >= 70 ? "high" : score >= 40 ? "medium" : "low";

  return { score, level, reasons };
}
