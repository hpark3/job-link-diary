import { RECENCY_OPTIONS, type RecencyValue } from "@/lib/constants";
import { Clock, Briefcase, Globe, Layout } from "lucide-react";

interface FilterBarProps {
  roles: string[];
  regions: string[];
  platforms: string[];
  selectedRole: string | null;
  selectedRegion: string | null;
  selectedRecency: RecencyValue;
  selectedPlatform: string | null;
  onRoleChange: (role: string | null) => void;
  onRegionChange: (region: string | null) => void;
  onRecencyChange: (recency: RecencyValue) => void;
  onPlatformChange: (platform: string | null) => void;
}

export function FilterBar({
  roles,
  regions,
  platforms,
  selectedRole,
  selectedRegion,
  selectedRecency,
  selectedPlatform,
  onRoleChange,
  onRegionChange,
  onRecencyChange,
  onPlatformChange,
}: FilterBarProps) {
  return (
    <div className="space-y-6 py-2">
      {/* 1. RECENCY - 러버블 스타일 아이콘 + 칩 */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" /> RECENCY
        </label>
        <div className="flex flex-wrap gap-2">
          {RECENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`filter-chip ${selectedRecency === opt.value ? "active" : ""}`}
              onClick={() => onRecencyChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. PLATFORM - Adzuna 등이 동적으로 표시됨 */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Layout className="w-3.5 h-3.5" /> PLATFORM
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            className={`filter-chip ${!selectedPlatform ? "active" : ""}`}
            onClick={() => onPlatformChange(null)}
          >
            All
          </button>
          {platforms.map((p) => (
            <button
              key={p}
              className={`filter-chip ${selectedPlatform === p ? "active" : ""}`}
              onClick={() => onPlatformChange(selectedPlatform === p ? null : p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 3. ROLE - Analyst, Operations 등이 동적으로 표시됨 */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Briefcase className="w-3.5 h-3.5" /> ROLE
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            className={`filter-chip ${!selectedRole ? "active" : ""}`}
            onClick={() => onRoleChange(null)}
          >
            All
          </button>
          {roles.map((r) => (
            <button
              key={r}
              className={`filter-chip ${selectedRole === r ? "active" : ""}`}
              onClick={() => onRoleChange(selectedRole === r ? null : r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 4. REGION - London, Manchester 등이 동적으로 표시됨 */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Globe className="w-3.5 h-3.5" /> REGION
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            className={`filter-chip ${!selectedRegion ? "active" : ""}`}
            onClick={() => onRegionChange(null)}
          >
            All
          </button>
          {regions.map((reg) => (
            <button
              key={reg}
              className={`filter-chip ${selectedRegion === reg ? "active" : ""}`}
              onClick={() => onRegionChange(selectedRegion === reg ? null : reg)}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}