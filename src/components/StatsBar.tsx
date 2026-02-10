import type { Snapshot } from "@/hooks/useSnapshots";

interface StatsBarProps {
  snapshots: Snapshot[];
  allDates: string[];
}

export function StatsBar({ snapshots, allDates }: StatsBarProps) {
  const uniqueRoles = new Set(snapshots.map((s) => s.role)).size;
  const uniqueRegions = new Set(snapshots.map((s) => s.region)).size;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Days Tracked</div>
        <div className="stat-value">{allDates.length}</div>
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Roles</div>
        <div className="stat-value">{uniqueRoles}</div>
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Regions</div>
        <div className="stat-value">{uniqueRegions}</div>
      </div>
    </div>
  );
}
