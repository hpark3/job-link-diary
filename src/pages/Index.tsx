import { useState, useMemo } from "react";
import { ArrowDownWideNarrow, Clock, Target, Ruler, Search, X, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FilterBar } from "@/components/FilterBar";
import { SnapshotGrid } from "@/components/SnapshotGrid";
import { GenerateButton } from "@/components/GenerateButton";
import { ExportCSV } from "@/components/ExportCSV";
import { StatsBar } from "@/components/StatsBar";
import { ProfileEditor } from "@/components/ProfileEditor";
import { BackToTop } from "@/components/BackToTop";
import { useSnapshots, useAvailableDates } from "@/hooks/useSnapshots";
import { useProfile } from "@/hooks/useProfile";
import { computeMatch } from "@/lib/matchScore";
import { RECENCY_OPTIONS, type RecencyValue } from "@/lib/constants";
import { Tables } from "@/integrations/supabase/types";

type Snapshot = Tables<"snapshots"> & {
  category?: string | null;
  captured_at?: string | null;
};

// 정렬 모드에 'distance' 추가
type SortMode = "recent" | "best-match" | "distance";

const Index = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedRecency, setSelectedRecency] = useState<RecencyValue>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const { profile, draft, setDraft, save, isDirty, isConfigured } = useProfile();
  const recencyDays = RECENCY_OPTIONS.find((o) => o.value === selectedRecency)?.days ?? null;

  const { data: rawData = [], isLoading } = useSnapshots({ recencyDays });
  const snapshots = rawData as Snapshot[];
  const { data: dates = [] } = useAvailableDates();

  const lastUpdated = useMemo(() => {
    if (snapshots.length === 0) return null;
    const latest = snapshots.reduce((prev, curr) =>
      (new Date(prev.captured_at || 0) > new Date(curr.captured_at || 0) ? prev : curr)
    );
    return latest.captured_at ? new Date(latest.captured_at).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }) : null;
  }, [snapshots]);

  const dynamicFilters = useMemo(() => {
    const roles = new Set<string>();
    const regions = new Set<string>();
    const platforms = new Set<string>();
    snapshots.forEach((s) => {
      if (s.category) roles.add(s.category);
      if (s.region) regions.add(s.region);
      if (s.platform) platforms.add(s.platform);
    });
    return {
      roles: Array.from(roles).sort(),
      regions: Array.from(regions).sort(),
      platforms: Array.from(platforms).sort(),
    };
  }, [snapshots]);

  const filteredSnapshots = useMemo(() => {
    let result = [...snapshots];
    if (selectedRole) result = result.filter((s) => (s.category ?? "").toLowerCase() === selectedRole.toLowerCase());
    if (selectedPlatform) result = result.filter((s) => s.platform === selectedPlatform);
    if (selectedRegion) result = result.filter((s) => s.region === selectedRegion);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) =>
        (s.job_title ?? "").toLowerCase().includes(q) ||
        (s.company_name ?? "").toLowerCase().includes(q)
      );
    }
    // [복구] 스킬 태그 필터 로직
    if (selectedSkill) {
      result = result.filter((s) =>
        s.skills?.some((sk) => sk.toLowerCase() === selectedSkill.toLowerCase()) ||
        s.keyword_hits?.some((kw) => kw.toLowerCase() === selectedSkill.toLowerCase())
      );
    }
    return result;
  }, [snapshots, selectedRole, selectedPlatform, selectedRegion, searchQuery, selectedSkill]);

  // [복구] 스킬 태그 클라우드 추출
  // 4. 스킬 태그 추출 로직 강화
  const allSkills = useMemo(() => {
    const set = new Set<string>();

    // 현재 필터링된 데이터가 아닌, '전체 snapshots'에서 스킬을 추출해야 
    // 사용자가 선택할 수 있는 태그가 항상 보입니다.
    snapshots.forEach((s) => {
      // skills 필드 체크
      if (Array.isArray(s.skills)) {
        s.skills.forEach((sk) => {
          if (sk) set.add(sk.trim());
        });
      }
      // keyword_hits 필드 체크 (Adzuna 데이터 대응)
      if (Array.isArray(s.keyword_hits)) {
        s.keyword_hits.forEach((kw) => {
          if (kw) set.add(kw.trim());
        });
      }
    });

    // 데이터가 너무 많을 수 있으므로 알파벳순 정렬 후 상위 20개만 노출
    return Array.from(set).sort().slice(0, 20);
  }, [snapshots]); // filteredSnapshots 대신 snapshots를 감시하여 태그 유지

  // [복구] 정렬 시스템 (Recent, Best Match, Nearest)
  const sortedSnapshots = useMemo(() => {
    const result = [...filteredSnapshots];
    if (sortMode === "best-match" && isConfigured) {
      result.sort((a, b) => {
        const scoreA = computeMatch(a as any, profile).score;
        const scoreB = computeMatch(b as any, profile).score;
        return scoreB - scoreA;
      });
    } else if (sortMode === "distance") {
      result.sort((a, b) => {
        const da = a.distance_km ?? Infinity;
        const db = b.distance_km ?? Infinity;
        return da - db;
      });
    } else {
      result.sort((a, b) => new Date(b.captured_at || 0).getTime() - new Date(a.captured_at || 0).getTime());
    }
    return result;
  }, [filteredSnapshots, sortMode, profile, isConfigured]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <StatsBar snapshots={snapshots} allDates={dates} />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Job Feed</h2>
            {lastUpdated && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50/50 px-3 py-1 rounded-full border border-green-100/50 w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Live: {lastUpdated}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
            <ExportCSV snapshots={sortedSnapshots} />
            <div className="w-[1px] h-4 bg-slate-200 mx-1" />
            <ProfileEditor draft={draft} onUpdate={setDraft} onSave={save} isDirty={isDirty} isConfigured={isConfigured} />
            <div className="w-[1px] h-4 bg-slate-200 mx-1" />
            <GenerateButton />
          </div>
        </div>

        <div className="space-y-8">
          <FilterBar
            roles={dynamicFilters.roles}
            regions={dynamicFilters.regions}
            platforms={dynamicFilters.platforms}
            selectedRole={selectedRole}
            selectedRegion={selectedRegion}
            selectedRecency={selectedRecency}
            selectedPlatform={selectedPlatform}
            onRoleChange={setSelectedRole}
            onRegionChange={setSelectedRegion}
            onRecencyChange={setSelectedRecency}
            onPlatformChange={setSelectedPlatform}
          />

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by company, job title, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-white border-slate-200 shadow-sm rounded-2xl text-base"
            />
            {searchQuery && (
              <X className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setSearchQuery("")} />
            )}
          </div>
        </div>

        {/* [복구] Skills 태그 클라우드 */}
        {/* [화면 렌더링 부분] - 데이터가 있을 때만 렌더링 */}
        {allSkills.length > 0 ? (
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Hot Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedSkill && (
                <button
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all bg-slate-900 text-white shadow-md flex items-center gap-1"
                  onClick={() => setSelectedSkill(null)}
                >
                  {selectedSkill} <X className="w-3 h-3" />
                </button>
              )}
              {allSkills
                .filter((sk) => sk !== selectedSkill)
                .map((skill) => (
                  <button
                    key={skill}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all bg-white text-slate-600 hover:border-slate-300 border border-slate-200"
                    onClick={() => setSelectedSkill(skill)}
                  >
                    {skill}
                  </button>
                ))}
            </div>
          </div>
        ) : (
          /* 스킬 데이터가 없을 때 표시될 임시 메시지 (디버깅용) */
          <p className="text-[10px] text-slate-400 italic">No skills extracted from current data.</p>
        )}

        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em]">
              Snapshots <span className="text-slate-900 mx-1">{sortedSnapshots.length}</span>
            </h2>

            {/* [복구] 정렬 버튼 그룹 (Recent, Best Match, Nearest) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setSortMode("recent")}
                className={`text-[11px] px-3 py-1.5 rounded-lg transition-all font-bold flex items-center gap-1.5 ${sortMode === "recent" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Clock className="w-3 h-3" /> Recent
              </button>
              <button
                onClick={() => setSortMode("best-match")}
                disabled={!isConfigured}
                className={`text-[11px] px-3 py-1.5 rounded-lg transition-all font-bold flex items-center gap-1.5 ${sortMode === "best-match" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 disabled:opacity-30"}`}
                title={!isConfigured ? "Upload CV to enable match sorting" : ""}
              >
                <Target className="w-3 h-3" /> Best Match
              </button>
              <button
                onClick={() => setSortMode("distance")}
                className={`text-[11px] px-3 py-1.5 rounded-lg transition-all font-bold flex items-center gap-1.5 ${sortMode === "distance" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Ruler className="w-3 h-3" /> Nearest
              </button>
            </div>
          </div>
          <SnapshotGrid
            snapshots={sortedSnapshots}
            isLoading={isLoading}
            profile={profile}
            isProfileConfigured={isConfigured}
          />
        </section>
      </main>
      <BackToTop />
    </div>
  );
};

export default Index;