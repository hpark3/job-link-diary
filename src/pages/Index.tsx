import { useState, useMemo } from "react";
import { ArrowDownWideNarrow, Clock, Target } from "lucide-react";
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
import { REGIONS, RECENCY_OPTIONS, type RecencyValue } from "@/lib/constants";

type SortMode = "recent" | "best-match";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedRecency, setSelectedRecency] = useState<RecencyValue>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  const { profile, draft, setDraft, save, isDirty, isConfigured } = useProfile();

  const regionName = selectedRegion
    ? REGIONS.find((r) => r.key === selectedRegion)?.name ?? undefined
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

  const sortedSnapshots = useMemo(() => {
    if (sortMode === "best-match" && isConfigured) {
      return [...snapshots].sort((a, b) => {
        const scoreA = computeMatch(a, profile).score;
        const scoreB = computeMatch(b, profile).score;
        return scoreB - scoreA;
      });
    }
    // "recent" is already sorted by date desc from the query
    return snapshots;
  }, [snapshots, sortMode, profile, isConfigured]);

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
