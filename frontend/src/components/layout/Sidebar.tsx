import { Link, useLocation } from "react-router-dom";
import {
  FolderOpen,
  PenTool,
  FileBarChart,
  Lightbulb,
  Languages,
  TrendingUp,
  Map,
  Settings,
  LayoutDashboard,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../stores/auth";

const navigation = [
  { name: "대시보드", href: "/", icon: LayoutDashboard },
  { name: "문서함", href: "/documents", icon: FolderOpen },
];

const aiFeatures = [
  { name: "자기소개서", href: "/ai/cover-letter", icon: PenTool, color: "text-blue-500" },
  { name: "주간보고", href: "/ai/weekly-report", icon: FileBarChart, color: "text-emerald-500" },
  { name: "기획서", href: "/ai/proposal", icon: Lightbulb, color: "text-amber-500" },
  { name: "다국어", href: "/ai/translate", icon: Languages, color: "text-violet-500" },
  { name: "경제 이슈", href: "/ai/economy", icon: TrendingUp, color: "text-rose-500" },
  { name: "여행 코스", href: "/ai/travel", icon: Map, color: "text-cyan-500" },
];

export function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuthStore();

  return (
    <aside className="flex h-full w-60 flex-col bg-card/50 backdrop-blur-sm border-r border-border/50">
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-base tracking-tight">AI Hub</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                location.pathname === item.href
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </div>

        {/* AI Features */}
        <div className="space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
            AI 기능
          </div>
          {aiFeatures.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                location.pathname === item.href
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4", location.pathname !== item.href && item.color)} />
              {item.name}
            </Link>
          ))}
        </div>

        {/* Settings */}
        <div className="space-y-1">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              location.pathname === "/settings"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            설정
          </Link>
        </div>
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border/50">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition-colors">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-border/50">
            <span className="text-sm font-semibold text-primary">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="로그아웃"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
