import { ROLES, REGIONS, RECENCY_OPTIONS, PLATFORMS, type RecencyValue } from "@/lib/constants";
import { Clock } from "lucide-react";

interface FilterBarProps {
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
    <div className="space-y-4">
      {/* Recency */}
      <div>
        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          Recency
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

      {/* Platform */}
      <div>
        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Platform</label>
        <div className="flex flex-wrap gap-2">
          <button
            className={`filter-chip ${!selectedPlatform ? "active" : ""}`}
            onClick={() => onPlatformChange(null)}
          >
            All
          </button>
          {PLATFORMS.map((platform) => (
            <button
              key={platform.key}
              className={`filter-chip ${selectedPlatform === platform.name ? "active" : ""}`}
              onClick={() => onPlatformChange(selectedPlatform === platform.name ? null : platform.name)}
            >
              {platform.icon} {platform.name}
            </button>
          ))}
        </div>
      </div>

      {/* Role */}
      <div>
        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Role</label>
        <div className="flex flex-wrap gap-2">
          <button
            className={`filter-chip ${!selectedRole ? "active" : ""}`}
            onClick={() => onRoleChange(null)}
          >
            All
          </button>
          {ROLES.map((role) => (
            <button
              key={role}
              className={`filter-chip ${selectedRole === role ? "active" : ""}`}
              onClick={() => onRoleChange(selectedRole === role ? null : role)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Region */}
      <div>
        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Region</label>
        <div className="flex flex-wrap gap-2">
          <button
            className={`filter-chip ${!selectedRegion ? "active" : ""}`}
            onClick={() => onRegionChange(null)}
          >
            All
          </button>
          {REGIONS.map((region) => (
            <button
              key={region.key}
              className={`filter-chip ${selectedRegion === region.key ? "active" : ""}`}
              onClick={() => onRegionChange(selectedRegion === region.key ? null : region.key)}
            >
              <span className={`region-${region.key}`}>●</span>{" "}
              {region.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
