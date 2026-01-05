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
import { PenTool, Loader2, CheckCircle2, Copy } from "lucide-react";
import { cn } from "../../../lib/utils";

export function CoverLetter() {
  const [companyName, setCompanyName] = useState("");
  const [jobPosting, setJobPosting] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [progress, setProgress] = useState<{
    step: string;
    iteration?: number;
    score?: number;
  } | null>(null);

  const handleGenerate = async () => {
    if (!companyName || !jobPosting) {
      alert("회사명과 채용 공고를 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    setProgress({ step: "문서 수집 중..." });

    // Simulate progress
    const steps = [
      { step: "문서 수집 중...", delay: 1000 },
      { step: "회사 정보 조사 중...", delay: 2000 },
      { step: "채용 공고 분석 중...", delay: 1500 },
      { step: "자기소개서 초안 작성 중...", delay: 3000 },
      { step: "동일인물 비교 중...", iteration: 1, score: 65, delay: 2000 },
      { step: "피드백 반영 수정 중...", iteration: 2, delay: 2000 },
      { step: "동일인물 비교 중...", iteration: 2, score: 78, delay: 1500 },
      { step: "피드백 반영 수정 중...", iteration: 3, delay: 2000 },
      { step: "동일인물 비교 중...", iteration: 3, score: 87, delay: 1500 },
    ];

    for (const step of steps) {
      setProgress(step);
      await new Promise((resolve) => setTimeout(resolve, step.delay));
    }

    // Mock result
    setResult({
      "1. 지원 동기":
        "저는 " +
        companyName +
        "의 혁신적인 비전과 기술력에 깊은 감명을 받아 지원하게 되었습니다...",
      "2. 직무 관련 경험":
        "지난 3년간 소프트웨어 개발 분야에서 다양한 프로젝트를 수행하며 실무 역량을 쌓아왔습니다...",
      "3. 입사 후 포부":
        "입사 후에는 " +
        companyName +
        "의 핵심 인재로 성장하여 회사의 발전에 기여하고자 합니다...",
    });

    setProgress(null);
    setIsGenerating(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("복사되었습니다!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
          <PenTool className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">자기소개서 AI</h1>
          <p className="text-muted-foreground">
            이력서와 포트폴리오를 기반으로 맞춤형 자기소개서를 작성합니다
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>입력 정보</CardTitle>
            <CardDescription>
              지원할 회사와 채용 공고 정보를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">회사명</label>
              <Input
                placeholder="예: 카카오, 네이버, 삼성전자"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">채용 공고</label>
              <textarea
                placeholder="채용 공고 내용을 붙여넣거나 URL을 입력하세요"
                className="w-full h-48 px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                value={jobPosting}
                onChange={(e) => setJobPosting(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">추가 지시사항 (선택)</label>
              <Input
                placeholder="예: 기술적인 부분을 강조해주세요"
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
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
                "자기소개서 생성"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Section */}
        <div className="space-y-4">
          {/* Progress */}
          {progress && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="font-medium">{progress.step}</p>
                    {progress.iteration && (
                      <p className="text-sm text-muted-foreground">
                        반복 {progress.iteration}회
                        {progress.score && ` | 유사도: ${progress.score}%`}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result */}
          {result && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <CardTitle>생성 완료</CardTitle>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    유사도: 87%
                  </span>
                </div>
                <CardDescription>
                  {companyName} 지원용 자기소개서
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(result).map(([question, answer]) => (
                  <div key={question} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{question}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(answer)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        복사
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-secondary/50 p-4 rounded-lg">
                      {answer}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {!progress && !result && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-12">
                  <PenTool className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>회사 정보와 채용 공고를 입력하고</p>
                  <p>자기소개서 생성을 시작하세요</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
