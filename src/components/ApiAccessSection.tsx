import { useState } from "react";
import { Code2, Copy, Check, AlertTriangle, ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const ENDPOINT_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || "owgiskzmtmfurnwnfgsi"}.supabase.co/functions/v1/ingest-jobs`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

const SAMPLE_PAYLOAD = `[
  {
    "date": "2026-02-11",
    "role": "Business Analyst",
    "region": "Seoul, South Korea",
    "platform": "LinkedIn",
    "job_title": "Senior Business Analyst",
    "company_name": "Acme Corp",
    "description": "Full job description text...",
    "skills": ["SQL", "Python", "Tableau"],
    "keyword_hits": ["SQL", "Python"],
    "keyword_score": 15,
    "seniority_hint": true,
    "source_url": "https://linkedin.com/jobs/view/123",
    "salary_range": "$80k–$120k",
    "preview_snippet": "We are looking for a Senior BA..."
  }
]`;

const SESSION_KEY = "api-access-open";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function ApiAccessSection() {
  const [open, setOpen] = useState(() => sessionStorage.getItem(SESSION_KEY) === "true");

  const handleToggle = (next: boolean) => {
    setOpen(next);
    sessionStorage.setItem(SESSION_KEY, String(next));
  };

  return (
    <Collapsible open={open} onOpenChange={handleToggle} asChild>
      <section>
        <CollapsibleTrigger className="w-full group">
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Code2 className="w-4 h-4 text-primary" />
              <div className="text-left">
                <h2 className="text-sm font-medium text-foreground">API Access</h2>
                <p className="text-xs text-muted-foreground">For personal data ingestion (developer use)</p>
              </div>
            </div>
            <ChevronRight
              className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90"
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className="rounded-b-lg border border-t-0 border-border bg-card p-5 space-y-5 text-sm">
            {/* Disclaimer */}
            <div className="flex gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                This API is for <strong>personal data ingestion only</strong>. It is not intended for
                third-party integrations or production use. Use it to feed data from your own collector
                scripts (e.g. Python).
              </p>
            </div>

            {/* Endpoint */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Endpoint</label>
              <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 border border-border px-3 py-2 font-mono text-xs break-all">
                <span className="select-all">POST {ENDPOINT_URL}</span>
                <CopyButton text={ENDPOINT_URL} />
              </div>
            </div>

            {/* Anon Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Anon Key</label>
              <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 border border-border px-3 py-2 font-mono text-xs break-all">
                <span className="select-all">{ANON_KEY || "(not available)"}</span>
                {ANON_KEY && <CopyButton text={ANON_KEY} />}
              </div>
            </div>

            {/* Required Headers */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Required Headers</label>
              <div className="rounded-md bg-muted/50 border border-border px-3 py-2 font-mono text-xs space-y-1">
                <p>Content-Type: application/json</p>
                <p>Authorization: Bearer <span className="text-muted-foreground">&lt;ANON_KEY&gt;</span></p>
              </div>
            </div>

            {/* Sample Payload */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sample Payload</label>
                <CopyButton text={SAMPLE_PAYLOAD} />
              </div>
              <pre className="rounded-md bg-muted/50 border border-border px-3 py-2 font-mono text-xs overflow-x-auto whitespace-pre">
                {SAMPLE_PAYLOAD}
              </pre>
            </div>
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
