import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { DISTANCE_BANDS } from "@/lib/geo";

interface Props {
  snapshots: Array<{ date: string; distance_km: number | null }>;
}

export function DistanceBandChart({ snapshots }: Props) {
  const chartData = useMemo(() => {
    const ukWithDist = snapshots.filter((s) => s.distance_km != null);
    const dateMap = new Map<string, Record<string, number>>();

    ukWithDist.forEach((s) => {
      if (!dateMap.has(s.date)) dateMap.set(s.date, {});
      const day = dateMap.get(s.date)!;
      const band = DISTANCE_BANDS.find(
        (b) => s.distance_km! >= b.min && s.distance_km! < b.max
      );
      const label = band?.label ?? "30+ km";
      day[label] = (day[label] ?? 0) + 1;
    });

    return Array.from(dateMap.entries())
      .map(([date, bands]) => ({ date, ...bands }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [snapshots]);

  if (chartData.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-10">
        No geocoded UK snapshots yet. Run the geocode function to populate distance data.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {DISTANCE_BANDS.map((b) => (
          <Bar key={b.label} dataKey={b.label} stackId="dist" fill={b.color} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
