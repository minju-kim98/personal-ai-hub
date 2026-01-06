import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Languages, Loader2, Copy, Upload, Mail, FileText } from "lucide-react";
import { aiApi } from "../../../services/api";

type TranslationType = "text" | "srt" | "email";

const languages = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
];

export function Translate() {
  const [type, setType] = useState<TranslationType>("text");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [inputText, setInputText] = useState("");
  const [context, setContext] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState("");

  const handleTranslate = async () => {
    if (type === "email" && (!context || !keyPoints)) {
      alert("상황과 핵심 내용을 입력해주세요.");
      return;
    }
    if (type !== "email" && !inputText) {
      alert("번역할 내용을 입력해주세요.");
      return;
    }

    setIsTranslating(true);
    setResult("");

    try {
      let response;

      if (type === "email") {
        response = await aiApi.writeEmail({
          target_language: targetLanguage,
          context,
          key_points: keyPoints,
        });
      } else if (type === "srt") {
        // For SRT, we'd typically use file upload
        // For now, treat as text translation
        response = await aiApi.translateText({
          translation_type: "srt",
          target_language: targetLanguage,
          content: inputText,
        });
      } else {
        response = await aiApi.translateText({
          translation_type: "text",
          target_language: targetLanguage,
          content: inputText,
        });
      }

      setResult(response.data.result || response.data.content || response.data.translated_text);
    } catch (error: any) {
      console.error("Translation failed:", error);
      alert(error.response?.data?.detail || "처리에 실패했습니다.");
    } finally {
      setIsTranslating(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    alert("복사되었습니다!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
          <Languages className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">다국어 AI</h1>
          <p className="text-muted-foreground text-sm">
            번역, 자막 처리, 이메일 작성 등 다국어 관련 작업을 처리합니다
          </p>
        </div>
      </div>

      {/* Type Selection */}
      <div className="flex gap-2">
        <Button
          variant={type === "text" ? "default" : "outline"}
          onClick={() => setType("text")}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          텍스트 번역
        </Button>
        <Button
          variant={type === "srt" ? "default" : "outline"}
          onClick={() => setType("srt")}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          자막 번역
        </Button>
        <Button
          variant={type === "email" ? "default" : "outline"}
          onClick={() => setType("email")}
          className="gap-2"
        >
          <Mail className="h-4 w-4" />
          이메일 작성
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {type === "email" ? "이메일 작성" : "입력"}
            </CardTitle>
            <CardDescription>
              {type === "email"
                ? "상황과 핵심 내용을 입력하면 적절한 톤의 이메일을 작성합니다"
                : type === "srt"
                ? "SRT 자막 파일 내용을 붙여넣거나 업로드하세요"
                : "번역할 텍스트를 입력하세요"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">목표 언어</label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full px-4 py-2.5 border border-border/50 rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                disabled={isTranslating}
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {type === "email" ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">상황 설명</label>
                  <textarea
                    placeholder="예: 프로젝트 진행 상황을 팀원들에게 공유하는 이메일"
                    className="w-full h-24 px-4 py-3 border border-border/50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-background"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    disabled={isTranslating}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">전달할 핵심 내용</label>
                  <textarea
                    placeholder="전달하고 싶은 내용을 간단히 작성하세요"
                    className="w-full h-32 px-4 py-3 border border-border/50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-background"
                    value={keyPoints}
                    onChange={(e) => setKeyPoints(e.target.value)}
                    disabled={isTranslating}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {type === "srt" ? "자막 내용" : "원문"}
                </label>
                <textarea
                  placeholder={
                    type === "srt"
                      ? "SRT 형식의 자막을 붙여넣으세요"
                      : "번역할 텍스트를 입력하세요"
                  }
                  className="w-full h-48 px-4 py-3 border border-border/50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-background font-mono"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isTranslating}
                />
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleTranslate}
              disabled={isTranslating}
            >
              {isTranslating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : type === "email" ? (
                "이메일 작성"
              ) : (
                "번역"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>결과</CardTitle>
              {result && (
                <Button variant="outline" size="sm" onClick={copyResult}>
                  <Copy className="h-3 w-3 mr-1" />
                  복사
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="bg-secondary/50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {result}
                </pre>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-24">
                <Languages className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>내용을 입력하고</p>
                <p>번역/작성을 시작하세요</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
