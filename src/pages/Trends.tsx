import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, BarChart3, PieChart, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RePieChart, Pie, Cell, Legend,
} from "recharts";
import { DistanceBandChart } from "@/components/DistanceBandChart";
import { JobMap } from "@/components/JobMap";
import { DISTANCE_BANDS } from "@/lib/geo";

const COLORS = [
  "hsl(230,65%,62%)", "hsl(8,78%,62%)", "hsl(200,70%,50%)",
  "hsl(340,65%,55%)", "hsl(145,60%,42%)", "hsl(45,85%,55%)", "hsl(280,60%,55%)",
];

export default function Trends() {
  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ["all-snapshots-trends"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("snapshots")
        .select("date, role, region, platform, keyword_score, keyword_hits, skills, id, latitude, longitude, distance_km, job_title, company_name, location_detail")
        .order("date", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const dailyCounts = useMemo(() => {
    const map = new Map<string, number>();
    snapshots.forEach((s) => {
      map.set(s.date, (map.get(s.date) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [snapshots]);

  const roleDistribution = useMemo(() => {
    const map = new Map<string, number>();
    snapshots.forEach((s) => {
      map.set(s.role, (map.get(s.role) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);
  }, [snapshots]);

  const regionByDate = useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>();
    snapshots.forEach((s) => {
      if (!dateMap.has(s.date)) dateMap.set(s.date, {});
      const dayData = dateMap.get(s.date)!;
      dayData[s.region] = (dayData[s.region] ?? 0) + 1;
    });
    return Array.from(dateMap.entries())
      .map(([date, regions]) => ({ date, ...regions }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [snapshots]);

  const topSkills = useMemo(() => {
    const map = new Map<string, number>();
    snapshots.forEach((s) => {
      const skills: string[] = s.skills ?? s.keyword_hits ?? [];
      skills.forEach((skill: string) => {
        map.set(skill, (map.get(skill) ?? 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [snapshots]);

  const regions = useMemo(() => {
    return [...new Set(snapshots.map((s) => s.region))];
  }, [snapshots]);

  const ukSnapshots = useMemo(
    () => snapshots.filter((s) => s.region === "London, United Kingdom"),
    [snapshots]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-muted rounded w-1/4" />
            <div className="h-64 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Trend Dashboard</h1>
            <p className="text-xs text-muted-foreground">Job market trends · Home base: Crystal Palace, London</p>
          </div>
        </div>

        {/* Commute-aware UK section */}
        <div className="mb-8 space-y-6">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">London Commute Analysis</h2>
            <span className="text-xs text-muted-foreground ml-1">
              ({ukSnapshots.filter((s) => s.distance_km != null).length} geocoded of {ukSnapshots.length} UK snapshots)
            </span>
          </div>

          {/* Distance band legend */}
          <div className="flex flex-wrap gap-3">
            {DISTANCE_BANDS.map((b) => (
              <span key={b.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: b.color }} />
                {b.label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Map */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Job Locations from Crystal Palace
              </h3>
              <JobMap jobs={ukSnapshots} />
            </div>

            {/* Distance band chart */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Jobs by Distance Band Over Time
              </h3>
              <DistanceBandChart snapshots={ukSnapshots} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Job Count */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Daily Snapshot Count</h2>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke="hsl(230,65%,62%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Role Distribution */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-semibold">Role Distribution</h2>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={roleDistribution}
                  dataKey="count"
                  nameKey="role"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ role, percent }) => `${role} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={10}
                >
                  {roleDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          {/* Region Trend */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Snapshots by Region Over Time</h2>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={regionByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {regions.map((region, i) => (
                  <Bar key={region} dataKey={region} stackId="a" fill={COLORS[i % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Skills */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-semibold">Top Skills / Keywords</h2>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topSkills} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="skill" tick={{ fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(8,78%,62%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
