import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import axios from "axios"; //  axios import 추가
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

//  백엔드 기본 URL 설정
const API_URL = "http://localhost:8081/api/v1"; 

export function LoginPage({ onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  //  API 통신을 위한 상태 변수 추가
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      //  실제 백엔드 API 호출: POST /api/v1/login
      const response = await axios.post(`${API_URL}/login`, {
        
        email,
        password,
      });

      //  JWT 토큰 추출 
      const token = response.data.token; 
      
      if (token) {
        // 2. 토큰을 로컬 스토리지에 저장 (인증 상태 유지)
        localStorage.setItem("authToken", token); 
        console.log("Login Success. Token saved.");
        
        // 3. 로그인 성공 후 홈으로 이동
        onNavigate("home"); 
      } else {
        // 응답은 받았지만 토큰이 없는 경우
        setError("로그인에 성공했으나 토큰을 받지 못했습니다.");
      }
      
    } catch (err) {
      // API 호출 실패 (401 Unauthorized, 500 Internal Server Error, 네트워크 오류 등)
      console.error("Login failed:", err);
      
      if (axios.isAxiosError(err) && err.response) {
        // 백엔드에서 보낸 구체적인 오류 메시지 사용
        const message = err.response.data.message || "이메일 또는 비밀번호가 올바르지 않습니다.";
        setError(message);
      } else {
        setError("네트워크 오류 또는 서버 접속 실패.");
      }
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log("Social login:", provider);
    // 💡 실제로는 백엔드의 OAuth2 리다이렉트 URL로 이동합니다.
    window.location.href = `${API_URL.replace('/api/v1', '')}/oauth2/authorization/${provider.toLowerCase()}`;
    // onNavigate("home"); // 실제 리다이렉트가 발생하므로 주석 처리
  };

  const handleAdminMode = () => {
    console.log("Admin mode activated (Demo)");
    // 실제 관리자 모드 로직은 별도의 인증 절차가 필요합니다.
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
                  disabled={isLoading} // 💡 로딩 중 비활성화
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
                  disabled={isLoading} // 💡 로딩 중 비활성화
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
            
            {/* 💡 에러 메시지 표시 */}
            {error && (
              <div className="text-center">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

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
              disabled={isLoading} // 💡 로딩 중 버튼 비활성화
            >
              {isLoading ? '로그인 중...' : '로그인'}
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
              disabled={isLoading}
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

          {/* Social Login Buttons (handleSocialLogin 함수 수정됨) */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => handleSocialLogin("kakao")}
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
            >
              회원가입
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}