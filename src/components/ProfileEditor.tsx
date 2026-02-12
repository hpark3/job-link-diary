import { useState, useRef, useEffect } from "react";
import { User, X, Plus, Upload, Loader2, FileText, Save, Check, FileUp, Trash2 } from "lucide-react"; // Trash2 추가
import { ROLES } from "@/lib/constants";
import { classifyUKRegion } from "@/lib/geo";
import { supabase } from "@/integrations/supabase/client";
import type { CandidateProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { cn } from "@/lib/utils";

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

export function ProfileEditor({ draft, onUpdate, onSave, isDirty, isConfigured, className }: {
  draft: CandidateProfile;
  onUpdate: (update: Partial<CandidateProfile>) => void;
  onSave: () => void;
  isDirty: boolean;
  isConfigured: boolean;
  className?: string;
}) {
  const [isParsing, setIsParsing] = useState(false);
  const [cvName, setCvName] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dbRegions, setDbRegions] = useState<{ key: string, name: string }[]>([]);

  // ✅ 파일 삭제 및 데이터 초기화 기능
  const handleRemoveFile = () => {
    setCvName(null);
    onUpdate({
      skills: [],
      targetRoles: [],
      preferredRegions: [],
      experienceLevel: "junior"
    });
    if (fileRef.current) fileRef.current.value = "";
    toast.info("CV and profile data cleared.");
  };

  useEffect(() => {
    async function loadRegions() {
      const { data } = await supabase.from('snapshots').select('distance_km, location_detail');
      if (data) {
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

  const extractTextFromPDF = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ");
    }
    return text;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setCvName(file.name);

    try {
      let text = (file.type === "application/pdf" || file.name.endsWith(".pdf")) 
        ? await extractTextFromPDF(file) 
        : await file.text();

      const regionNames = dbRegions.map(r => r.name).join(", ") || "London – Inner, UK – Remote / Hybrid";
      const prompt = `Resume text: ${text.substring(0, 4000)}\nExtract into JSON: skills[], experienceLevel(junior|mid|senior|lead), targetRoles[], preferredRegions from [${regionNames}]. Return JSON ONLY.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: "Recruitment assistant. Valid JSON ONLY." }, { role: "user", content: prompt }],
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      const parsedData = JSON.parse(data.choices[0].message.content);

      onUpdate({
        skills: parsedData.skills || [],
        experienceLevel: parsedData.experienceLevel || "junior",
        targetRoles: parsedData.targetRoles || [],
        preferredRegions: (parsedData.preferredRegions || []).map((r: string) => r.toLowerCase().replace(/\s+/g, '_').replace(/–/g, ''))
      });

      toast.success("CV analyzed by AI!");
    } catch (err: any) {
      toast.error("Analysis failed.");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {/* ✅ 요구사항: 업로드 완료 시 아이콘 변경 + 색상 반전/연하게 + 타원형 유지 */}
        <Button 
          className={cn(
            "gap-2 border px-6 h-auto py-2.5 transition-all font-medium rounded-full", // 타원형 강제
            cvName 
              ? "bg-[#EA6753]/10 border-[#EA6753]/30 text-[#EA6753]/60 hover:bg-[#EA6753]/20" 
              : className // 기본 스타일 (주홍색 테두리 타원형)
          )}
        >
          {cvName ? <Check className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
          {cvName ? "CV Uploaded" : "Upload CV"}
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Candidate Profile
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="relative p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-center space-y-3">
            {/* ✅ 파일 삭제용 X 버튼 추가 */}
            {cvName && (
              <button 
                onClick={handleRemoveFile}
                className="absolute top-2 right-2 p-1 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 transition-colors shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            <input type="file" ref={fileRef} onChange={handleFileUpload} accept=".pdf,.txt" className="hidden" />
            <div className="mx-auto w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-primary">
              {isParsing ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileUp className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 truncate px-4">{cvName || "Upload your CV"}</p>
              <p className="text-xs text-slate-500 mt-1">PDF or TXT (Max 5MB)</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={isParsing || !!cvName} className="bg-white rounded-lg px-4 shadow-none border-slate-200">
              {isParsing ? "AI Analyzing..." : cvName ? "File Selected" : "Select File"}
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Target Roles</label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
                <button key={role} className={cn("filter-chip text-[11px]", draft.targetRoles.includes(role) && "active")} onClick={() => onUpdate({ targetRoles: draft.targetRoles.includes(role) ? draft.targetRoles.filter(r => r !== role) : [...draft.targetRoles, role] })}> {role} </button>
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
              {dbRegions.map((region) => (
                <button key={region.key} className={cn("filter-chip text-[11px]", draft.preferredRegions.includes(region.key) && "active")} onClick={() => onUpdate({ preferredRegions: draft.preferredRegions.includes(region.key) ? draft.preferredRegions.filter(r => r !== region.key) : [...draft.preferredRegions, region.key] })}> <span className="mr-1">●</span> {region.name} </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Experience Level</label>
            <div className="flex gap-2">
              {EXP_LEVELS.map((lvl) => (
                <button key={lvl.value} className={cn("filter-chip text-[11px] px-4", draft.experienceLevel === lvl.value && "active")} onClick={() => onUpdate({ experienceLevel: lvl.value })}> {lvl.label} </button>
              ))}
            </div>
          </div>

          <Button className="w-full gap-2 mt-4 bg-[#5C59E8] hover:bg-[#4A47D1] rounded-xl h-12 shadow-none" disabled={!isDirty && !justSaved} onClick={() => { onSave(); setJustSaved(true); setTimeout(() => setJustSaved(false), 2000); }}>
            {justSaved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> {isDirty ? "Save Profile" : "No changes"}</>}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}