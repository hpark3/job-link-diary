import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Index.tsx에서 스타일을 주입받을 수 있도록 className props 추가
export function GenerateButton({ className }: { className?: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // ✅ [원문 로직 유지] 1. 현재 데이터 가져오기
      const { data: existingData, error: fetchError } = await supabase
        .from("snapshots")
        .select("*")
        .limit(1);

      if (fetchError) throw fetchError;

      // ✅ [원문 로직 유지] 2. upsert (id 기준 충돌 체크)
      const { error: upsertError } = await supabase
        .from("snapshots")
        .upsert(existingData || [], { 
          onConflict: 'id' 
        });

      if (upsertError) throw upsertError;

      toast({
        title: "Success",
        description: "Data has been refreshed successfully.",
      });
      
      // ✅ [원문 로직 유지] 3. 페이지 새로고침
      window.location.reload();

    } catch (error: any) {
      console.error("Generation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to refresh data.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={isGenerating}
      // ✅ 디자인: variant="outline"을 제거하고 타원형 블루 테마 적용
      className={cn(
        "gap-2 border px-4 h-auto py-2.5 transition-all font-medium rounded-full", // 타원형 캡슐
        "bg-white border-[#5F74DD] text-[#5F74DD] hover:bg-[#5F74DD] hover:text-white", // 블루 테마 및 호버 반전
        isGenerating && "opacity-50 cursor-not-allowed",
        className // 외부 주입 스타일 허용
      )}
    >
      <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
      {isGenerating ? "Refreshing..." : "Generate Today"}
    </Button>
  );
}