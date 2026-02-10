import { useState, useMemo } from "react";
import { ArrowDownWideNarrow, Clock, Target } from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FilterBar } from "@/components/FilterBar";
import { DateNav } from "@/components/DateNav";
import { SnapshotGrid } from "@/components/SnapshotGrid";
import { GenerateButton } from "@/components/GenerateButton";
import { StatsBar } from "@/components/StatsBar";
import { ProfileEditor } from "@/components/ProfileEditor";
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
              <span className="text-accent font-semibold ml-2">{snapshots.length}</span>
            </h2>
          </div>
          <SnapshotGrid
            snapshots={snapshots}
            isLoading={isLoading}
            profile={profile}
            isProfileConfigured={isConfigured}
          />
        </section>
      </main>
    </div>
  );
};

export default Index;
