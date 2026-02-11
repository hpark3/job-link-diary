import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Briefcase, MapPin, Calendar, Building2, DollarSign, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useProfile } from "@/hooks/useProfile";
import { SkillComparison } from "@/components/SkillComparison";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile, isConfigured } = useProfile();

  const { data: snapshot, isLoading } = useQuery({
    queryKey: ["snapshot", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("snapshots")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Snapshot not found</p>
          <Link to="/" className="text-primary hover:underline text-sm">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const skills = (snapshot as any).skills ?? [];
  const description = (snapshot as any).description ?? null;
  const companyName = (snapshot as any).company_name ?? null;
  const salaryRange = (snapshot as any).salary_range ?? null;
  const sourceUrl = (snapshot as any).source_url ?? null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        {/* Header */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground mb-1">
                {snapshot.job_title ?? snapshot.role}
              </h1>
              {companyName && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                  <Building2 className="w-4 h-4" />
                  {companyName}
                </div>
              )}
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {snapshot.platform}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-accent" />
              {snapshot.role}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {snapshot.region}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {format(parseISO(snapshot.date), "yyyy-MM-dd")}
            </span>
            {salaryRange && (
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                {salaryRange}
              </span>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            {snapshot.linkedin_search_url && (
              <a
                href={snapshot.linkedin_search_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Search URL
              </a>
            )}
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-accent/30 text-accent hover:bg-accent/5 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Job Posting
              </a>
            )}
          </div>
        </div>

        {/* Keyword Hits */}
        {snapshot.keyword_hits && snapshot.keyword_hits.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">Detected Keywords</h2>
            <div className="flex flex-wrap gap-2">
              {snapshot.keyword_hits.map((kw: string) => (
                <span key={kw} className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-medium">
                  {kw}
                </span>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Keyword Score: <span className="font-semibold text-accent">{snapshot.keyword_score ?? 0}</span>/100
            </div>
          </div>
        )}

        {/* Skills from JD */}
        {skills.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string) => (
                <span key={skill} className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CV vs JD Comparison */}
        {isConfigured && skills.length > 0 && (
          <SkillComparison jdSkills={skills} profile={profile} />
        )}

        {/* Full Description */}
        {description ? (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">Job Description</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {description}
            </div>
          </div>
        ) : (
          <div className="bg-secondary/50 border border-border rounded-xl p-6 mb-6 text-center">
            <p className="text-sm text-muted-foreground">
              Full job description not yet available.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              The external collector will provide detailed descriptions when available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
