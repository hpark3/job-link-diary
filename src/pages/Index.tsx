import { useState, useMemo } from "react";
import { ArrowDownWideNarrow, Clock, Target, Ruler, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FilterBar } from "@/components/FilterBar";
import { DateNav } from "@/components/DateNav";
import { SnapshotGrid } from "@/components/SnapshotGrid";
import { GenerateButton } from "@/components/GenerateButton";
import { ExportCSV } from "@/components/ExportCSV";
import { StatsBar } from "@/components/StatsBar";
import { ProfileEditor } from "@/components/ProfileEditor";
import { ApiAccessSection } from "@/components/ApiAccessSection";
import { BackToTop } from "@/components/BackToTop";
import { useSnapshots, useAvailableDates } from "@/hooks/useSnapshots";
import { useProfile } from "@/hooks/useProfile";
import { computeMatch } from "@/lib/matchScore";
import { REGIONS, DISPLAY_REGIONS, RECENCY_OPTIONS, type RecencyValue } from "@/lib/constants";
import { classifyUKRegion } from "@/lib/geo";

type SortMode = "recent" | "best-match" | "distance";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedRecency, setSelectedRecency] = useState<RecencyValue>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const { profile, draft, setDraft, save, isDirty, isConfigured } = useProfile();

  // Map selected display region to DB query region + distance filter
  const isUKDistanceFilter = selectedRegion && ["london-inner", "london-outer", "london-commuter", "uk-remote"].includes(selectedRegion);
  const regionName = selectedRegion
    ? isUKDistanceFilter
      ? "London, United Kingdom"
      : (REGIONS.find((r) => r.key === selectedRegion)?.name ?? DISPLAY_REGIONS.find((r) => r.key === selectedRegion)?.name ?? undefined)
    : undefined;

  const recencyDays = selectedDate
    ? null
    : RECENCY_OPTIONS.find((o) => o.value === selectedRecency)?.days ?? null;

  const { data: snapshots = [], isLoading } = useSnapshots({
    date: selectedDate ?? undefined,
    role: selectedRole ?? undefined,
    region: regionName,
    platform: selectedPlatform ?? undefined,
    recencyDays,
  });

  const { data: dates = [] } = useAvailableDates();

  // Apply distance-based UK region filter client-side
  const distanceFilteredSnapshots = useMemo(() => {
    if (!isUKDistanceFilter) return snapshots;

    const distanceLimits: Record<string, { min: number; max: number }> = {
      "london-inner": { min: 0, max: 10 },
      "london-outer": { min: 10, max: 20 },
      "london-commuter": { min: 20, max: 35 },
      "uk-remote": { min: 35, max: Infinity },
    };
    const limits = distanceLimits[selectedRegion!];
    if (!limits) return snapshots;

    return snapshots.filter((s) => {
      if (s.distance_km == null) {
        // Snapshots without distance go to "UK – Remote / Hybrid"
        return selectedRegion === "uk-remote";
      }
      return s.distance_km >= limits.min && s.distance_km < limits.max;
    });
  }, [snapshots, isUKDistanceFilter, selectedRegion]);

  // Text search filter
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return distanceFilteredSnapshots;
    const q = searchQuery.toLowerCase();
    return distanceFilteredSnapshots.filter((s) => {
      const title = (s.job_title ?? "").toLowerCase();
      const company = (s.company_name ?? "").toLowerCase();
      const role = s.role.toLowerCase();
      return title.includes(q) || company.includes(q) || role.includes(q);
    });
  }, [distanceFilteredSnapshots, searchQuery]);

  // Skill tag filter
  const skillFiltered = useMemo(() => {
    if (!selectedSkill) return searchFiltered;
    return searchFiltered.filter((s) =>
      s.skills?.some((sk) => sk.toLowerCase() === selectedSkill.toLowerCase()) ||
      s.keyword_hits?.some((kw) => kw.toLowerCase() === selectedSkill.toLowerCase())
    );
  }, [searchFiltered, selectedSkill]);

  // Collect all unique skills for tag cloud
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    distanceFilteredSnapshots.forEach((s) => {
      s.skills?.forEach((sk) => set.add(sk));
      s.keyword_hits?.forEach((kw) => set.add(kw));
    });
    return Array.from(set).sort();
  }, [distanceFilteredSnapshots]);

  const sortedSnapshots = useMemo(() => {
    if (sortMode === "best-match" && isConfigured) {
      return [...skillFiltered].sort((a, b) => {
        const scoreA = computeMatch(a, profile).score;
        const scoreB = computeMatch(b, profile).score;
        return scoreB - scoreA;
      });
    }
    if (sortMode === "distance") {
      return [...skillFiltered].sort((a, b) => {
        const da = a.distance_km ?? Infinity;
        const db = b.distance_km ?? Infinity;
        return da - db;
      });
    }
    return skillFiltered;
  }, [skillFiltered, sortMode, profile, isConfigured]);

  const handleDateChange = (date: string | null) => {
    setSelectedDate(date);
    if (date) setSelectedRecency("all");
  };

  const handleRecencyChange = (recency: RecencyValue) => {
    setSelectedRecency(recency);
    if (recency !== "all") setSelectedDate(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <StatsBar snapshots={snapshots} allDates={dates} />

        <div className="flex items-center justify-between">
          <DateNav dates={dates} selectedDate={selectedDate} onDateChange={handleDateChange} />
          <div className="flex items-center gap-2">
            <ExportCSV snapshots={sortedSnapshots} />
            <ProfileEditor draft={draft} onUpdate={setDraft} onSave={save} isDirty={isDirty} isConfigured={isConfigured} />
            <GenerateButton />
          </div>
        </div>

        <FilterBar
          selectedRole={selectedRole}
          selectedRegion={selectedRegion}
          selectedRecency={selectedRecency}
          selectedPlatform={selectedPlatform}
          onRoleChange={setSelectedRole}
          onRegionChange={setSelectedRegion}
          onRecencyChange={handleRecencyChange}
          onPlatformChange={setSelectedPlatform}
        />

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by company, job title, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Skill tags */}
        {allSkills.length > 0 && (
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Skills</label>
            <div className="flex flex-wrap gap-1.5">
              {selectedSkill && (
                <button
                  className="filter-chip text-xs active"
                  onClick={() => setSelectedSkill(null)}
                >
                  {selectedSkill} ✕
                </button>
              )}
              {allSkills
                .filter((sk) => sk !== selectedSkill)
                .slice(0, 20)
                .map((skill) => (
                  <button
                    key={skill}
                    className="filter-chip text-xs"
                    onClick={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
                  >
                    {skill}
                  </button>
                ))}
              {allSkills.length > 20 && !selectedSkill && (
                <span className="text-xs text-muted-foreground self-center">+{allSkills.length - 20} more</span>
              )}
            </div>
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm text-muted-foreground uppercase tracking-wider">
              Snapshots
              <span className="text-accent font-semibold ml-2">{sortedSnapshots.length}</span>
            </h2>
            <div className="flex items-center gap-1.5">
              <ArrowDownWideNarrow className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mr-1">Sort</span>
              <button
                className={`filter-chip text-xs gap-1 inline-flex items-center ${sortMode === "recent" ? "active" : ""}`}
                onClick={() => setSortMode("recent")}
              >
                <Clock className="w-3 h-3" />
                Recent
              </button>
              <button
                className={`filter-chip text-xs gap-1 inline-flex items-center ${sortMode === "best-match" ? "active" : ""}`}
                onClick={() => setSortMode("best-match")}
                disabled={!isConfigured}
                title={!isConfigured ? "Upload CV to enable match sorting" : ""}
              >
                <Target className="w-3 h-3" />
                Best Match
              </button>
              <button
                className={`filter-chip text-xs gap-1 inline-flex items-center ${sortMode === "distance" ? "active" : ""}`}
                onClick={() => setSortMode("distance")}
              >
                <Ruler className="w-3 h-3" />
                Nearest
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

        <ApiAccessSection />
      </main>

      <BackToTop />
    </div>
  );
};

export default Index;
