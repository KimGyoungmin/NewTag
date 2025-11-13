import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, User, Phone, ChevronLeft, AtSign, Calendar, AlertTriangle } from "lucide-react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Checkbox } from "../components/ui/checkbox";

interface SignupPageProps {
  onNavigate: (page: string) => void;
}

const API_URL = "http://localhost:8081/api/v1"; 

// 비밀번호 유효성 검사 함수 (최소 8자, 영문, 숫자, 특수문자 포함)
const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return "비밀번호는 최소 8자 이상이어야 합니다.";
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return "비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.";
  }
  return null;
};

export function SignupPage({ onNavigate }: SignupPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    email: "",
    phone: "",
    birthdate: "",
    password: "",
    passwordConfirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacy: false,
    marketing: false,
  });
  // API 통신을 위한 상태 변수 추가
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null); // 입력 시 에러 메시지 초기화
  };

  const handleAgreementChange = (field: string, checked: boolean) => {
    if (field === "all") {
      setAgreements({
        all: checked,
        terms: checked,
        privacy: checked,
        marketing: checked,
      });
    } else {
      const newAgreements = { ...agreements, [field]: checked };
      // 전체 동의 상태를 나머지 체크박스에 따라 업데이트
      newAgreements.all =
        newAgreements.terms && newAgreements.privacy && newAgreements.marketing;
      setAgreements(newAgreements);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // --- 1. 클라이언트 측 필수 유효성 검사 ---

    if (!agreements.terms || !agreements.privacy) {
      setError("필수 약관(이용약관, 개인정보 처리방침)에 동의해야 합니다.");
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
        setError(passwordError);
        return;
    }

    // --- 2. API 호출 ---
    setIsLoading(true);

    // 전송할 데이터에서 비밀번호 확인 필드 제외
    const { passwordConfirm, ...dataToSubmit } = formData;
    
    // 백엔드 요청 본문 준비 (약관 동의 포함)
    const requestBody = {
        ...dataToSubmit,
        // 선택 약관 동의 여부 추가
        marketingAgreement: agreements.marketing,
        // (필수 약관은 백엔드에서 체크한다고 가정)
    };

    try {
      // 실제 백엔드 API 호출: POST /api/v1/signup
      const response = await axios.post(`${API_URL}/signup`, requestBody);

      if (response.status === 201 || response.status === 200) {
        console.log("Signup Success:", response.data);
        // 회원가입 성공 후 로그인 페이지로 이동
        onNavigate("login");
      } else {
        // 예상치 못한 성공 응답 (200대 코드가 아니면서 에러도 아닌 경우)
        setError("회원가입 요청에 응답했지만, 처리 과정에 오류가 발생했습니다.");
      }
      
    } catch (err) {
      console.error("Signup failed:", err);
      
      if (axios.isAxiosError(err) && err.response) {
        // 백엔드에서 보낸 구체적인 오류 메시지 (예: 이메일 중복, 닉네임 중복)
        const message = err.response.data.message || "회원가입에 실패했습니다. 입력 정보를 확인해주세요.";
        setError(message);
      } else {
        setError("네트워크 오류 또는 서버 접속에 실패했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = (provider: string) => {
    console.log("Social signup:", provider);
    // 실제로는 백엔드의 OAuth2 리다이렉트 URL로 이동합니다.
    window.location.href = `${API_URL.replace('/api/v1', '')}/oauth2/authorization/${provider.toLowerCase()}`;
    // onNavigate("home"); // 실제 리다이렉트가 발생하므로 주석 처리
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto max-w-md px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("login")}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl">회원가입</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-md p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 my-6">
          {/* Logo */}
          <div className="text-center mb-6">
            <h2 className="text-3xl text-teal-600 mb-2">NewTag</h2>
            <p className="text-sm text-muted-foreground">
              새로운 계정을 만들어보세요
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Nickname Input */}
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="nickname"
                  type="text"
                  placeholder="닉네임을 입력하세요 (중복 확인 필요)"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange("nickname", e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
                {/* 닉네임 중복확인 버튼을 추가하는 것도 좋습니다. */}
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Phone Input */}
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="010-1234-5678 (자동 하이픈 입력 기능 추가 필요)"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Birthdate Input */}
            <div className="space-y-2">
              <Label htmlFor="birthdate">생년월일</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => handleInputChange("birthdate", e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
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
                  placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={8}
                  disabled={isLoading}
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

            {/* Password Confirm Input */}
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="passwordConfirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.passwordConfirm}
                  onChange={(e) =>
                    handleInputChange("passwordConfirm", e.target.value)
                  }
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswordConfirm ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {/* 에러 메시지 표시 영역 */}
              {error && (
                <div className="flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-lg mt-3">
                  <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Agreements */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="all"
                  checked={agreements.all}
                  onCheckedChange={(checked: boolean | 'indeterminate') => 
                    handleAgreementChange("all", checked as boolean)
                  }
                  disabled={isLoading}
                />
                <Label htmlFor="all" className="cursor-pointer font-bold text-base text-teal-700">
                  전체 동의
                </Label>
              </div>

              <Separator />

              <div className="space-y-2 ml-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="terms"
                    checked={agreements.terms}
                    onCheckedChange={(checked: boolean | 'indeterminate') => 
                      handleAgreementChange("terms", checked as boolean)
                    }
                    disabled={isLoading}
                  />
                  <Label htmlFor="terms" className="text-sm cursor-pointer">
                    (필수) 이용약관 동의 <span className="text-teal-500 hover:underline cursor-pointer ml-1 text-xs">[보기]</span>
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="privacy"
                    checked={agreements.privacy}
                    onCheckedChange={(checked: boolean | 'indeterminate') => 
                      handleAgreementChange("privacy", checked as boolean)
                    }
                    disabled={isLoading}
                  />
                  <Label htmlFor="privacy" className="text-sm cursor-pointer">
                    (필수) 개인정보 처리방침 동의 <span className="text-teal-500 hover:underline cursor-pointer ml-1 text-xs">[보기]</span>
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="marketing"
                    checked={agreements.marketing}
                    onCheckedChange={(checked: boolean | 'indeterminate') => 
                      handleAgreementChange("marketing", checked as boolean)
                    }
                    disabled={isLoading}
                  />
                  <Label htmlFor="marketing" className="text-sm cursor-pointer">
                    (선택) 마케팅 정보 수신 동의
                  </Label>
                </div>
              </div>
            </div>

            {/* Signup Button */}
            <Button
              type="submit"
              className="w-full bg-teal-500 hover:bg-teal-600 text-white"
              size="lg"
              disabled={isLoading || !agreements.terms || !agreements.privacy} // 필수 약관 미동의 시 비활성화
            >
              {isLoading ? '가입 처리 중...' : '가입하기'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">또는</span>
            <Separator className="flex-1" />
          </div>

          {/* Social Signup Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => handleSocialSignup("kakao")}
              disabled={isLoading}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-yellow-400 rounded-full" />
                <span>카카오로 시작하기</span>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => handleSocialSignup("naver")}
              disabled={isLoading}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full" />
                <span>네이버로 시작하기</span>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => handleSocialSignup("google")}
              disabled={isLoading}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 rounded-full flex items-center justify-center text-xs">
                  G
                </div>
                <span>Google로 시작하기</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center pb-6">
          <p className="text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <button
              onClick={() => onNavigate("login")}
              className="text-teal-600 hover:text-teal-700"
              disabled={isLoading}
            >
              로그인
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}