import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  FolderOpen,
  PenTool,
  FileBarChart,
  Lightbulb,
  Languages,
  TrendingUp,
  Map,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "../../stores/auth";

const aiFeatures = [
  {
    name: "자기소개서 AI",
    description: "이력서와 포트폴리오를 기반으로 맞춤형 자기소개서를 작성합니다",
    icon: PenTool,
    href: "/ai/cover-letter",
    color: "bg-blue-500",
  },
  {
    name: "주간보고 AI",
    description: "기존 보고서 스타일을 학습하여 구조화된 보고서를 생성합니다",
    icon: FileBarChart,
    href: "/ai/weekly-report",
    color: "bg-green-500",
  },
  {
    name: "기획서 AI",
    description: "Deep Research 기반으로 상세한 기획서를 작성합니다",
    icon: Lightbulb,
    href: "/ai/proposal",
    color: "bg-yellow-500",
  },
  {
    name: "다국어 AI",
    description: "자막 번역, 이메일 작성 등 다국어 관련 작업을 처리합니다",
    icon: Languages,
    href: "/ai/translate",
    color: "bg-purple-500",
  },
  {
    name: "경제 이슈 AI",
    description: "IT 뉴스 요약과 개인 재정 분석을 제공합니다",
    icon: TrendingUp,
    href: "/ai/economy",
    color: "bg-red-500",
  },
  {
    name: "여행 코스 AI",
    description: "맞춤형 여행/데이트 코스와 일정을 계획합니다",
    icon: Map,
    href: "/ai/travel",
    color: "bg-cyan-500",
  },
];

export function Dashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            안녕하세요, {user?.name}님!
          </h1>
          <p className="text-muted-foreground mt-1">
            나만을 위한 AI 어시스턴트가 준비되어 있습니다
          </p>
        </div>
        <Link to="/documents">
          <Button variant="outline" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            내 문서함
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>문서함</CardDescription>
            <CardTitle className="text-2xl">문서 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              이력서, 포트폴리오, 자기소개서 등을 업로드하세요
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI 기능</CardDescription>
            <CardTitle className="text-2xl">6개 기능</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              다양한 AI 기능으로 업무를 자동화하세요
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>개인화</CardDescription>
            <CardTitle className="text-2xl">맞춤 서비스</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              내 문서를 기반으로 개인화된 결과를 제공합니다
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Features Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">AI 기능</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiFeatures.map((feature) => (
            <Link key={feature.name} to={feature.href}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg ${feature.color} flex items-center justify-center`}
                    >
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                  <div className="mt-4 flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    시작하기
                    <ArrowRight className="h-4 w-4 ml-1" />
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
