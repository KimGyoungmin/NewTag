import { useState } from "react";
import { AtSign, Lock, Eye, EyeOff, Shield, Loader2 } from "lucide-react";
import { isAxiosError } from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { authApi } from "../api/auth";
import { toast } from "sonner";

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getErrorMessage = (error: unknown) => {
    if (isAxiosError(error)) {
      return (
        error.response?.data?.message ||
        "로그인 중 문제가 발생했어요. 다시 시도해 주세요."
      );
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "로그인 중 문제가 발생했어요. 다시 시도해 주세요.";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedNick = nick.trim();
    if (!trimmedNick) {
      setErrorMessage("닉네임을 입력해 주세요.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await authApi.login({
        nick: trimmedNick,
        password,
      });

      if (response.success) {
        toast.success("로그인에 성공했어요!");
        onNavigate("home");
      } else {
        const message = response.message || "로그인에 실패했어요.";
        setErrorMessage(message);
        toast.error(message);
      }
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    if (provider === 'kakao') {
      try {
        authApi.loginWithKakao();
      } catch (error) {
        toast.error('카카오 로그인 중 오류가 발생했습니다.');
        console.error('Kakao login error:', error);
      }
    } else {
      console.log("Social login:", provider);
      toast.info(`${provider} 로그인은 준비 중입니다.`);
    }
  };



  const handleAdminMode = () => {

    console.log("Admin mode activated");

    toast.info("??? ??? ?? ????.");

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
            {/* Nickname Input */}
            <div className="space-y-2">
              <Label htmlFor="nick">닉네임</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="nick"
                  type="text"
                  placeholder="닉네임 또는 아이디"
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="username"
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
                  placeholder="비밀번호를 입력해 주세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  autoComplete="current-password"
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

            {errorMessage && (
              <p className="text-sm text-red-500 text-center">{errorMessage}</p>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-teal-500 hover:bg-teal-600 text-white"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  로그인 중...
                </span>
              ) : (
                "로그인"
              )}
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
