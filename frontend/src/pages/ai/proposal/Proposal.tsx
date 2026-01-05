import { useState } from "react";
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
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!idea) {
      alert("아이디어를 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    setResult(null);

    // Simulate progress through steps
    for (let i = 0; i < progressSteps.length; i++) {
      setCurrentStep(i);
      await new Promise((resolve) =>
        setTimeout(resolve, 2000 + Math.random() * 2000)
      );
    }

    setResult(`# ${idea} 기획서

## 1. Executive Summary
본 기획서는 ${idea}에 대한 상세한 사업 계획을 담고 있습니다...

## 2. 시장 분석
### 2.1 시장 규모 및 성장성
- 국내 시장 규모: 약 1조원 (연평균 15% 성장)
- 글로벌 시장 규모: 약 100조원

### 2.2 타겟 고객
- 주 타겟: 20-40대 직장인
- 부 타겟: 대학생, 프리랜서

### 2.3 경쟁사 분석
| 경쟁사 | 강점 | 약점 |
|-------|-----|-----|
| A사 | 브랜드 인지도 | 높은 가격 |
| B사 | 기술력 | 사용성 |

## 3. 법률 및 규제
### 3.1 관련 법령
- 개인정보보호법
- 전자상거래법

## 4. 기술 설계
### 4.1 기술 스택
- Frontend: React, TypeScript
- Backend: FastAPI, PostgreSQL
- AI: LangChain, LangGraph

### 4.2 시스템 아키텍처
[아키텍처 다이어그램]

## 5. MVP 계획
### 5.1 MVP 기능 범위
1. 핵심 기능 A
2. 핵심 기능 B
3. 핵심 기능 C

### 5.2 마일스톤
- Phase 1: 기본 기능 구현
- Phase 2: 베타 테스트
- Phase 3: 정식 출시

## 6. 리스크 분석
| 리스크 | 영향도 | 대응 방안 |
|-------|-------|---------|
| 기술적 리스크 | 중 | 검증된 기술 활용 |
| 시장 리스크 | 상 | MVP 빠른 검증 |
`);

    setIsGenerating(false);
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
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-yellow-500 flex items-center justify-center">
          <Lightbulb className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">기획서 AI</h1>
          <p className="text-muted-foreground">
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
                className="w-full h-32 px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
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
