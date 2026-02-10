import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FilterBar } from "@/components/FilterBar";
import { DateNav } from "@/components/DateNav";
import { SnapshotGrid } from "@/components/SnapshotGrid";
import { GenerateButton } from "@/components/GenerateButton";
import { StatsBar } from "@/components/StatsBar";
import { useSnapshots, useAvailableDates } from "@/hooks/useSnapshots";
import { REGIONS } from "@/lib/constants";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const regionName = selectedRegion
    ? REGIONS.find((r) => r.key === selectedRegion)?.name ?? undefined
    : undefined;

  const { data: snapshots = [], isLoading } = useSnapshots({
    date: selectedDate ?? undefined,
    role: selectedRole ?? undefined,
    region: regionName,
  });

  const { data: dates = [] } = useAvailableDates();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <StatsBar snapshots={snapshots} allDates={dates} />

        <div className="flex items-center justify-between">
          <DateNav dates={dates} selectedDate={selectedDate} onDateChange={setSelectedDate} />
          <GenerateButton />
        </div>

        <FilterBar
          selectedRole={selectedRole}
          selectedRegion={selectedRegion}
          onRoleChange={setSelectedRole}
          onRegionChange={setSelectedRegion}
        />

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
              Snapshots
              <span className="text-primary ml-2">{snapshots.length}</span>
            </h2>
          </div>
          <SnapshotGrid snapshots={snapshots} isLoading={isLoading} />
        </section>
      </main>
    </div>
  );
};

export default Index;
