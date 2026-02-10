import { useState, useRef } from "react";
import { User, X, Plus, Upload, Loader2, FileText, Save, Check } from "lucide-react";
import { ROLES, REGIONS } from "@/lib/constants";
import type { CandidateProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ProfileEditorProps {
  profile: CandidateProfile;
  onUpdate: (update: Partial<CandidateProfile>) => void;
  isConfigured: boolean;
}

const EXP_LEVELS = [
  { value: "junior" as const, label: "Junior" },
  { value: "mid" as const, label: "Mid" },
  { value: "senior" as const, label: "Senior" },
  { value: "lead" as const, label: "Lead" },
];

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          placeholder={placeholder}
          className="text-sm"
        />
        <Button variant="outline" size="sm" onClick={addTag} type="button">
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="cursor-pointer gap-1 text-xs"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
          >
            {tag}
            <X className="w-3 h-3" />
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function ProfileEditor({ profile, onUpdate, isConfigured }: ProfileEditorProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [cvName, setCvName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only accept text-readable files for now
    const allowed = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type) && !file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
      toast.error("Please upload a .txt, .md, .pdf, or .docx file");
      return;
    }

    setIsParsing(true);
    setCvName(file.name);

    try {
      // Read as text (works for .txt/.md; for pdf/docx we send raw text attempt)
      const text = await file.text();

      if (text.trim().length < 20) {
        toast.error("CV content is too short to parse");
        setIsParsing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("parse-cv", {
        body: { cvText: text },
      });

      if (error) {
        throw new Error(error.message || "Failed to parse CV");
      }

      if (data?.profile) {
        const p = data.profile;
        onUpdate({
          targetRoles: p.targetRoles ?? [],
          skills: p.skills ?? [],
          domains: p.domains ?? [],
          preferredRegions: p.preferredRegions ?? [],
          experienceLevel: p.experienceLevel ?? "mid",
        });
        toast.success("Profile extracted from CV!", {
          description: p.summary || "Review and adjust below.",
        });
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err: any) {
      console.error("CV parse error:", err);
      toast.error("Failed to parse CV. Try a .txt version.");
    } finally {
      setIsParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant={isConfigured ? "outline" : "default"}
          size="sm"
          className="gap-2"
        >
          <User className="w-3.5 h-3.5" />
          {isConfigured ? "My Profile" : "Upload CV"}
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Candidate Profile
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* CV Upload */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Upload CV
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.pdf,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full gap-2 justify-center"
              onClick={() => fileRef.current?.click()}
              disabled={isParsing}
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Parsing CV…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {cvName ? "Re-upload CV" : "Choose File (.txt, .md, .pdf)"}
                </>
              )}
            </Button>
            {cvName && !isParsing && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {cvName}
              </p>
            )}
            <p className="text-xs text-muted-foreground/60 mt-1">
              AI will extract your profile. You can fine-tune below.
            </p>
          </div>

          {/* Target Roles */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Target Roles
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
                <button
                  key={role}
                  className={`filter-chip text-xs ${profile.targetRoles.includes(role) ? "active" : ""}`}
                  onClick={() =>
                    onUpdate({
                      targetRoles: profile.targetRoles.includes(role)
                        ? profile.targetRoles.filter((r) => r !== role)
                        : [...profile.targetRoles, role],
                    })
                  }
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Skills
            </label>
            <TagInput
              tags={profile.skills}
              onChange={(skills) => onUpdate({ skills })}
              placeholder="e.g. SQL, Python, Tableau…"
            />
          </div>

          {/* Domains */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Domains
            </label>
            <TagInput
              tags={profile.domains}
              onChange={(domains) => onUpdate({ domains })}
              placeholder="e.g. Fintech, SaaS, E-commerce…"
            />
          </div>

          {/* Preferred Regions */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Preferred Regions
            </label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((region) => (
                <button
                  key={region.key}
                  className={`filter-chip text-xs ${profile.preferredRegions.includes(region.key) ? "active" : ""}`}
                  onClick={() =>
                    onUpdate({
                      preferredRegions: profile.preferredRegions.includes(region.key)
                        ? profile.preferredRegions.filter((r) => r !== region.key)
                        : [...profile.preferredRegions, region.key],
                    })
                  }
                >
                  <span className={`region-${region.key}`}>●</span> {region.name}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Experience Level
            </label>
            <div className="flex gap-2">
              {EXP_LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  className={`filter-chip text-xs ${profile.experienceLevel === lvl.value ? "active" : ""}`}
                  onClick={() => onUpdate({ experienceLevel: lvl.value })}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
