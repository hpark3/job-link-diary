import { ExternalLink, MapPin, Briefcase, Calendar, Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Snapshot } from "@/hooks/useSnapshots";
import { REGIONS, PLATFORMS, ROLE_DESCRIPTIONS, REGION_DESCRIPTIONS } from "@/lib/constants";
import type { CandidateProfile } from "@/hooks/useProfile";
import { computeMatch } from "@/lib/matchScore";
import { MatchBadge } from "@/components/MatchBadge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface SnapshotGridProps {
  snapshots: Snapshot[];
  isLoading: boolean;
}

function getRegionKey(regionName: string): string {
  const found = REGIONS.find((r) => r.name === regionName);
  return found?.key ?? "seoul";
}

function regionColorClass(key: string): string {
  const map: Record<string, string> = { seoul: "region-seoul", london: "region-london", singapore: "region-singapore" };
  return map[key] ?? "region-seoul";
}

function getPlatformIcon(platformName: string): string {
  const found = PLATFORMS.find((p) => p.name === platformName);
  return found?.icon ?? "🔗";
}

export function SnapshotGrid({ snapshots, isLoading }: SnapshotGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {snapshots.map((snapshot) => {
        const regionKey = getRegionKey(snapshot.region);
        const roleDesc = ROLE_DESCRIPTIONS[snapshot.role] ?? "";
        const regionDesc = REGION_DESCRIPTIONS[snapshot.region] ?? "";
        const platformIcon = getPlatformIcon(snapshot.platform);

        return (
          <HoverCard key={snapshot.id} openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <a
                href={snapshot.linkedin_search_url}
                target="_blank"
                rel="noopener noreferrer"
                className="snapshot-card group block"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{platformIcon}</span>
                    <span className="text-xs font-medium text-primary">{snapshot.platform}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-3.5 h-3.5 text-accent" />
                  <span className="text-sm font-medium text-foreground">{snapshot.role}</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    <span className={regionColorClass(regionKey)}>
                      {snapshot.region}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{format(parseISO(snapshot.date), "yyyy-MM-dd")}</span>
                  </span>
                </div>
              </a>
            </HoverCardTrigger>

            <HoverCardContent className="w-80 p-4" side="top" align="start">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-accent mb-1">{snapshot.role}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{roleDesc}</p>
                </div>
                <div className="border-t border-border pt-2">
                  <h4 className="text-xs font-semibold mb-1">
                    <span className={regionColorClass(regionKey)}>●</span>{" "}
                    {snapshot.region}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{regionDesc}</p>
                </div>
                <div className="border-t border-border pt-2 text-xs text-muted-foreground/70">
                  {platformIcon} Click to open <strong>{snapshot.platform}</strong> search for <strong>{snapshot.role}</strong> posted in the last 24 hours
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );
}
