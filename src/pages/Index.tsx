import { useState, useMemo } from "react";
import { Clock, Target, Ruler, Search, X, Zap, ChevronDown, Upload, RefreshCw } from "lucide-react"; // Upload 아이콘 추가
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
import { classifyUKRegion } from "@/lib/geo";

type Snapshot = Tables<"snapshots"> & {
  category?: string | null;
  captured_at?: string | null;
};

type SortMode = "recent" | "best-match" | "distance";

const Index = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedRecency, setSelectedRecency] = useState<RecencyValue>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

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
      if (s.platform) platforms.add(s.platform);
      const regionLabel = classifyUKRegion(s.distance_km, s.location_detail);
      regions.add(regionLabel);
    });

    const regionOrder = ["London – Inner", "London – Outer", "London – Commuter Belt", "Greater Manchester", "UK – Regional", "UK – Remote", "UK – Hybrid"];

    return {
      roles: Array.from(roles).sort(),
      regions: Array.from(regions).sort((a, b) => {
        const posA = regionOrder.indexOf(a) === -1 ? 999 : regionOrder.indexOf(a);
        const posB = regionOrder.indexOf(b) === -1 ? 999 : regionOrder.indexOf(b);
        return posA - posB;
      }),
      platforms: Array.from(platforms).sort(),
    };
  }, [snapshots]);

  const filteredSnapshots = useMemo(() => {
    let result = [...snapshots];
    if (selectedRole) result = result.filter((s) => (s.category ?? "").toLowerCase() === selectedRole.toLowerCase());
    if (selectedPlatform) result = result.filter((s) => s.platform === selectedPlatform);
    if (selectedRegion) {
      result = result.filter((s) => classifyUKRegion(s.distance_km, s.location_detail) === selectedRegion);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => (s.job_title ?? "").toLowerCase().includes(q) || (s.company_name ?? "").toLowerCase().includes(q));
    }
    if (selectedSkill) {
      result = result.filter((s) => s.skills?.some((sk) => sk.toLowerCase() === selectedSkill.toLowerCase()) || s.keyword_hits?.some((kw) => kw.toLowerCase() === selectedSkill.toLowerCase()));
    }
    return result;
  }, [snapshots, selectedRole, selectedPlatform, selectedRegion, searchQuery, selectedSkill]);

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    snapshots.forEach((s) => {
      if (Array.isArray(s.skills)) s.skills.forEach((sk) => sk && set.add(sk.trim()));
      if (Array.isArray(s.keyword_hits)) s.keyword_hits.forEach((kw) => kw && set.add(kw.trim()));
    });
    return Array.from(set).sort().slice(0, 20);
  }, [snapshots]);

  const sortedSnapshots = useMemo(() => {
    const result = [...filteredSnapshots];
    if (sortMode === "best-match" && isConfigured) {
      result.sort((a, b) => computeMatch(b as any, profile).score - computeMatch(a as any, profile).score);
    } else if (sortMode === "distance") {
      result.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
    } else {
      result.sort((a, b) => new Date(b.captured_at || 0).getTime() - new Date(a.captured_at || 0).getTime());
    }
    return result;
  }, [filteredSnapshots, sortMode, profile, isConfigured]);

  const visibleSnapshots = useMemo(() => sortedSnapshots.slice(0, visibleCount), [sortedSnapshots, visibleCount]);

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

          <div className="flex items-center gap-3">
            {/* ✅ Export CSV 버튼 주석 처리 (이후 다른 위치 활용 고려) */}
            {/* <ExportCSV snapshots={sortedSnapshots} /> */}

            {/* ✅ Upload CV: 목업 요구사항 반영 (#EA6753 계열, 타원형) */}
            <ProfileEditor 
              draft={draft} 
              onUpdate={setDraft} 
              onSave={save} 
              isDirty={isDirty} 
              isConfigured={isConfigured} 
              className="bg-white border-[#EA6753] text-[#EA6753] hover:bg-[#EA6753] hover:text-white rounded-full transition-all px-6 py-2 shadow-none"
            />

            {/* ✅ Generate Today: 목업 요구사항 반영 (#5F74DD 계열, 타원형) */}
            <GenerateButton 
              className="bg-white border-[#5F74DD] text-[#5F74DD] hover:bg-[#5F74DD] hover:text-white rounded-full transition-all px-6 py-2 shadow-none"
            />
          </div>
        </div>

        {/* ... (중략: 필터바 및 검색 로직) ... */}
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
            {searchQuery && <X className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setSearchQuery("")} />}
          </div>
        </div>

        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em]">
              Snapshots <span className="text-slate-900 mx-1">{sortedSnapshots.length}</span>
            </h2>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button onClick={() => setSortMode("recent")} className={`text-[11px] px-3 py-1.5 rounded-lg transition-all font-bold flex items-center gap-1.5 ${sortMode === "recent" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Clock className="w-3 h-3" /> Recent</button>
              <button onClick={() => setSortMode("best-match")} className={`text-[11px] px-3 py-1.5 rounded-lg transition-all font-bold flex items-center gap-1.5 ${sortMode === "best-match" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 disabled:opacity-30"}`} disabled={!isConfigured}><Target className="w-3 h-3" /> Best Match</button>
              <button onClick={() => setSortMode("distance")} className={`text-[11px] px-3 py-1.5 rounded-lg transition-all font-bold flex items-center gap-1.5 ${sortMode === "distance" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Ruler className="w-3 h-3" /> Nearest</button>
            </div>
          </div>

          <SnapshotGrid snapshots={visibleSnapshots} isLoading={isLoading} profile={profile} isProfileConfigured={isConfigured} />

          {/* ✅ Show More 버튼: 블루 테두리 + 둥근 캡슐 */}
          {sortedSnapshots.length > visibleCount && (
            <div className="flex justify-center pt-8 pb-20">
              <button
                onClick={() => setVisibleCount((prev) => prev + 12)}
                className="flex items-center gap-2 px-8 py-3 rounded-full border border-blue-100 bg-white text-blue-600 font-medium hover:bg-blue-50/50 hover:border-blue-200 transition-all shadow-sm group"
              >
                <ChevronDown className="w-4 h-4 text-blue-400 group-hover:translate-y-0.5 transition-transform" />
                <span className="text-sm">Show more</span>
                <span className="text-sm text-slate-400 font-normal">({sortedSnapshots.length - visibleCount})</span>
              </button>
            </div>
          )}
        </section>
      </main>
      <BackToTop />
    </div>
  );
};

export default Index;