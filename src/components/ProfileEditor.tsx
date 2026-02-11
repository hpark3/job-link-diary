import { useState, useRef, useEffect } from "react";
import { User, X, Plus, Upload, Loader2, FileText, Save, Check } from "lucide-react";
import { ROLES } from "@/lib/constants";
import { classifyUKRegion } from "@/lib/geo"; // fetchAvailableRegions 대신 분류 함수 사용
import { supabase } from "@/integrations/supabase/client"; // [체크] 경로 확인 필수!
import type { CandidateProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Vite PDF Worker 설정
import PDFWorkerURL from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFWorkerURL;
}

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

const EXP_LEVELS = [
  { value: "junior" as const, label: "Junior" },
  { value: "mid" as const, label: "Mid" },
  { value: "senior" as const, label: "Senior" },
  { value: "lead" as const, label: "Lead" },
];

function TagInput({ tags, onChange, placeholder }: { tags: string[], onChange: (t: string[]) => void, placeholder: string }) {
  const [input, setInput] = useState("");
  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
    setInput("");
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          placeholder={placeholder}
          className="text-sm"
        />
        <Button variant="outline" size="sm" onClick={addTag} type="button" className="shrink-0">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="cursor-pointer gap-1 text-xs" onClick={() => onChange(tags.filter((t) => t !== tag))}>
            {tag} <X className="w-3 h-3" />
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function ProfileEditor({ draft, onUpdate, onSave, isDirty, isConfigured }: {
  draft: CandidateProfile;
  onUpdate: (update: Partial<CandidateProfile>) => void;
  onSave: () => void;
  isDirty: boolean;
  isConfigured: boolean;
}) {
  const [isParsing, setIsParsing] = useState(false);
  const [cvName, setCvName] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 거리 기반으로 분류된 지역 목록 상태
  const [dbRegions, setDbRegions] = useState<{ key: string, name: string }[]>([]);

  // 컴포넌트 로드 시 DB 데이터를 분석하여 지역 카테고리 생성
  // ProfileEditor.tsx 내부
  useEffect(() => {
    async function loadRegions() {
      // 1. 모든 공고에서 거리와 상세주소를 가져옵니다.
      const { data } = await supabase
        .from('snapshots')
        .select('distance_km, location_detail');

      if (data) {
        // 2. 피드와 동일한 classifyUKRegion 함수를 사용하여 '현재 존재하는' 지역만 추출합니다.
        const classified = data.map(item => classifyUKRegion(item.distance_km, item.location_detail));
        const uniqueLabels = Array.from(new Set(classified)).sort();

        const regionsForUI = uniqueLabels.map(label => ({
          key: label.toLowerCase().replace(/\s+/g, '_').replace(/–/g, ''),
          name: label
        }));
        setDbRegions(regionsForUI);
      }
    }
    loadRegions();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setCvName(file.name);

    try {
      let text = "";
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        text = await extractTextFromPDF(file);
      } else {
        text = await file.text();
      }

      const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
      // AI에게 현재 가능한 지역 옵션을 힌트로 제공
      const regionNames = dbRegions.map(r => r.name).join(", ") || "London – Inner, UK – Remote / Hybrid";

      const prompt = `Resume text: ${text.substring(0, 4000)}
      Extract information into JSON:
      - skills: string array
      - experienceLevel: "junior", "mid", "senior", or "lead"
      - targetRoles: string array
      - preferredRegions: Array from [${regionNames}]
      Return ONLY the JSON object. No intro, no markdown.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a recruitment assistant. Return ONLY a valid JSON object." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(`Groq Error: ${data.error.message}`);

      const rawResult = data.choices[0].message.content;
      const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in AI response");

      const parsedData = JSON.parse(jsonMatch[0]);

      // AI가 뽑아준 라벨을 시스템 키로 변환하여 매칭
      const matchedRegions = Array.isArray(parsedData.preferredRegions)
        ? parsedData.preferredRegions
          .map((r: string) => r.toLowerCase().replace(/\s+/g, '_').replace(/–/g, ''))
          .filter((key: string) => dbRegions.some(dbR => dbR.key === key))
        : [];

      onUpdate({
        skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
        experienceLevel: ["junior", "mid", "senior", "lead"].includes(parsedData.experienceLevel) ? parsedData.experienceLevel : "junior",
        targetRoles: Array.isArray(parsedData.targetRoles) ? parsedData.targetRoles : [],
        preferredRegions: matchedRegions
      });

      toast.success("AI has successfully analyzed your CV!");
    } catch (err: any) {
      console.error("AI Analysis error details:", err);
      toast.error(`Analysis failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant={isConfigured ? "outline" : "default"} size="sm" className="gap-2">
          <Upload className="w-3.5 h-3.5" /> Upload CV
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Candidate Profile
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* ... Upload CV 섹션 ... (동일) */}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Target Roles</label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
                <button
                  key={role}
                  className={`filter-chip text-[11px] ${draft.targetRoles.includes(role) ? "active" : ""}`}
                  onClick={() => onUpdate({
                    targetRoles: draft.targetRoles.includes(role)
                      ? draft.targetRoles.filter((r) => r !== role)
                      : [...draft.targetRoles, role],
                  })}
                > {role} </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Skills</label>
            <TagInput tags={draft.skills} onChange={(skills) => onUpdate({ skills })} placeholder="e.g. SQL, Python, Tableau..." />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Preferred Regions</label>
            <div className="flex flex-wrap gap-2">
              {dbRegions.length > 0 ? (
                dbRegions.map((region) => (
                  <button
                    key={region.key}
                    className={`filter-chip text-[11px] ${draft.preferredRegions.includes(region.key) ? "active" : ""}`}
                    onClick={() => onUpdate({
                      preferredRegions: draft.preferredRegions.includes(region.key)
                        ? draft.preferredRegions.filter((r) => r !== region.key)
                        : [...draft.preferredRegions, region.key],
                    })}
                  >
                    <span className="mr-1">●</span> {region.name}
                  </button>
                ))
              ) : (
                <p className="text-[10px] text-muted-foreground italic">Loading distance-based regions...</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Experience Level</label>
            <div className="flex gap-2">
              {EXP_LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  className={`filter-chip text-[11px] px-4 ${draft.experienceLevel === lvl.value ? "active" : ""}`}
                  onClick={() => onUpdate({ experienceLevel: lvl.value })}
                > {lvl.label} </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full gap-2 mt-4"
            disabled={!isDirty && !justSaved}
            onClick={() => { onSave(); setJustSaved(true); setTimeout(() => setJustSaved(false), 2000); }}
          >
            {justSaved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> {isDirty ? "Save Profile" : "No changes"}</>}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}