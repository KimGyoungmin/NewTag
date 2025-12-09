import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, User, Phone, ChevronLeft, AtSign, Calendar, Loader2 } from "lucide-react";
import { isAxiosError } from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Checkbox } from "../components/ui/checkbox";
import { authApi } from "../api/auth";
import type { SignupRequest } from "../types";
import { toast } from "sonner";

interface SignupPageProps {
  onNavigate: (page: string) => void;
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getErrorMessage = (error: unknown) => {
    if (isAxiosError(error)) {
      return (
        error.response?.data?.message ||
        "회원가입 중 문제가 발생했어요. 다시 시도해 주세요."
      );
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "회원가입 중 문제가 발생했어요. 다시 시도해 주세요.";
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      newAgreements.all =
        newAgreements.terms && newAgreements.privacy && newAgreements.marketing;
      setAgreements(newAgreements);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {

    e.preventDefault();

    setErrorMessage(null);



    if (!agreements.terms || !agreements.privacy) {

      toast.error("필수 약관에 동의해 주세요.");

      return;

    }



    if (formData.password !== formData.passwordConfirm) {

      toast.error("비밀번호가 일치하지 않습니다.");

      return;

    }



    const payload: SignupRequest = {

      name: formData.name.trim(),

      nick: formData.nickname.trim(),

      email: formData.email.trim(),

      password: formData.password,

      phone: formData.phone.trim() || undefined,

      birth: formData.birthdate || undefined,

    };



    if (!payload.nick) {

      setErrorMessage("닉네임을 입력해 주세요.");

      return;

    }



    try {

      setIsSubmitting(true);

      const response = await authApi.signup(payload);



      if (response.success) {

        toast.success("회원가입이 완료되었습니다! 로그인 해주세요.");

        onNavigate("login");

      } else {

        const message = response.message || "회원가입에 실패했습니다.";

        setErrorMessage(message);

        toast.error(message);

      }

    } catch (error) {

      const message = getErrorMessage(error);

      setErrorMessage(message);

      toast.error(message);

    } finally {

      setIsSubmitting(false);

    }

  };



  const handleSocialSignup = (provider: string) => {

    console.log("Social signup:", provider);

    toast.info("소셜 회원가입은 준비 중입니다.");

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
                  placeholder="닉네임을 입력하세요"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange("nickname", e.target.value)}
                  className="pl-10"
                  required
                />
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
                  placeholder="010-1234-5678"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="pl-10"
                  required
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
                  placeholder="8자 이상 입력하세요"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={8}
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
            </div>

            {/* Agreements */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="all"
                  checked={agreements.all}
                  onCheckedChange={(checked) =>
                    handleAgreementChange("all", checked as boolean)
                  }
                />
                <Label htmlFor="all" className="cursor-pointer">
                  전체 동의
                </Label>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="terms"
                    checked={agreements.terms}
                    onCheckedChange={(checked) =>
                      handleAgreementChange("terms", checked as boolean)
                    }
                  />
                  <Label htmlFor="terms" className="text-sm cursor-pointer">
                    (필수) 이용약관 동의
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="privacy"
                    checked={agreements.privacy}
                    onCheckedChange={(checked) =>
                      handleAgreementChange("privacy", checked as boolean)
                    }
                  />
                  <Label htmlFor="privacy" className="text-sm cursor-pointer">
                    (필수) 개인정보 처리방침 동의
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="marketing"
                    checked={agreements.marketing}
                    onCheckedChange={(checked) =>
                      handleAgreementChange("marketing", checked as boolean)
                    }
                  />
                  <Label htmlFor="marketing" className="text-sm cursor-pointer">
                    (선택) 마케팅 정보 수신 동의
                  </Label>
                </div>
              </div>
            </div>

            {errorMessage && (
              <p className="text-sm text-red-500 text-center">{errorMessage}</p>
            )}

            {/* Signup Button */}
            <Button
              type="submit"
              className="w-full bg-teal-500 hover:bg-teal-600 text-white"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  가입 중...
                </span>
              ) : (
                "가입하기"
              )}
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
            >
              로그인
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
