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
import {
  TrendingUp,
  Newspaper,
  PieChart,
  Settings,
  Plus,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "../../../lib/utils";

// Mock data
const mockNews = [
  {
    id: "1",
    title: "OpenAI, GPT-5.2 출시... 성능 30% 향상",
    source: "TechCrunch",
    category: "ai",
    sentiment: "positive",
    summary: "OpenAI가 새로운 GPT-5.2 모델을 발표했습니다. 이전 버전 대비 추론 능력이 30% 향상되었습니다.",
    published_at: "2026-01-06T08:00:00Z",
  },
  {
    id: "2",
    title: "클라우드 시장, 2026년 1조 달러 돌파 전망",
    source: "Bloomberg",
    category: "cloud",
    sentiment: "positive",
    summary: "글로벌 클라우드 컴퓨팅 시장이 올해 1조 달러를 돌파할 것으로 예상됩니다.",
    published_at: "2026-01-06T07:30:00Z",
  },
  {
    id: "3",
    title: "사이버 보안 위협 증가, 기업들 대응 강화",
    source: "SecurityWeek",
    category: "security",
    sentiment: "negative",
    summary: "랜섬웨어 공격이 전년 대비 40% 증가하면서 기업들이 보안 투자를 늘리고 있습니다.",
    published_at: "2026-01-06T06:00:00Z",
  },
];

const mockStocks = [
  { symbol: "AAPL", name: "Apple Inc.", change: "+2.3%" },
  { symbol: "GOOGL", name: "Alphabet Inc.", change: "+1.8%" },
  { symbol: "MSFT", name: "Microsoft Corp.", change: "-0.5%" },
];

type Tab = "news" | "expenses" | "settings";

export function Economy() {
  const [activeTab, setActiveTab] = useState<Tab>("news");
  const [newsCategory, setNewsCategory] = useState("all");
  const [newStock, setNewStock] = useState("");
  const [stocks, setStocks] = useState(mockStocks);

  const addStock = () => {
    if (newStock) {
      setStocks([...stocks, { symbol: newStock.toUpperCase(), name: "", change: "0%" }]);
      setNewStock("");
    }
  };

  const removeStock = (symbol: string) => {
    setStocks(stocks.filter((s) => s.symbol !== symbol));
  };

  const filteredNews =
    newsCategory === "all"
      ? mockNews
      : mockNews.filter((n) => n.category === newsCategory);

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

            {filteredNews.map((news) => (
              <Card key={news.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{news.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {news.source} ·{" "}
                        {new Date(news.published_at).toLocaleDateString("ko-KR")}
                      </CardDescription>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-xs",
                        news.sentiment === "positive"
                          ? "bg-green-100 text-green-700"
                          : news.sentiment === "negative"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {news.sentiment === "positive"
                        ? "긍정"
                        : news.sentiment === "negative"
                        ? "부정"
                        : "중립"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{news.summary}</p>
                  <Button variant="link" size="sm" className="px-0 mt-2">
                    자세히 보기 <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
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
                {stocks.map((stock) => (
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
                          stock.change.startsWith("+")
                            ? "text-green-600"
                            : stock.change.startsWith("-")
                            ? "text-red-600"
                            : ""
                        )}
                      >
                        {stock.change}
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
                ))}
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
                  매일 오전 6:30에 발송
                </p>
              </div>
              <input type="checkbox" className="h-5 w-5" defaultChecked />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">발송 시간</label>
              <Input type="time" defaultValue="06:30" />
            </div>
            <Button>설정 저장</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
