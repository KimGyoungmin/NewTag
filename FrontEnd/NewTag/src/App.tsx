import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { RegisterTypeDialog } from "./components/RegisterTypeDialog";
import { Toaster } from "./components/ui/sonner";
import { HomePage } from "./pages/HomePage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { ProductRegisterPage } from "./pages/ProductRegisterPage";
import { ProductRegisterAIPage } from "./pages/ProductRegisterAIPage";
import { ProductEditPage } from "./pages/ProductEditPage";
import { ChatListPage } from "./pages/ChatListPage";
import { ChatPage } from "./pages/ChatPage";
import { MyPage } from "./pages/MyPage";
import { SellerProfilePage } from "./pages/SellerProfilePage";
import { ResellPage } from "./pages/ResellPage";
import { ResellDetailPage } from "./pages/ResellDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { authApi } from "./api/auth";

/**
 * NewTag 메인 애플리케이션 컴포넌트
 * 
 * 중고 거래 플랫폼의 핵심 라우팅과 상태 관리를 담당합니다.
 * - 페이지 네비게이션
 * - 상품/채팅/판매자 ID 관리
 * - 헤더/하단바 표시 제어
 */
export default function App() {
  // ============================================
  // 상태 관리
  // ============================================

  /** 현재 표시 중인 페이지 */
  const [currentPage, setCurrentPage] = useState<string>("login");

  /** 선택된 상품 ID (상세/수정 페이지용) */
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  /** 선택된 채팅방 ID */
  const [selectedChatId, setSelectedChatId] = useState<string>("");

  /** 선택된 판매자 ID */
  const [selectedSellerId, setSelectedSellerId] = useState<string>("");

  /** 검색어 */
  const [searchQuery, setSearchQuery] = useState<string>("");

  /** 상품 등록 타입 선택 Dialog 표시 여부 */
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  // ============================================
  // 초기 로드 - 로그인 상태 확인
  // ============================================

  useEffect(() => {
    // 이미 로그인되어 있으면 홈으로 이동
    const isLoggedIn = authApi.isAuthenticated();
    console.log('[App] 초기 로드 - 로그인 상태:', isLoggedIn);
    console.log('[App] localStorage auth_token:', localStorage.getItem('auth_token'));

    if (isLoggedIn) {
      console.log('[App] 로그인되어 있음 - home으로 이동');
      setCurrentPage("home");
    } else {
      console.log('[App] 로그인 안됨 - login 페이지 유지');
    }
  }, []);

  // ============================================
  // 네비게이션 핸들러
  // ============================================
  
  /**
   * 페이지 이동 처리
   * @param page 이동할 페이지 이름
   * @param id 상품/채팅/판매자 ID (선택사항)
   */
  const handleNavigate = (page: string, id?: string) => {
    // 상품 등록은 다이얼로그로 타입 선택 후 진행
    if (page === "register") {
      setShowRegisterDialog(true);
      return;
    }

    setCurrentPage(page);

    // 각 페이지별 ID 설정
    if (page === "detail" && id) {
      setSelectedProductId(id);
    }
    if (page === "chatroom" && id) {
      setSelectedChatId(id);
    }
    if (page === "seller-profile" && id) {
      setSelectedSellerId(id);
    }
    if (page === "resell-detail" && id) {
      setSelectedProductId(id);
    }
    if (page === "product-edit" && id) {
      setSelectedProductId(id);
    }
  };

  /**
   * 검색어 초기화 및 홈으로 이동
   */
  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage("home");
  };

  /**
   * 상품 등록 타입 선택 (일반/AI)
   * @param type 등록 타입
   */
  const handleRegisterTypeSelect = (type: "normal" | "ai") => {
    if (type === "normal") {
      setCurrentPage("register-normal");
    } else {
      setCurrentPage("register-ai");
    }
  };

  // ============================================
  // 페이지 렌더링
  // ============================================
  
  /**
   * 현재 페이지에 맞는 컴포넌트 반환
   */
  const renderPage = () => {
    switch (currentPage) {
      // 인증 페이지
      case "login":
        return <LoginPage onNavigate={handleNavigate} />;
      case "signup":
        return <SignupPage onNavigate={handleNavigate} />;

      // 메인 페이지
      case "home":
        return (
          <HomePage
            onNavigate={handleNavigate}
            searchQuery={searchQuery}
            onClearSearch={handleClearSearch}
          />
        );

      // 리셀 페이지
      case "resell":
        return <ResellPage onNavigate={handleNavigate} />;
      case "resell-detail":
        return (
          <ResellDetailPage
            productId={selectedProductId}
            onNavigate={handleNavigate}
          />
        );

      // 상품 페이지
      case "detail":
        return (
          <ProductDetailPage
            productId={selectedProductId}
            onNavigate={handleNavigate}
          />
        );
      case "register-normal":
        return <ProductRegisterPage onNavigate={handleNavigate} />;
      case "register-ai":
        return <ProductRegisterAIPage onNavigate={handleNavigate} />;
      case "product-edit":
        return (
          <ProductEditPage
            productId={selectedProductId}
            onNavigate={handleNavigate}
          />
        );

      // 채팅 페이지
      case "chat":
        return <ChatListPage onNavigate={handleNavigate} />;
      case "chatroom":
        return (
          <ChatPage
            chatId={selectedChatId}
            onNavigate={handleNavigate}
          />
        );

      // 프로필 페이지
      case "mypage":
        return <MyPage onNavigate={handleNavigate} />;
      case "seller-profile":
        return (
          <SellerProfilePage
            sellerId={selectedSellerId}
            onNavigate={handleNavigate}
          />
        );

      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  // ============================================
  // UI 표시 제어
  // ============================================
  
  /** 헤더를 숨겨야 하는 페이지 목록 */
  const showHeader =
    currentPage !== "chatroom" &&
    currentPage !== "seller-profile" &&
    currentPage !== "resell-detail" &&
    currentPage !== "product-edit" &&
    currentPage !== "login" &&
    currentPage !== "signup";

  /** 하단 네비게이션을 숨겨야 하는 페이지 목록 */
  const showBottomNav = 
    currentPage !== "login" && 
    currentPage !== "signup" &&
    currentPage !== "chatroom" &&
    currentPage !== "product-edit" &&
    currentPage !== "register-normal" &&
    currentPage !== "register-ai";

  // ============================================
  // 렌더링
  // ============================================
  
  return (
    <div className="min-h-screen bg-background">
      {/* 상단 헤더 (검색바, 로고, 로그인) */}
      {showHeader && (
        <Header
          onSearch={(query) => {
            setSearchQuery(query);
            setCurrentPage("home");
          }}
          onLogoClick={() => {
            setSearchQuery("");
            setCurrentPage("home");
          }}
          onLoginClick={() => setCurrentPage("login")}
        />
      )}

      {/* 메인 콘텐츠 영역 */}
      <main className="w-full">{renderPage()}</main>

      {/* 하단 네비게이션 바 (홈, 리셀, 등록, 채팅, 마이페이지) */}
      {showBottomNav && (
        <BottomNav
          currentPage={currentPage}
          onNavigate={(page) => {
            // 홈 버튼 클릭 시 검색어 초기화
            if (page === "home") {
              setSearchQuery("");
            }
            handleNavigate(page);
          }}
        />
      )}

      {/* 상품 등록 타입 선택 Dialog (일반/AI) */}
      <RegisterTypeDialog
        open={showRegisterDialog}
        onClose={() => setShowRegisterDialog(false)}
        onSelectType={handleRegisterTypeSelect}
      />

      {/* Toast 알림 */}
      <Toaster />
    </div>
  );
}
