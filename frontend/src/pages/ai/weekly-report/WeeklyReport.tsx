import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  FileBarChart,
  Loader2,
  CheckCircle2,
  Copy,
  Upload,
  FileText,
  X,
  FolderOpen,
} from "lucide-react";
import { aiApi, documentApi } from "../../../services/api";
import type { Document } from "../../../types";

type PreferenceSource = "text" | "file" | "document";

export function WeeklyReport() {
  const [tasksCompleted, setTasksCompleted] = useState("");
  const [nextWeekPlan, setNextWeekPlan] = useState("");
  const [bossPreferences, setBossPreferences] = useState("");
  const [preferenceSource, setPreferenceSource] = useState<PreferenceSource>("text");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Fetch MD documents from library
  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);
    try {
      const response = await documentApi.list({ category: "misc" });
      const allDocs = response.data.items || response.data || [];
      // Filter for MD files
      const mdDocs = allDocs.filter((doc: Document) =>
        doc.original_file_name?.toLowerCase().endsWith(".md") ||
        doc.original_file_name?.toLowerCase().endsWith(".txt")
      );
      setDocuments(mdDocs);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".md") && !file.name.toLowerCase().endsWith(".txt")) {
      alert("MD 또는 TXT 파일만 업로드 가능합니다.");
      return;
    }

    try {
      const content = await file.text();
      setBossPreferences(content);
      setUploadedFileName(file.name);
      setPreferenceSource("file");
    } catch (error) {
      console.error("Failed to read file:", error);
      alert("파일을 읽는데 실패했습니다.");
    }
  };

  // Handle document selection
  const handleDocumentSelect = async (docId: string) => {
    if (!docId) {
      setSelectedDocumentId("");
      setBossPreferences("");
      return;
    }

    setSelectedDocumentId(docId);
    try {
      const response = await documentApi.download(docId);
      const content = await response.data.text();
      setBossPreferences(content);
      setPreferenceSource("document");
    } catch (error) {
      console.error("Failed to load document:", error);
      alert("문서를 불러오는데 실패했습니다.");
    }
  };

  // Clear preference
  const clearPreference = () => {
    setBossPreferences("");
    setUploadedFileName(null);
    setSelectedDocumentId("");
    setPreferenceSource("text");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!tasksCompleted) {
      alert("이번 주 수행 업무를 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const response = await aiApi.createWeeklyReport({
        tasks_completed: tasksCompleted,
        next_week_plan: nextWeekPlan || undefined,
        boss_preferences: bossPreferences || undefined,
      });

      setResult(response.data.result || response.data.content);
    } catch (error: any) {
      console.error("Failed to create weekly report:", error);
      alert(error.response?.data?.detail || "주간보고서 생성에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      alert("복사되었습니다!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <FileBarChart className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">주간보고 AI</h1>
          <p className="text-muted-foreground text-sm">
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
                className="w-full h-40 px-4 py-3 border border-border/50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-background"
                value={tasksCompleted}
                onChange={(e) => setTasksCompleted(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">다음 주 계획 (선택)</label>
              <textarea
                placeholder="다음 주에 예정된 업무를 작성하세요"
                className="w-full h-24 px-4 py-3 border border-border/50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-background"
                value={nextWeekPlan}
                onChange={(e) => setNextWeekPlan(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">상사 성향 (선택)</label>

              {/* Source selection tabs */}
              <div className="flex gap-1 p-1 bg-secondary rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    clearPreference();
                    setPreferenceSource("text");
                  }}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-colors ${
                    preferenceSource === "text"
                      ? "bg-background shadow-sm"
                      : "hover:bg-background/50"
                  }`}
                  disabled={isGenerating}
                >
                  직접 입력
                </button>
                <button
                  type="button"
                  onClick={() => setPreferenceSource("file")}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-colors ${
                    preferenceSource === "file"
                      ? "bg-background shadow-sm"
                      : "hover:bg-background/50"
                  }`}
                  disabled={isGenerating}
                >
                  파일 업로드
                </button>
                <button
                  type="button"
                  onClick={() => setPreferenceSource("document")}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-colors ${
                    preferenceSource === "document"
                      ? "bg-background shadow-sm"
                      : "hover:bg-background/50"
                  }`}
                  disabled={isGenerating}
                >
                  문서함
                </button>
              </div>

              {/* Text input */}
              {preferenceSource === "text" && (
                <Input
                  placeholder="예: 수치 중심, 간결한 표현 선호"
                  value={bossPreferences}
                  onChange={(e) => setBossPreferences(e.target.value)}
                  disabled={isGenerating}
                />
              )}

              {/* File upload */}
              {preferenceSource === "file" && (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".md,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isGenerating}
                  />
                  {uploadedFileName ? (
                    <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="flex-1 text-sm truncate">{uploadedFileName}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={clearPreference}
                        disabled={isGenerating}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isGenerating}
                    >
                      <Upload className="h-4 w-4" />
                      MD/TXT 파일 업로드
                    </Button>
                  )}
                </div>
              )}

              {/* Document selection */}
              {preferenceSource === "document" && (
                <div className="space-y-2">
                  {isLoadingDocuments ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>문서함에 MD/TXT 파일이 없습니다</p>
                      <p className="text-xs">문서함에서 먼저 파일을 업로드하세요</p>
                    </div>
                  ) : (
                    <select
                      value={selectedDocumentId}
                      onChange={(e) => handleDocumentSelect(e.target.value)}
                      className="w-full px-4 py-2.5 border border-border/50 rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      disabled={isGenerating}
                    >
                      <option value="">문서 선택...</option>
                      {documents.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.title || doc.original_file_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Preview of loaded content */}
              {(preferenceSource === "file" || preferenceSource === "document") && bossPreferences && (
                <div className="mt-2 p-3 bg-secondary/30 rounded-lg max-h-32 overflow-auto">
                  <p className="text-xs text-muted-foreground mb-1">미리보기:</p>
                  <pre className="text-xs whitespace-pre-wrap">{bossPreferences.slice(0, 500)}{bossPreferences.length > 500 ? "..." : ""}</pre>
                </div>
              )}
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
