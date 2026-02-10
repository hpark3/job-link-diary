import { Briefcase } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="border-b border-border px-6 py-5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Job Market Index</h1>
            <p className="text-xs text-muted-foreground font-mono">Daily LinkedIn search snapshots</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>
    </header>
  );
}
