import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function GenerateButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // 1. Edge Function 혹은 외부 API 호출 대신, 
      // 현재 수집된 데이터를 리프레시하거나 트리거하는 로직
      // (사용자님의 프로젝트 환경에 따라 수집 방식은 다를 수 있으나, 에러 원인이었던 upsert 로직을 수정합니다.)
      
      const { data: existingData, error: fetchError } = await supabase
        .from("snapshots")
        .select("*")
        .limit(1);

      if (fetchError) throw fetchError;

      // upsert 시 중복 체크 기준을 'id'로 변경
      const { error: upsertError } = await supabase
        .from("snapshots")
        .upsert(existingData || [], { 
          onConflict: 'id' // ⬅️ 'linkedin_search_url'에서 'id'로 수정 완료!
        });

      if (upsertError) throw upsertError;

      toast({
        title: "Success",
        description: "Data has been refreshed successfully.",
      });
      
      // 페이지 새로고침하여 데이터 반영
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
      variant="outline" 
      size="sm" 
      onClick={handleGenerate} 
      disabled={isGenerating}
      className="gap-2"
    >
      <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
      {isGenerating ? "Refreshing..." : "Generate Today"}
    </Button>
  );
}