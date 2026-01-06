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
import { PenTool, Loader2, CheckCircle2, Copy } from "lucide-react";
import { aiApi, documentApi } from "../../../services/api";
import type { Document } from "../../../types";

export function CoverLetter() {
  const [companyName, setCompanyName] = useState("");
  const [jobPosting, setJobPosting] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [progress, setProgress] = useState<{
    step: string;
    iteration?: number;
    score?: number;
  } | null>(null);

  // Fetch user's documents (resumes, portfolios)
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await documentApi.list({ category: "resume" });
        const resumes = response.data.items || response.data || [];
        const portfolioResponse = await documentApi.list({ category: "portfolio" });
        const portfolios = portfolioResponse.data.items || portfolioResponse.data || [];
        setDocuments([...resumes, ...portfolios]);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      }
    };
    fetchDocuments();
  }, []);

  // Poll for status updates
  const pollStatus = useCallback(async (sid: string) => {
    try {
      const response = await aiApi.getCoverLetterStatus(sid);
      const { status, current_step, iteration, similarity_score } = response.data;

      setProgress({
        step: current_step || "처리 중...",
        iteration,
        score: similarity_score,
      });

      if (status === "completed") {
        const resultResponse = await aiApi.getCoverLetterResult(sid);
        setResult(resultResponse.data.result);
        setProgress(null);
        setIsGenerating(false);
        setSessionId(null);
      } else if (status === "failed") {
        alert("자기소개서 생성에 실패했습니다.");
        setProgress(null);
        setIsGenerating(false);
        setSessionId(null);
      } else {
        // Continue polling
        setTimeout(() => pollStatus(sid), 2000);
      }
    } catch (error) {
      console.error("Failed to poll status:", error);
      setProgress(null);
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      pollStatus(sessionId);
    }
  }, [sessionId, pollStatus]);

  const handleGenerate = async () => {
    if (!companyName || !jobPosting) {
      alert("회사명과 채용 공고를 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setProgress({ step: "요청 전송 중..." });

    try {
      const response = await aiApi.createCoverLetter({
        company_name: companyName,
        job_posting: jobPosting,
        document_ids: selectedDocuments.length > 0 ? selectedDocuments : undefined,
        additional_instructions: additionalInstructions || undefined,
      });

      setSessionId(response.data.session_id);
    } catch (error: any) {
      console.error("Failed to create cover letter:", error);
      alert(error.response?.data?.detail || "자기소개서 생성에 실패했습니다.");
      setProgress(null);
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("복사되었습니다!");
  };

  const toggleDocument = (docId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
          <PenTool className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">자기소개서 AI</h1>
          <p className="text-muted-foreground text-sm">
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
                className="w-full h-48 px-4 py-3 border border-border/50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-background"
                value={jobPosting}
                onChange={(e) => setJobPosting(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            {documents.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">참고 문서 선택</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {documents.map((doc) => (
                    <label
                      key={doc.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-secondary cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={() => toggleDocument(doc.id)}
                        disabled={isGenerating}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{doc.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

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
