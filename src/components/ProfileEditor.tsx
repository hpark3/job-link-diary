import { useState } from "react";
import { User, X, Plus } from "lucide-react";
import { ROLES, REGIONS } from "@/lib/constants";
import type { CandidateProfile } from "@/hooks/useProfile";
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
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant={isConfigured ? "outline" : "default"}
          size="sm"
          className="gap-2"
        >
          <User className="w-3.5 h-3.5" />
          {isConfigured ? "My Profile" : "Set Up Profile"}
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
