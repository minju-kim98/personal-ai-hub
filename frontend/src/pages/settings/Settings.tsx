import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Settings as SettingsIcon, User, Bell, Key, Trash2 } from "lucide-react";
import { useAuthStore } from "../../stores/auth";

export function Settings() {
  const { user, logout } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [economyEmail, setEconomyEmail] = useState(true);
  const [economyEmailTime, setEconomyEmailTime] = useState("06:30");

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    // TODO: API call to change password
    alert("비밀번호가 변경되었습니다.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSaveNotifications = () => {
    // TODO: API call to save notification settings
    alert("알림 설정이 저장되었습니다.");
  };

  const handleDeleteAccount = () => {
    if (window.confirm("정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      // TODO: API call to delete account
      logout();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg shadow-slate-500/25">
          <SettingsIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">설정</h1>
          <p className="text-muted-foreground text-sm">계정 및 앱 설정을 관리합니다</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>프로필</CardTitle>
            </div>
            <CardDescription>기본 프로필 정보</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">이메일</label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">이름</label>
              <Input value={user?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">가입일</label>
              <Input
                value={
                  user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("ko-KR")
                    : ""
                }
                disabled
              />
            </div>
          </CardContent>
        </Card>

        {/* Password Change Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle>비밀번호 변경</CardTitle>
            </div>
            <CardDescription>계정 비밀번호를 변경합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">현재 비밀번호</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">새 비밀번호</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">새 비밀번호 확인</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit">비밀번호 변경</Button>
            </form>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>알림 설정</CardTitle>
            </div>
            <CardDescription>이메일 알림을 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">이메일 알림</p>
                <p className="text-sm text-muted-foreground">
                  중요한 업데이트를 이메일로 받습니다
                </p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">경제 브리핑</p>
                  <p className="text-sm text-muted-foreground">
                    매일 아침 IT/경제 뉴스 요약
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={economyEmail}
                  onChange={(e) => setEconomyEmail(e.target.checked)}
                />
              </div>

              {economyEmail && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">발송 시간</label>
                  <Input
                    type="time"
                    value={economyEmailTime}
                    onChange={(e) => setEconomyEmailTime(e.target.value)}
                  />
                </div>
              )}
            </div>

            <Button onClick={handleSaveNotifications}>설정 저장</Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-500">계정 삭제</CardTitle>
            </div>
            <CardDescription>
              계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              삭제되는 데이터:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside mb-4 space-y-1">
              <li>업로드한 모든 문서</li>
              <li>생성한 자기소개서, 주간보고서, 기획서</li>
              <li>번역 기록</li>
              <li>여행 계획</li>
              <li>소비 분석 데이터</li>
            </ul>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              계정 삭제
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
