import { ROLES, REGIONS } from "@/lib/constants";

interface FilterBarProps {
  selectedRole: string | null;
  selectedRegion: string | null;
  onRoleChange: (role: string | null) => void;
  onRegionChange: (region: string | null) => void;
}

export function FilterBar({ selectedRole, selectedRegion, onRoleChange, onRegionChange }: FilterBarProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 block">Role</label>
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
      <div>
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 block">Region</label>
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
              <span className={region.key === "seoul" ? "region-seoul" : "region-london"}>●</span>{" "}
              {region.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
