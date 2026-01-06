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
import {
  TrendingUp,
  Newspaper,
  PieChart,
  Settings,
  Plus,
  X,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { economyApi } from "../../../services/api";

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  category: string;
  sentiment: string;
  summary: string;
  published_at: string;
  url?: string;
}

interface Stock {
  symbol: string;
  name: string;
  change: string;
}

interface EconomySettings {
  email_enabled: boolean;
  email_time: string;
}

type Tab = "news" | "expenses" | "settings";

export function Economy() {
  const [activeTab, setActiveTab] = useState<Tab>("news");
  const [newsCategory, setNewsCategory] = useState("all");
  const [newStock, setNewStock] = useState("");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);
  const [settings, setSettings] = useState<EconomySettings>({
    email_enabled: true,
    email_time: "06:30",
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Fetch news
  const fetchNews = useCallback(async () => {
    setIsLoadingNews(true);
    try {
      const params = newsCategory !== "all" ? { category: newsCategory } : {};
      const response = await economyApi.listNews(params);
      setNews(response.data.items || response.data || []);
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setIsLoadingNews(false);
    }
  }, [newsCategory]);

  // Fetch stocks
  const fetchStocks = useCallback(async () => {
    setIsLoadingStocks(true);
    try {
      const response = await economyApi.listStocks();
      setStocks(response.data.items || response.data || []);
    } catch (error) {
      console.error("Failed to fetch stocks:", error);
    } finally {
      setIsLoadingStocks(false);
    }
  }, []);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const response = await economyApi.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    fetchStocks();
    fetchSettings();
  }, [fetchStocks, fetchSettings]);

  const addStock = async () => {
    if (!newStock) return;
    try {
      await economyApi.addStock(newStock.toUpperCase());
      await fetchStocks();
      setNewStock("");
    } catch (error) {
      console.error("Failed to add stock:", error);
      alert("종목 추가에 실패했습니다.");
    }
  };

  const removeStock = async (symbol: string) => {
    try {
      await economyApi.removeStock(symbol);
      await fetchStocks();
    } catch (error) {
      console.error("Failed to remove stock:", error);
      alert("종목 삭제에 실패했습니다.");
    }
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await economyApi.updateSettings(settings as unknown as Record<string, unknown>);
      alert("설정이 저장되었습니다.");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("설정 저장에 실패했습니다.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const filteredNews = news;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-red-500 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">경제 이슈 AI</h1>
          <p className="text-muted-foreground">
            IT 뉴스 요약과 개인 재정 분석을 제공합니다
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeTab === "news" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("news")}
          className="gap-2"
        >
          <Newspaper className="h-4 w-4" />
          뉴스
        </Button>
        <Button
          variant={activeTab === "expenses" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("expenses")}
          className="gap-2"
        >
          <PieChart className="h-4 w-4" />
          소비 분석
        </Button>
        <Button
          variant={activeTab === "settings" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("settings")}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          설정
        </Button>
      </div>

      {activeTab === "news" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* News List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2">
              {["all", "ai", "cloud", "security", "startup"].map((cat) => (
                <Button
                  key={cat}
                  variant={newsCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewsCategory(cat)}
                >
                  {cat === "all"
                    ? "전체"
                    : cat === "ai"
                    ? "AI"
                    : cat === "cloud"
                    ? "클라우드"
                    : cat === "security"
                    ? "보안"
                    : "스타트업"}
                </Button>
              ))}
            </div>

            {isLoadingNews ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredNews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>뉴스가 없습니다</p>
                </CardContent>
              </Card>
            ) : (
              filteredNews.map((article) => (
                <Card key={article.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{article.title}</CardTitle>
                        <CardDescription className="text-xs">
                          {article.source} ·{" "}
                          {new Date(article.published_at).toLocaleDateString("ko-KR")}
                        </CardDescription>
                      </div>
                      <span
                        className={cn(
                          "px-2 py-1 rounded text-xs",
                          article.sentiment === "positive"
                            ? "bg-green-100 text-green-700"
                            : article.sentiment === "negative"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {article.sentiment === "positive"
                          ? "긍정"
                          : article.sentiment === "negative"
                          ? "부정"
                          : "중립"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{article.summary}</p>
                    {article.url && (
                      <Button
                        variant="link"
                        size="sm"
                        className="px-0 mt-2"
                        onClick={() => window.open(article.url, "_blank")}
                      >
                        자세히 보기 <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Stocks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">관심 종목</CardTitle>
              <CardDescription>기술주 뉴스를 추적합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="종목 코드 (예: NVDA)"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                />
                <Button size="icon" onClick={addStock}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {isLoadingStocks ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : stocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    관심 종목을 추가하세요
                  </p>
                ) : (
                  stocks.map((stock) => (
                    <div
                      key={stock.symbol}
                      className="flex items-center justify-between p-2 bg-secondary/50 rounded"
                    >
                      <div>
                        <p className="font-medium text-sm">{stock.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {stock.name || "Loading..."}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            stock.change?.startsWith("+")
                              ? "text-green-600"
                              : stock.change?.startsWith("-")
                              ? "text-red-600"
                              : ""
                          )}
                        >
                          {stock.change || "0%"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeStock(stock.symbol)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "expenses" && (
        <Card>
          <CardHeader>
            <CardTitle>소비 분석</CardTitle>
            <CardDescription>
              소비 내역을 분석하고 인사이트를 제공합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>소비 내역을 추가하거나</p>
              <p>Google Sheets를 연동하세요</p>
              <Button variant="outline" className="mt-4">
                소비 내역 추가
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "settings" && (
        <Card>
          <CardHeader>
            <CardTitle>이메일 설정</CardTitle>
            <CardDescription>
              매일 아침 경제 브리핑을 이메일로 받아보세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">이메일 발송</p>
                <p className="text-sm text-muted-foreground">
                  매일 오전 {settings.email_time}에 발송
                </p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={settings.email_enabled}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    email_enabled: e.target.checked,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">발송 시간</label>
              <Input
                type="time"
                value={settings.email_time}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    email_time: e.target.value,
                  }))
                }
              />
            </div>
            <Button onClick={saveSettings} disabled={isSavingSettings}>
              {isSavingSettings ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                "설정 저장"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
