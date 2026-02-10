import { ExternalLink, MapPin, Briefcase, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Snapshot } from "@/hooks/useSnapshots";
import { REGIONS } from "@/lib/constants";

interface SnapshotGridProps {
  snapshots: Snapshot[];
  isLoading: boolean;
}

function getRegionKey(regionName: string): string {
  const found = REGIONS.find((r) => r.name === regionName);
  return found?.key ?? "seoul";
}

export function SnapshotGrid({ snapshots, isLoading }: SnapshotGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="snapshot-card animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-3" />
            <div className="h-3 bg-muted rounded w-1/2 mb-2" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="text-center py-16">
        <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No snapshots found</p>
        <p className="text-muted-foreground/60 text-xs mt-1">Try adjusting filters or generate new snapshots</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {snapshots.map((snapshot) => {
        const regionKey = getRegionKey(snapshot.region);
        return (
          <a
            key={snapshot.id}
            href={snapshot.linkedin_search_url}
            target="_blank"
            rel="noopener noreferrer"
            className="snapshot-card group block"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-medium text-foreground">{snapshot.role}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                <span className={regionKey === "seoul" ? "region-seoul" : "region-london"}>
                  {snapshot.region}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                <span className="font-mono">{format(parseISO(snapshot.date), "yyyy-MM-dd")}</span>
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
