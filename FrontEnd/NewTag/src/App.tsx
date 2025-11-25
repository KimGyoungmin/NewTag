import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { ScrollToTop } from "./components/ScrollToTop";
import { Toaster } from "./components/ui/sonner";
import { HomePage } from "./pages/HomePage";
import { ProductRegisterPage } from "./pages/ProductRegisterPage";
import { ChatListPage } from "./pages/ChatListPage";
import { MyPage } from "./pages/MyPage";
import { ResellPage } from "./pages/ResellPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { KakaoCallbackPage } from "./pages/KakaoCallbackPage";
import { GoogleCallbackPage } from "./pages/GoogleCallbackPage";
import { authApi } from "./api/auth";
import { chatService } from "./services/firebase/chatService";
import type { ResellProductRecord } from "./data/resellProducts";
import { LocationSelectPage } from "./pages/LocationSelectPage";
import { AddressAddPage } from "./pages/AddressAddPage";
import {
  ProductDetailWrapper,
  ProductEditWrapper,
  SelectBuyerWrapper,
  ChatRoomWrapper,
  SellerProfileWrapper,
  ResellDetailWrapper,
  ReviewWriteWrapper,
} from "./components/RouteWrappers";

/**
 * NewTag 메인 애플리케이션 컴포넌트
 *
 * React Router를 사용한 중고 거래 플랫폼
 * - URL 기반 라우팅
 * - 브라우저 히스토리 지원
 * - 상태 관리 및 네비게이션
 */
