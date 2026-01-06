import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Lightbulb, Loader2, CheckCircle2, Download } from "lucide-react";
import { aiApi } from "../../../services/api";

const progressSteps = [
  "리서치 계획 수립 중...",
  "시장 조사 진행 중...",
  "법률/규제 조사 진행 중...",
  "기술 조사 진행 중...",
  "기획서 작성 중...",
];

export function Proposal() {
  const [idea, setIdea] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  // Poll for status updates
  const pollStatus = useCallback(async (sid: string) => {
    try {
      const response = await aiApi.getProposalStatus(sid);
      const { status, current_step } = response.data;

      // Map step to index
      const stepIndex = progressSteps.findIndex(step =>
        current_step?.includes(step.replace("...", ""))
      );
      if (stepIndex >= 0) setCurrentStep(stepIndex);

      if (status === "completed") {
        const resultResponse = await aiApi.getProposalResult(sid);
        setResult(resultResponse.data.result || resultResponse.data.content);
        setIsGenerating(false);
        setSessionId(null);
      } else if (status === "failed") {
        alert("기획서 생성에 실패했습니다.");
        setIsGenerating(false);
        setSessionId(null);
      } else {
        setTimeout(() => pollStatus(sid), 3000);
      }
    } catch (error) {
      console.error("Failed to poll status:", error);
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      pollStatus(sessionId);
    }
  }, [sessionId, pollStatus]);

  const handleGenerate = async () => {
    if (!idea) {
      alert("아이디어를 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setCurrentStep(0);

    try {
      const response = await aiApi.createProposal({
        idea,
        target_market: targetMarket || undefined,
        budget_range: budgetRange || undefined,
        special_requirements: specialRequirements || undefined,
      });

      setSessionId(response.data.session_id);
    } catch (error: any) {
      console.error("Failed to create proposal:", error);
      alert(error.response?.data?.detail || "기획서 생성에 실패했습니다.");
      setIsGenerating(false);
    }
  };

  const downloadMarkdown = () => {
    if (!result) return;

    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${idea}_기획서.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
          <Lightbulb className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">기획서 AI</h1>
          <p className="text-muted-foreground text-sm">
            Deep Research 기반으로 상세한 기획서를 작성합니다
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>아이디어 입력</CardTitle>
            <CardDescription>
              구현하고 싶은 아이디어를 설명해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">아이디어</label>
              <textarea
                placeholder="아이디어를 자세히 설명해주세요"
                className="w-full h-32 px-4 py-3 border border-border/50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-background"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">타겟 시장 (선택)</label>
              <Input
                placeholder="예: B2B SaaS, 20-30대 직장인"
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">예산 규모 (선택)</label>
              <Input
                placeholder="예: 1억 이내, 5천만원"
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">특별 요구사항 (선택)</label>
              <Input
                placeholder="예: AI 기능 필수, 모바일 우선"
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                "기획서 생성"
              )}
            </Button>

            {/* Progress */}
            {isGenerating && (
              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium">진행 상황</p>
                {progressSteps.map((step, index) => (
                  <div
                    key={step}
                    className={`flex items-center gap-2 text-sm ${
                      index <= currentStep
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : index === currentStep ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border" />
                    )}
                    {step}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Result Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            {result ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <CardTitle>기획서 완성</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={downloadMarkdown}>
                  <Download className="h-3 w-3 mr-1" />
                  다운로드
                </Button>
              </div>
            ) : (
              <CardTitle>결과</CardTitle>
            )}
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="prose prose-sm max-w-none bg-secondary/50 p-6 rounded-lg overflow-auto max-h-[600px]">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {result}
                </pre>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-24">
                <Lightbulb className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">아이디어를 입력하고</p>
                <p className="text-lg">기획서 생성을 시작하세요</p>
                <p className="text-sm mt-4">
                  Deep Research를 통해 시장, 법률, 기술 조사가 진행됩니다
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
