import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, MapPin, Briefcase, Calendar, Info, ChevronDown, ChevronUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Snapshot } from "@/hooks/useSnapshots";
import { PLATFORMS, ROLE_DESCRIPTIONS, REGION_DESCRIPTIONS } from "@/lib/constants";
import type { CandidateProfile } from "@/hooks/useProfile";
import { computeMatch } from "@/lib/matchScore";
import { MatchBadge } from "@/components/MatchBadge";
import { classifyUKRegion } from "@/lib/geo"; // 분류 함수 임포트
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface SnapshotGridProps {
  snapshots: Snapshot[];
  isLoading: boolean;
  profile?: CandidateProfile;
  isProfileConfigured?: boolean;
}

function getRegionBadgeClass(label: string): string {
  const l = (label || "").toLowerCase();
  if (l.includes("inner")) return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (l.includes("outer")) return "bg-blue-50 text-blue-700 border-blue-100";
  if (l.includes("manchester") || l.includes("regional")) return "bg-orange-50 text-orange-700 border-orange-100";
  if (l.includes("commuter")) return "bg-purple-50 text-purple-700 border-purple-100";
  if (l.includes("remote")) return "bg-indigo-50 text-indigo-700 border-indigo-100";
  return "bg-gray-50 text-gray-600 border-gray-100";
}

export function SnapshotGrid({ snapshots, isLoading, profile, isProfileConfigured }: SnapshotGridProps) {
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => { setVisibleCount(12); }, [snapshots]);

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-pulse">...</div>;
  if (snapshots.length === 0) return <div className="text-center py-16 text-muted-foreground">No snapshots found</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {snapshots.slice(0, visibleCount).map((snapshot) => {
        // [중요] DB의 원본 region이 아닌, 함수로 계산된 최신 라벨을 가져옴
        const currentRegionLabel = classifyUKRegion(snapshot.distance_km, snapshot.location_detail);
        const match = isProfileConfigured && profile ? computeMatch(snapshot, profile) : null;

        return (
          <HoverCard key={snapshot.id}>
            <HoverCardTrigger asChild>
              <Link to={`/job/${snapshot.id}`} className="snapshot-card group block animate-fade-in relative">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-medium text-primary">{snapshot.platform}</span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-3.5 h-3.5 text-accent" />
                  <span className="text-sm font-medium truncate">{snapshot.job_title || snapshot.role}</span>
                </div>

                <div className="flex flex-col gap-2 mb-3">
                  {/* 실제 상세 주소 (예: Rusholme, Manchester) */}
                  <div className="flex items-start gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                    <span className="truncate">{snapshot.location_detail || "UK"}</span>
                  </div>
                  
                  {/* [해결] 이제 분류 라벨이 Manchester일 때만 Manchester 배지가 붙음 */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getRegionBadgeClass(currentRegionLabel)}`}>
                      {currentRegionLabel}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(parseISO(snapshot.date), "MM-dd")}
                    </span>
                  </div>
                </div>
                {match && <MatchBadge match={match} />}
              </Link>
            </HoverCardTrigger>
          </HoverCard>
        );
      })}
    </div>
  );
}