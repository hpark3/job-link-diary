import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, MapPin, Briefcase, Calendar, Info, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Snapshot } from "@/hooks/useSnapshots";
import { PLATFORMS, ROLE_DESCRIPTIONS, REGION_DESCRIPTIONS } from "@/lib/constants";
import type { CandidateProfile } from "@/hooks/useProfile";
import { computeMatch } from "@/lib/matchScore";
import { MatchBadge } from "@/components/MatchBadge";
import { classifyUKRegion } from "@/lib/geo";
import { cn } from "@/lib/utils";
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
  onPrevPage?: () => void;
  onNextPage?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
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

export function SnapshotGrid({
  snapshots,
  isLoading,
  profile,
  isProfileConfigured,
  onPrevPage,
  onNextPage,
  hasPrev,
  hasNext
}: SnapshotGridProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance && onNextPage && hasNext) onNextPage();
    if (distance < -minSwipeDistance && onPrevPage && hasPrev) onPrevPage();
  };

  // ✅ 테두리와 배경을 완전히 제거한 투명 스타일
  const arrowBtnBase = "absolute top-1/2 -translate-y-1/2 z-20 w-16 h-40 flex items-center justify-center text-[#5F74DD] transition-all duration-300 active:scale-90 group hidden md:flex cursor-pointer bg-transparent border-none outline-none shadow-none";

  if (isLoading) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="h-40 bg-slate-100 rounded-2xl" />
      ))}
    </div>
  );

  if (snapshots.length === 0) return (
    <div className="text-center py-16 text-muted-foreground bg-white rounded-3xl border border-dashed border-slate-200">
      No snapshots found
    </div>
  );

  return (
    <div
      className="relative px-2 group/grid-container"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ◀️ 왼쪽 화살표: 테두리 없는 투명 스타일 */}
      {hasPrev && onPrevPage && (
        <button
          onClick={(e) => { e.preventDefault(); onPrevPage(); }}
          className={cn(arrowBtnBase, "-left-10 lg:-left-20 opacity-20 hover:opacity-100")}
        >
          <ChevronLeft strokeWidth={2.5} className="w-16 h-16 group-hover:-translate-x-1 transition-transform" />
        </button>
      )}

      {/* 🃏 카드 그리드 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {snapshots.map((snapshot) => {
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
                    <div className="flex items-start gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                      <span className="truncate">{snapshot.location_detail || "UK"}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getRegionBadgeClass(currentRegionLabel)}`}>
                        {currentRegionLabel}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {snapshot.date ? format(parseISO(snapshot.date), "MM-dd") : ""}
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

      {/* ▶️ 오른쪽 화살표: 테두리 없는 투명 스타일 */}
      {hasNext && onNextPage && (
        <button
          onClick={(e) => { e.preventDefault(); onNextPage(); }}
          className={cn(arrowBtnBase, "-right-10 lg:-right-20 opacity-20 hover:opacity-100")}
        >
          <ChevronRight strokeWidth={2.5} className="w-16 h-16 group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
}