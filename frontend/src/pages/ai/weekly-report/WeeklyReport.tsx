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
import { FileBarChart, Loader2, CheckCircle2, Copy } from "lucide-react";

export function WeeklyReport() {
  const [tasksCompleted, setTasksCompleted] = useState("");
  const [nextWeekPlan, setNextWeekPlan] = useState("");
  const [bossPreferences, setBossPreferences] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!tasksCompleted) {
      alert("이번 주 수행 업무를 입력해주세요.");
      return;
    }

    setIsGenerating(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setResult(`# 주간업무보고 (2026.01.06 ~ 01.10)

## 1. 금주 수행 업무

### 프로젝트 A
| 구분 | 내용 | 진행률 |
|-----|------|-------|
| 완료 | API 설계 및 문서화 | 100% |
| 진행중 | 프론트엔드 UI 개발 | 70% |

### 프로젝트 B
- (완료) 데이터베이스 마이그레이션
- (진행중) 성능 테스트 및 최적화

## 2. 이슈 및 해결

| 이슈 | 원인 | 해결방안 | 상태 |
|-----|-----|---------|-----|
| 서버 지연 | DB 쿼리 비효율 | 인덱스 추가 | 완료 |

## 3. 차주 계획
1. 프로젝트 A 프론트엔드 완료
2. 프로젝트 B 성능 최적화 마무리
3. 신규 기능 기획 미팅 참석`);

    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      alert("복사되었습니다!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
          <FileBarChart className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">주간보고 AI</h1>
          <p className="text-muted-foreground">
            기존 보고서 스타일을 학습하여 구조화된 주간보고서를 생성합니다
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>입력 정보</CardTitle>
            <CardDescription>
              이번 주 업무 내용과 다음 주 계획을 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">이번 주 수행 업무</label>
              <textarea
                placeholder="이번 주에 수행한 업무를 자유롭게 작성하세요"
                className="w-full h-40 px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                value={tasksCompleted}
                onChange={(e) => setTasksCompleted(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">다음 주 계획 (선택)</label>
              <textarea
                placeholder="다음 주에 예정된 업무를 작성하세요"
                className="w-full h-24 px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                value={nextWeekPlan}
                onChange={(e) => setNextWeekPlan(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">상사 성향 (선택)</label>
              <Input
                placeholder="예: 수치 중심, 간결한 표현 선호"
                value={bossPreferences}
                onChange={(e) => setBossPreferences(e.target.value)}
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
                "주간보고서 생성"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Section */}
        <Card>
          <CardHeader>
            {result ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <CardTitle>생성 완료</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-3 w-3 mr-1" />
                  복사
                </Button>
              </div>
            ) : (
              <CardTitle>결과</CardTitle>
            )}
            <CardDescription>
              PPT에 바로 붙여넣기 가능한 마크다운 형식
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : result ? (
              <div className="prose prose-sm max-w-none bg-secondary/50 p-4 rounded-lg overflow-auto max-h-[500px]">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {result}
                </pre>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <FileBarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>업무 내용을 입력하고</p>
                <p>주간보고서 생성을 시작하세요</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
