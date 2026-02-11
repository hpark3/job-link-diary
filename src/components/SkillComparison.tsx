import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { CandidateProfile } from "@/hooks/useProfile";

interface SkillComparisonProps {
  jdSkills: string[];
  profile: CandidateProfile;
}

export function SkillComparison({ jdSkills, profile }: SkillComparisonProps) {
  const mySkills = [...profile.skills, ...profile.domains].map((s) => s.toLowerCase());

  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of jdSkills) {
    const lower = skill.toLowerCase();
    if (mySkills.some((ms) => ms.includes(lower) || lower.includes(ms))) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  const matchRate = jdSkills.length > 0 ? Math.round((matched.length / jdSkills.length) * 100) : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">CV vs JD Skill Comparison</h2>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${matchRate >= 70 ? "text-green-600" : matchRate >= 40 ? "text-amber-500" : "text-destructive"}`}>
            {matchRate}%
          </span>
          <span className="text-xs text-muted-foreground">match</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full mb-5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            matchRate >= 70 ? "bg-green-500" : matchRate >= 40 ? "bg-amber-400" : "bg-destructive"
          }`}
          style={{ width: `${matchRate}%` }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Matched skills */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-foreground">
              Matched ({matched.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {matched.length > 0 ? (
              matched.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">No matching skills found</span>
            )}
          </div>
        </div>

        {/* Missing skills */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <XCircle className="w-4 h-4 text-destructive" />
            <span className="text-xs font-semibold text-foreground">
              Missing ({missing.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {missing.length > 0 ? (
              missing.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-green-600 font-medium">All skills matched! 🎉</span>
            )}
          </div>
        </div>
      </div>

      {missing.length > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Consider highlighting transferable experience or upskilling in:{" "}
            <strong>{missing.slice(0, 3).join(", ")}</strong>
            {missing.length > 3 && ` and ${missing.length - 3} more`}.
          </p>
        </div>
      )}
    </div>
  );
}