export default function App() {
  // ============================================
  // 상태 관리
  // ============================================

  /** 검색어 */
  const [searchQuery, setSearchQuery] = useState<string>("");

  /** 인증 상태 */
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  /** 리셀 상품 데이터 (ResellPage와 ResellDetailPage 공유) */
  const [resellProducts, setResellProducts] = useState<ResellProductRecord[]>([]);

  /** 안읽은 채팅 개수 */
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  const navigate = useNavigate();
  const location = useLocation();

  // ============================================

  // 초기 로드 - 로그인 상태 확인
  // ============================================
  useEffect(() => {
    let mounted = true;
    authApi.initialize().then((user) => {
      if (!mounted) return;
      setIsAuthenticated(!!user);
      setAuthLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // ============================================
  // 로그인 상태 변경 감지
  // ============================================
  useEffect(() => {
    const handleAuthChange = () => {
      const isAuth = authApi.isAuthenticated();
      setIsAuthenticated(isAuth);

      if (isAuth) {
        // 로그인 시 홈 화면으로 이동 및 검색어 초기화
        if (location.pathname === '/login' || location.pathname === '/signup') {
          navigate('/');
        }

        setSearchQuery("");
      } else {
        // 로그아웃 시 로그인 화면으로 이동
        navigate('/login');

        setSearchQuery("");
        setUnreadChatCount(0);
      }
    };

    // auth-change 이벤트 리스너 등록

    window.addEventListener('auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [navigate, location.pathname]);

  // ============================================
  // 안읽은 채팅 개수 실시간 구독
  // ============================================
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('[App] Not authenticated, setting unread count to 0');
      setUnreadChatCount(0);
      return;
    }

    const user = authApi.getCurrentUser();
    if (!user) {
      console.log('[App] No user found');
      return;
    }

    console.log('[App] Subscribing to real-time unread count for user:', user.id);

    // 실시간 구독 시작
    const unsubscribe = chatService.subscribeToTotalUnreadCount(user.id, (count) => {
      console.log('[App] Real-time unread count updated:', count);
      setUnreadChatCount(count);
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      console.log('[App] Unsubscribing from unread count');
      unsubscribe();
    };
  }, [isAuthenticated]);

  // ============================================
  // 네비게이션 핸들러
  // ============================================

  /**
   * 검색어 초기화 후 홈으로 이동
   */
  const handleClearSearch = () => {
    setSearchQuery("");
    navigate('/');
  };

  // ============================================
  // UI 표시 여부
  // ============================================

  /** 헤더를 숨겨야 하는 페이지 목록 */
  const hideHeaderPaths = [
    '/login',
    '/signup',
    '/chat/',
    '/seller/',
    '/resell/',
    '/product/edit/',
    '/product/select-buyer/',
  ];

  const showHeader = !hideHeaderPaths.some(path => location.pathname.startsWith(path));

  /** 하단 네비게이션을 숨겨야 하는 페이지 목록 */
  const hideBottomNavPaths = [
    '/login',
    '/signup',
    '/chat/',
    '/product/edit/',
    '/product/select-buyer/',
    '/product/register',
    '/product/location',
    '/address/add',
  ];


  const showBottomNav = !hideBottomNavPaths.some(path => location.pathname.startsWith(path));

  // 현재 페이지 이름 추출 (BottomNav 활성화용)
  const getCurrentPage = () => {
    if (location.pathname === '/' || location.pathname === '/home') return 'home';
    if (location.pathname.startsWith('/resell')) return 'resell';
    if (location.pathname.startsWith('/chat')) return 'chat';
    if (location.pathname.startsWith('/mypage')) return 'mypage';
    return 'home';
  };

  // 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // 렌더링

  // ============================================

  return (
    <div className="min-h-screen bg-background">
      {/* 페이지 이동 시 스크롤 최상단 이동 */}
      <ScrollToTop />

      {/* 상단 헤더 (검색바, 로고, 로그인) */}

      {showHeader && (
        <Header
          onSearch={(query) => {
            setSearchQuery(query);
            navigate('/');
          }}
          onLogoClick={() => {
            setSearchQuery("");
            navigate('/');
          }}
          onLoginClick={() => navigate('/login')}
        />
      )}

      {/* 메인 콘텐츠 영역 */}
      <main className="w-full">
        <Routes>
          {/* 인증 페이지 */}
          <Route
            path="/login"
            element={<LoginPage onNavigate={(page) => navigate(`/${page}`)} />}
          />
          <Route
            path="/signup"
            element={<SignupPage onNavigate={(page) => navigate(`/${page}`)} />}
          />
          {/* 카카오 로그인 콜백 */}
          <Route
            path="/auth/kakao/callback"
            element={<KakaoCallbackPage />}
          />
          {/* 구글 로그인 콜백 */}
          <Route
            path="/auth/google/callback"
            element={<GoogleCallbackPage />}
          />

          {/* 보호된 라우트 - 로그인 필요 */}
          {isAuthenticated ? (
            <>
              {/* 홈 페이지 */}
              <Route
                path="/"
                element={
                  <HomePage
                    onNavigate={(page, id) => {
                      if (page === 'register') {
                        navigate('/product/register');
                      } else if (id) {
                        navigate(`/${page}/${id}`);
                      } else {
                        navigate(`/${page}`);
                      }
                    }}
                    searchQuery={searchQuery}
                    onClearSearch={handleClearSearch}
                  />
                }
              />
              <Route path="/home" element={<Navigate to="/" replace />} />

              {/* 리셀 페이지 */}
              <Route
                path="/resell"
                element={
                  <ResellPage
                    onNavigate={(page: string, id?: string) => id ? navigate(`/${page}/${id}`) : navigate(`/${page}`)}
                    products={resellProducts}
                    onProductsChange={setResellProducts}
                  />
                }
              />
              <Route
                path="/resell-detail/:id"
                element={<ResellDetailWrapper products={resellProducts} />}
              />

              {/* 상품 페이지 */}
              <Route
                path="/detail/:id"
                element={<ProductDetailWrapper />}
              />
              <Route
                path="/product/register"
                element={<ProductRegisterPage onNavigate={(page: string) => navigate(`/${page}`)} />}
              />
              <Route
                path="/product/location"
                element={<LocationSelectPage />}
              />
              <Route
                path="/address/add"
                element={<AddressAddPage />}
              />
              <Route
                path="/product-edit/:id"
                element={<ProductEditWrapper />}
              />
              <Route
                path="/select-buyer/:id"
                element={<SelectBuyerWrapper />}
              />

              {/* 리뷰 작성 */}
              <Route
                path="/review-write"
                element={<ReviewWriteWrapper />}
              />

              {/* 채팅 페이지 */}
              <Route
                path="/chat"
                element={<ChatListPage onNavigate={(page: string, id?: string) => id ? navigate(`/${page}/${id}`) : navigate(`/${page}`)} />}
              />
              <Route
                path="/chatroom/:id"
                element={<ChatRoomWrapper />}
              />

              {/* 프로필 페이지 */}
              <Route
                path="/mypage"
                element={<MyPage onNavigate={(page: string, id?: string) => id ? navigate(`/${page}/${id}`) : navigate(`/${page}`)} />}
              />
              <Route
                path="/seller-profile/:id"
                element={<SellerProfileWrapper />}
              />

              {/* 404 - 홈으로 리다이렉트 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            // 미인증 시 로그인으로 리다이렉트
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </main>

      {/* 하단 네비게이션 바 (홈, 리셀, 등록, 채팅, 마이페이지) */}

      {showBottomNav && (
        <BottomNav
          currentPage={getCurrentPage()}
          onNavigate={(page) => {
            // 홈 버튼 클릭 시 검색어 초기화
            console.log('[BottomNav] onNavigate called with page:', page);

            if (page === "home") {
              setSearchQuery("");
              navigate('/');
            } else if (page === "register") {
              console.log('[BottomNav] Navigating to register page');
              navigate('/product/register');
            } else {
              navigate(`/${page}`);
            }
          }}
          unreadChatCount={unreadChatCount}
        />
      )}

      {/* Toast 알림 */}

      <Toaster />
    </div>
  );
}
