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
  Map,
  Loader2,
  CheckCircle2,
  MapPin,
  Calendar,
  DollarSign,
  CheckSquare,
} from "lucide-react";
import { cn } from "../../../lib/utils";

const interests = [
  { value: "food", label: "맛집" },
  { value: "cafe", label: "카페" },
  { value: "nature", label: "자연" },
  { value: "culture", label: "문화" },
  { value: "shopping", label: "쇼핑" },
  { value: "activity", label: "액티비티" },
];

export function Travel() {
  const [travelType, setTravelType] = useState<"travel" | "date">("travel");
  const [destination, setDestination] = useState("");
  const [departure, setDeparture] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState("");
  const [companions, setCompanions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    timeline: any[];
    budget: any;
    checklist: string[];
  } | null>(null);

  const toggleInterest = (value: string) => {
    setSelectedInterests((prev) =>
      prev.includes(value)
        ? prev.filter((i) => i !== value)
        : [...prev, value]
    );
  };

  const handleGenerate = async () => {
    if (!destination || !startDate || !endDate) {
      alert("목적지와 날짜를 입력해주세요.");
      return;
    }

    setIsGenerating(true);

    await new Promise((resolve) => setTimeout(resolve, 4000));

    setResult({
      timeline: [
        {
          date: startDate,
          title: "Day 1",
          schedule: [
            { time: "09:00", activity: "출발", place: departure || "서울", duration: "2시간 30분" },
            { time: "11:30", activity: "점심", place: "초당순두부마을", duration: "1시간" },
            { time: "13:00", activity: "관광", place: "경포해변", duration: "2시간" },
            { time: "15:30", activity: "카페", place: "테라로사", duration: "1시간" },
            { time: "17:00", activity: "체크인", place: "숙소", duration: "" },
            { time: "19:00", activity: "저녁", place: "동화가든", duration: "1시간 30분" },
          ],
        },
      ],
      budget: {
        transportation: { description: "교통비", amount: 60000 },
        accommodation: { description: "숙박비", amount: 150000 },
        food: { description: "식비", amount: 100000 },
        activities: { description: "관람/체험비", amount: 30000 },
        total: 340000,
      },
      checklist: [
        "신분증",
        "충전기",
        "보조배터리",
        "여벌 옷",
        "세면도구",
        "상비약",
        "현금",
        "카메라",
      ],
    });

    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-cyan-500 flex items-center justify-center">
          <Map className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">여행/데이트 코스 AI</h1>
          <p className="text-muted-foreground">
            맞춤형 여행/데이트 코스와 일정을 계획합니다
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>여행 정보</CardTitle>
            <CardDescription>여행 조건을 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={travelType === "travel" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTravelType("travel")}
              >
                여행
              </Button>
              <Button
                variant={travelType === "date" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTravelType("date")}
              >
                데이트
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">목적지</label>
              <Input
                placeholder="예: 강릉, 제주도, 부산"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">출발지</label>
              <Input
                placeholder="예: 서울"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">시작일</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">종료일</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">관심사</label>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <Button
                    key={interest.value}
                    variant={
                      selectedInterests.includes(interest.value)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => toggleInterest(interest.value)}
                    disabled={isGenerating}
                  >
                    {interest.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">예산 (선택)</label>
              <Input
                placeholder="예: 30만원, 50만원"
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">동행 (선택)</label>
              <Input
                placeholder="예: 커플, 친구 4명, 가족"
                value={companions}
                onChange={(e) => setCompanions(e.target.value)}
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
                "코스 생성"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Section */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <>
              {/* Timeline */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <CardTitle>일정</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {result.timeline.map((day, i) => (
                    <div key={i} className="space-y-3">
                      <h4 className="font-semibold">{day.title}</h4>
                      <div className="space-y-2">
                        {day.schedule.map((item: any, j: number) => (
                          <div
                            key={j}
                            className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg"
                          >
                            <span className="text-sm font-medium w-14">
                              {item.time}
                            </span>
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-medium">{item.activity}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.place}
                                {item.duration && ` · ${item.duration}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Budget */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <CardTitle>예산</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(result.budget)
                      .filter(([key]) => key !== "total")
                      .map(([key, value]: any) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">
                            {value.description}
                          </span>
                          <span>
                            {value.amount.toLocaleString()}원
                          </span>
                        </div>
                      ))}
                    <div className="flex justify-between pt-2 border-t font-semibold">
                      <span>총 예산</span>
                      <span>{result.budget.total.toLocaleString()}원</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Checklist */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-primary" />
                    <CardTitle>준비물</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {result.checklist.map((item, i) => (
                      <label
                        key={i}
                        className="flex items-center gap-2 p-2 bg-secondary/50 rounded cursor-pointer hover:bg-secondary"
                      >
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-sm">{item}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-24">
                <div className="text-center text-muted-foreground">
                  <Map className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">여행 정보를 입력하고</p>
                  <p className="text-lg">코스 생성을 시작하세요</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
