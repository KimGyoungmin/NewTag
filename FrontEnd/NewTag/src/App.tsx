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
import { SelectBuyerPage } from "./pages/SelectBuyerPage";
import { ChatListPage } from "./pages/ChatListPage";
import { ChatPage } from "./pages/ChatPage";
import { MyPage } from "./pages/MyPage";
import { SellerProfilePage } from "./pages/SellerProfilePage";
import { ResellPage } from "./pages/ResellPage";
import { ResellDetailPage } from "./pages/ResellDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ReviewWritePage } from "./pages/ReviewWritePage";
import { authApi } from "./api/auth";
import type { ReviewNavigationPayload } from "./types";

/**
 * NewTag 메인 ?�플리�??�션 컴포?�트
 * 
 * 중고 거래 ?�랫?�의 ?�심 ?�우?�과 ?�태 관리�? ?�당?�니??
 * - ?�이지 ?�비게이??
 * - ?�품/채팅/?�매??ID 관�?
 * - ?�더/?�단�??�시 ?�어
 */
export default function App() {
  // ============================================
  // ?�태 관�?
  // ============================================

  /** ?�재 ?�시 중인 ?�이지 */
  const [currentPage, setCurrentPage] = useState<string>("login");

  /** ?�택???�품 ID (?�세/?�정 ?�이지?? */
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  /** ?�택??채팅�?ID */
  const [selectedChatId, setSelectedChatId] = useState<string>("");

  /** ?�택???�매??ID */
  const [selectedSellerId, setSelectedSellerId] = useState<string>("");


  /** ���� �ۼ� �� ������ ���ؽ�Ʈ */
  const [reviewContext, setReviewContext] = useState<ReviewNavigationPayload | null>(null);

  /** 검?�어 */
  const [searchQuery, setSearchQuery] = useState<string>("");

  /** ?�품 ?�록 ?�???�택 Dialog ?�시 ?��? */
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  // ============================================
  // 초기 로드 - 로그???�태 ?�인
  // ============================================
  useEffect(() => {
    let mounted = true;
    authApi.initialize().then((user) => {
      if (!mounted) return;
      setCurrentPage(user ? "home" : "login");
    });
    return () => {
      mounted = false;
    };
  }, []);

  // ============================================
  // 로그???�태 변�?감�? - ?�면 초기??
  // ============================================
  useEffect(() => {
    const handleAuthChange = () => {
      const isAuth = authApi.isAuthenticated();

      if (isAuth) {
        // 로그???? ???�면?�로 ?�동 �?검?�어 초기??
        setCurrentPage("home");
        setSearchQuery("");
        setSelectedProductId("");
        setSelectedChatId("");
        setSelectedSellerId("");
      } else {
        // 로그?�웃 ?? 로그???�면?�로 ?�동 �?모든 ?�태 초기??
        setCurrentPage("login");
        setSearchQuery("");
        setSelectedProductId("");
        setSelectedChatId("");
        setSelectedSellerId("");
      }
    };

    // auth-change ?�벤??리스???�록
    window.addEventListener('auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);


  // ============================================
  // ?�비게이???�들??
  // ============================================
  
  /**
   * ?�이지 ?�동 처리
   * @param page ?�동???�이지 ?�름
   * @param id ?�품/채팅/?�매??ID (?�택?�항)
   */
  const handleNavigate = (page: string, id?: string) => {
    // ?�품 ?�록?�??�이?�로그로 ?�???�택 ??진행
    if (page === "register") {
      setShowRegisterDialog(true);
      return;
    }

    setCurrentPage(page);
    if (page !== "review-write") {
      setReviewContext(null);
    }

    // �??�이지�?ID ?�정
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
    if (page === "review-write") {
      if (id) {
        try {
          setReviewContext(JSON.parse(id));
        } catch {
          setReviewContext(null);
        }
      } else {
        setReviewContext(null);
      }
    }
    if (page === "select-buyer" && id) {
      setSelectedProductId(id);
    }
  };

  /**
   * 검?�어 초기??�??�으�??�동
   */
  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage("home");
  };

  /**
   * ?�품 ?�록 ?�???�택 (?�반/AI)
   * @param type ?�록 ?�??
   */
  const handleRegisterTypeSelect = (type: "normal" | "ai") => {
    if (type === "normal") {
      setCurrentPage("register-normal");
    } else {
      setCurrentPage("register-ai");
    }
  };

  // ============================================
  // ?�이지 ?�더�?
  // ============================================
  
  /**
   * ?�재 ?�이지??맞는 컴포?�트 반환
   */
  const renderPage = () => {
    switch (currentPage) {
      // ?�증 ?�이지
      case "login":
        return <LoginPage onNavigate={handleNavigate} />;
      case "signup":
        return <SignupPage onNavigate={handleNavigate} />;

      // 메인 ?�이지
      case "home":
        return (
          <HomePage
            onNavigate={handleNavigate}
            searchQuery={searchQuery}
            onClearSearch={handleClearSearch}
          />
        );

      // 리�? ?�이지
      case "resell":
        return <ResellPage onNavigate={handleNavigate} />;
      case "resell-detail":
        return (
          <ResellDetailPage
            productId={selectedProductId}
            onNavigate={handleNavigate}
          />
        );

      // ?�품 ?�이지
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
      case "select-buyer":
        return (
          <SelectBuyerPage
            productId={selectedProductId}
            onNavigate={handleNavigate}
          />
        );

      case "review-write":
        return (
          <ReviewWritePage
            payload={reviewContext}
            onNavigate={handleNavigate}
          />
        );

      // 채팅 ?�이지
      case "chat":
        return <ChatListPage onNavigate={handleNavigate} />;
      case "chatroom":
        return (
          <ChatPage
            chatId={selectedChatId}
            onNavigate={handleNavigate}
          />
        );

      // ?�로???�이지
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
  // UI ?�시 ?�어
  // ============================================
  
  /** ?�더�??�겨???�는 ?�이지 목록 */
  const showHeader =
    currentPage !== "chatroom" &&
    currentPage !== "seller-profile" &&
    currentPage !== "resell-detail" &&
    currentPage !== "product-edit" &&
    currentPage !== "select-buyer" &&
    currentPage !== "login" &&
    currentPage !== "signup";

  /** ?�단 ?�비게이?�을 ?�겨???�는 ?�이지 목록 */
  const showBottomNav = 
    currentPage !== "login" && 
    currentPage !== "signup" &&
    currentPage !== "chatroom" &&
    currentPage !== "product-edit" &&
    currentPage !== "select-buyer" &&
    currentPage !== "register-normal" &&
    currentPage !== "register-ai";

  // ============================================
  // ?�더�?
  // ============================================
  
  return (
    <div className="min-h-screen bg-background">
      {/* ?�단 ?�더 (검?�바, 로고, 로그?? */}
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

      {/* 메인 콘텐�??�역 */}
      <main className="w-full">{renderPage()}</main>

      {/* ?�단 ?�비게이??�?(?? 리�?, ?�록, 채팅, 마이?�이지) */}
      {showBottomNav && (
        <BottomNav
          currentPage={currentPage}
          onNavigate={(page) => {
            // ??버튼 ?�릭 ??검?�어 초기??
            if (page === "home") {
              setSearchQuery("");
            }
            handleNavigate(page);
          }}
        />
      )}

      {/* ?�품 ?�록 ?�???�택 Dialog (?�반/AI) */}
      <RegisterTypeDialog
        open={showRegisterDialog}
        onClose={() => setShowRegisterDialog(false)}
        onSelectType={handleRegisterTypeSelect}
      />

      {/* Toast ?�림 */}
      <Toaster />
    </div>
  );
}

