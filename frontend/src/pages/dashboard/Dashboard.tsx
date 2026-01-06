import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  FolderOpen,
  PenTool,
  FileBarChart,
  Lightbulb,
  Languages,
  TrendingUp,
  Map,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAuthStore } from "../../stores/auth";
import { cn } from "../../lib/utils";

const aiFeatures = [
  {
    name: "자기소개서",
    description: "맞춤형 자기소개서 작성",
    icon: PenTool,
    href: "/ai/cover-letter",
    gradient: "from-blue-500 to-blue-600",
    bgLight: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    name: "주간보고",
    description: "구조화된 보고서 생성",
    icon: FileBarChart,
    href: "/ai/weekly-report",
    gradient: "from-emerald-500 to-emerald-600",
    bgLight: "bg-emerald-50",
    textColor: "text-emerald-600",
  },
  {
    name: "기획서",
    description: "Deep Research 기반 기획",
    icon: Lightbulb,
    href: "/ai/proposal",
    gradient: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50",
    textColor: "text-amber-600",
  },
  {
    name: "다국어",
    description: "번역 및 이메일 작성",
    icon: Languages,
    href: "/ai/translate",
    gradient: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50",
    textColor: "text-violet-600",
  },
  {
    name: "경제 이슈",
    description: "IT 뉴스 요약 및 재정 분석",
    icon: TrendingUp,
    href: "/ai/economy",
    gradient: "from-rose-500 to-red-600",
    bgLight: "bg-rose-50",
    textColor: "text-rose-600",
  },
  {
    name: "여행 코스",
    description: "맞춤형 여행 일정 계획",
    icon: Map,
    href: "/ai/travel",
    gradient: "from-cyan-500 to-teal-600",
    bgLight: "bg-cyan-50",
    textColor: "text-cyan-600",
  },
];

const stats = [
  {
    name: "문서함",
    value: "문서 관리",
    description: "이력서, 포트폴리오 업로드",
    icon: FolderOpen,
    href: "/documents",
  },
  {
    name: "AI 기능",
    value: "6개",
    description: "다양한 AI 자동화",
    icon: Sparkles,
  },
  {
    name: "개인화",
    value: "맞춤 서비스",
    description: "내 문서 기반 분석",
    icon: Zap,
  },
];

export function Dashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            안녕하세요, {user?.name}님
          </h1>
          <p className="text-muted-foreground mt-1">
            오늘도 AI와 함께 효율적인 하루 되세요
          </p>
        </div>
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <FolderOpen className="h-4 w-4" />
          문서함 열기
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.name}
            className={cn(
              "border-0 shadow-sm bg-card/80 backdrop-blur-sm",
              stat.href && "cursor-pointer hover:shadow-md transition-shadow"
            )}
          >
            {stat.href ? (
              <Link to={stat.href}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="font-medium">{stat.name}</CardDescription>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-xl">{stat.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Link>
            ) : (
              <>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="font-medium">{stat.name}</CardDescription>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-xl">{stat.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>

      {/* AI Features Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">AI 기능</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiFeatures.map((feature) => (
            <Link key={feature.name} to={feature.href}>
              <Card className="h-full border-0 shadow-sm bg-card/80 backdrop-blur-sm card-hover cursor-pointer group overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm", feature.gradient)}>
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{feature.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className={cn("inline-flex items-center text-sm font-medium transition-all group-hover:gap-2", feature.textColor)}>
                    시작하기
                    <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
