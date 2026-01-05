import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  FolderOpen,
  PenTool,
  FileBarChart,
  Lightbulb,
  Languages,
  TrendingUp,
  Map,
  Settings,
  Home,
  LogOut,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../stores/auth";

const navigation = [
  { name: "대시보드", href: "/", icon: Home },
  { name: "내 문서함", href: "/documents", icon: FolderOpen },
  {
    name: "AI 기능",
    children: [
      { name: "자기소개서 AI", href: "/ai/cover-letter", icon: PenTool },
      { name: "주간보고 AI", href: "/ai/weekly-report", icon: FileBarChart },
      { name: "기획서 AI", href: "/ai/proposal", icon: Lightbulb },
      { name: "다국어 AI", href: "/ai/translate", icon: Languages },
      { name: "경제 이슈 AI", href: "/ai/economy", icon: TrendingUp },
      { name: "여행 코스 AI", href: "/ai/travel", icon: Map },
    ],
  },
  { name: "설정", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuthStore();

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">AI Hub</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) =>
          item.children ? (
            <div key={item.name} className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {item.name}
              </div>
              {item.children.map((child) => (
                <Link
                  key={child.name}
                  to={child.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === child.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <child.icon className="h-4 w-4" />
                  {child.name}
                </Link>
              ))}
            </div>
          ) : (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        )}
      </nav>

      {/* User */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
