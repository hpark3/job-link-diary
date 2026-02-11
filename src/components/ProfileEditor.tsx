import { useState, useRef } from "react";
import { User, X, Plus, Upload, Loader2, FileText, Save, Check } from "lucide-react";
import { ROLES, REGIONS } from "@/lib/constants";
import type { CandidateProfile } from "@/hooks/useProfile";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// [해결] Vite 환경에서 워커를 로드하는 최적화된 방식
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
import { toast } from "sonner";

const EXP_LEVELS = [
  { value: "junior" as const, label: "Junior" },
  { value: "mid" as const, label: "Mid" },
  { value: "senior" as const, label: "Senior" },
  { value: "lead" as const, label: "Lead" },
];

interface PDFTextItem {
  str: string;
}

/**
 * PDF 텍스트 추출 함수
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const strings = content.items
        .map((item: any) => item.str)
        .filter((str): str is string => typeof str === "string");

      fullText += strings.join(" ") + "\n";
    }

    if (!fullText.trim()) throw new Error("Could not extract text from PDF.");
    return fullText;
  } catch (err: any) {
    console.error("PDF extraction error:", err);
    throw new Error(err.message || "Failed to read PDF file.");
  }
}

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

      const API_KEY = "AIzaSyBADVIyU9FzxX2QzGpo4st0RhSz_KaNroI";
      // 프롬프트를 조금 더 엄격하게 수정
      const prompt = `Resume text: ${text.substring(0, 4000)}
      
      Extract information into JSON:
      - skills: string array
      - experienceLevel: "junior", "mid", "senior", or "lead"
      - targetRoles: string array
      - preferredRegions: Array from ["seoul", "gyeonggi", "incheon", "daejeon", "daegu", "gwangju", "busan", "ulsan", "gangwon", "sejong", "remote"]
      
      Return ONLY the JSON object. No intro, no markdown.`;

// 주소 및 설정
// [진짜 최종] 리스트에서 확인된 지원 모델명을 사용합니다.
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();

      // 구글 에러 응답 처리
      if (data.error) {
        throw new Error(`Gemini Error: ${data.error.message}`);
      }

      const rawResult = data.candidates[0].content.parts[0].text;

      // [핵심] JSON만 추출하기 (마크다운 백틱 제거)
      const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in AI response");

      const parsedData = JSON.parse(jsonMatch[0]);

      onUpdate({
        skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
        experienceLevel: ["junior", "mid", "senior", "lead"].includes(parsedData.experienceLevel) ? parsedData.experienceLevel : "junior",
        targetRoles: Array.isArray(parsedData.targetRoles) ? parsedData.targetRoles : [],
        preferredRegions: Array.isArray(parsedData.preferredRegions) ? parsedData.preferredRegions : []
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
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Upload CV</label>
            <input ref={fileRef} type="file" accept=".pdf,.txt,.md" className="hidden" onChange={handleFileUpload} />
            <Button variant="outline" className="w-full gap-2 justify-center py-6" onClick={() => fileRef.current?.click()} disabled={isParsing}>
              {isParsing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Extracting Text...</>
              ) : (
                <><Upload className="w-4 h-4" /> {cvName ? "Re-upload CV" : "Choose File (.txt, .md, .pdf)"}</>
              )}
            </Button>
            {cvName && !isParsing && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
                <FileText className="w-3.5 h-3.5" /> {cvName}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground/70 px-1">Upload your CV to refer to while filling out your profile.</p>
          </div>

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
              {REGIONS.map((region) => (
                <button
                  key={region.key}
                  className={`filter-chip text-[11px] ${draft.preferredRegions.includes(region.key) ? "active" : ""}`}
                  onClick={() => onUpdate({
                    preferredRegions: draft.preferredRegions.includes(region.key)
                      ? draft.preferredRegions.filter((r) => r !== region.key)
                      : [...draft.preferredRegions, region.key],
                  })}
                >
                  <span className={`region-${region.key}`}>●</span> {region.name}
                </button>
              ))}
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