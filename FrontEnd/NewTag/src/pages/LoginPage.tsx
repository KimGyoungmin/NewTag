import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 실제로는 API 호출하여 로그인 처리
    console.log("Login:", { email, password });
    // 로그인 성공 후 홈으로 이동
    onNavigate("home");
  };

  const handleSocialLogin = (provider: string) => {
    console.log("Social login:", provider);
    // 실제로는 소셜 로그인 API 호출
    onNavigate("home");
  };

  const handleAdminMode = () => {
    console.log("Admin mode activated");
    // 관리자 모드로 바로 홈으로 이동
    onNavigate("home");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2 text-teal-600">NewTag</h1>
          <p className="text-muted-foreground">안전한 중고거래의 시작</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-4">
          <h2 className="text-2xl mb-6 text-center">로그인</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-teal-600 hover:text-teal-700"
                onClick={() => console.log("Forgot password")}
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-teal-500 hover:bg-teal-600 text-white"
              size="lg"
            >
              로그인
            </Button>
          </form>

          {/* Admin Mode Button */}
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 border-orange-400 text-orange-600 hover:bg-orange-50"
              size="lg"
              onClick={handleAdminMode}
            >
              <Shield className="mr-2 h-5 w-5" />
              관리자모드 (데모)
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">또는</span>
            <Separator className="flex-1" />
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => handleSocialLogin("kakao")}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-yellow-400 rounded-full" />
                <span>카카오로 계속하기</span>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => handleSocialLogin("naver")}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full" />
                <span>네이버로 계속하기</span>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => handleSocialLogin("google")}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 rounded-full flex items-center justify-center text-xs">
                  G
                </div>
                <span>Google로 계속하기</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-muted-foreground">
            계정이 없으신가요?{" "}
            <button
              onClick={() => onNavigate("signup")}
              className="text-teal-600 hover:text-teal-700"
            >
              회원가입
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
