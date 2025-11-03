import { useState } from 'react';
import { Home, MessageCircle, PlusCircle, Heart, User, Search, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

// Import page components
import ProductDetailPage from './pages/product/ProductDetailPage';
import ProductRegisterPage from './pages/product/ProductRegisterPage';
import ProductRegisterAIPage from './pages/product/ProductRegisterAIPage';
import ExchangePage from './pages/exchange/ExchangePage';
import LikesPage from './pages/likes/LikesPage';
import NotificationsPage from './pages/notification/NotificationsPage';
import MyPage from './pages/mypage/MyPage';
import ChatPage from './pages/chat/ChatPage';
import ChatListPage from './pages/chat/ChatListPage';
import ReviewListPage from './pages/review/ReviewListPage';
import ReviewWritePage from './pages/review/ReviewWritePage';

// Types
interface Product {
  id: number;
  title: string;
  price: number;
  location: string;
  likes: number;
  emoji: string;
  views: number;
  seller: string;
  sellerId: string;
  isHot?: boolean;
  isNew?: boolean;
  isRecommended?: boolean;
  canExchange?: boolean;
}

interface ReviewTarget {
  productTitle: string;
  sellerName: string;
  productId: number;
}

interface BottomNavProps {
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;
  showRegisterMenu: boolean;
  setShowRegisterMenu: (show: boolean) => void;
}

// Mock data
const initialProducts: Product[] = [
  { id: 1, title: '아이폰 15 프로', price: 800000, location: '강남구', likes: 23, emoji: '📱', views: 142, seller: '홍길동', sellerId: 'user1', isHot: true, isNew: true },
  { id: 2, title: '맥북 프로 M3', price: 1500000, location: '서초구', likes: 45, emoji: '💻', views: 320, seller: '김철수', sellerId: 'user2', isRecommended: true },
  { id: 3, title: '에어팟 프로 2세대', price: 100000, location: '강남구', likes: 12, emoji: '🎧', views: 89, seller: '이영희', sellerId: 'user3', isNew: true },
  { id: 4, title: '갤럭시탭 S9', price: 350000, location: '역삼동', likes: 8, emoji: '📱', views: 56, seller: '박민수', sellerId: 'user4', isNew: true, canExchange: true },
  { id: 5, title: '북유럽 소파', price: 250000, location: '강남구', likes: 15, emoji: '🛋️', views: 98, seller: '최지은', sellerId: 'user5', isRecommended: true },
  { id: 6, title: 'LG 냉장고', price: 400000, location: '서초구', likes: 20, emoji: '🧊', views: 145, seller: '정수진', sellerId: 'user6', isHot: true },
  { id: 7, title: '나이키 운동화', price: 80000, location: '강남구', likes: 10, emoji: '👟', views: 67, seller: '김민지', sellerId: 'user7', isNew: true, canExchange: true },
  { id: 8, title: '무선 청소기', price: 180000, location: '서초구', likes: 18, emoji: '🔌', views: 112, seller: '이수정', sellerId: 'user8', isHot: true, canExchange: true },
];

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [likedProducts, setLikedProducts] = useState([1, 3]);
  const [products] = useState(initialProducts);
  const [notifications] = useState([
    { id: 1, message: '김철수님이 메시지를 보냈습니다', time: '5분 전', isRead: false },
    { id: 2, message: '회원님의 상품을 3명이 찜했습니다', time: '1시간 전', isRead: false },
  ]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [categoryType, setCategoryType] = useState('latest');
  const [chatMessages, setChatMessages] = useState<Record<number, any[]>>({});
  const [activeChat, setActiveChat] = useState<Product | null>(null);
  const [showRegisterMenu, setShowRegisterMenu] = useState(false);
  const [reviews, setReviews] = useState([
    { id: 1, writerId: 'user2', writerName: '김철수', targetId: 'user1', productTitle: '아이폰 15 프로', rating: 4.5, content: '좋은 거래였습니다! 친절하시고 상품도 깨끗해요.', createdAt: '2024.10.10' },
    { id: 2, writerId: 'user3', writerName: '이영희', targetId: 'user1', productTitle: '에어팟 프로', rating: 5.0, content: '완전 새것같아요! 감사합니다.', createdAt: '2024.10.12' },
  ]);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);

  const toggleLike = (productId: number) => {
    setLikedProducts(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const navigateToDetail = (product: Product) => {
    setSelectedProduct(product);
    setCurrentScreen('detail');
  };

  const startChat = (product: Product) => {
    setActiveChat(product);
    setCurrentScreen('chat');
    if (!chatMessages[product.id]) {
      setChatMessages(prev => ({
        ...prev,
        [product.id]: [
          { sender: 'seller', text: `안녕하세요! ${product.title}에 관심 가져주셔서 감사합니다.`, time: '오후 2:30' }
        ]
      }));
    }
  };

  const sendMessage = (text: string) => {
    if (!text.trim() || !activeChat) return;

    setChatMessages(prev => ({
      ...prev,
      [activeChat.id]: [
        ...(prev[activeChat.id] || []),
        { sender: 'user', text, time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) }
      ]
    }));

    setTimeout(() => {
      if (activeChat) {
        setChatMessages(prev => ({
          ...prev,
          [activeChat.id]: [
            ...(prev[activeChat.id] || []),
            { sender: 'seller', text: '네, 가능합니다!', time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) }
          ]
        }));
      }
    }, 1000);
  };

  const newProducts = products.filter(p => p.isNew);
  const hotProducts = products.filter(p => p.isHot);
  const recommendedProducts = products.filter(p => p.isRecommended);
  const exchangeProducts = products.filter(p => p.canExchange);
  const likedProductsList = products.filter(p => likedProducts.includes(p.id));

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col shadow-2xl">
      {currentScreen === 'login' && <LoginScreen setCurrentScreen={setCurrentScreen} />}
      {currentScreen === 'signup' && <SignupScreen setCurrentScreen={setCurrentScreen} />}
      {currentScreen === 'home' && (
        <HomeScreen
          newProducts={newProducts}
          hotProducts={hotProducts}
          recommendedProducts={recommendedProducts}
          navigateToDetail={navigateToDetail}
          likedProducts={likedProducts}
          toggleLike={toggleLike}
          setCurrentScreen={setCurrentScreen}
          setCategoryType={setCategoryType}
        />
      )}
      {currentScreen === 'category-list' && (
        <CategoryListScreen
          categoryType={categoryType}
          products={categoryType === 'latest' ? newProducts : categoryType === 'hot' ? hotProducts : recommendedProducts}
          navigateToDetail={navigateToDetail}
          likedProducts={likedProducts}
          toggleLike={toggleLike}
          setCurrentScreen={setCurrentScreen}
        />
      )}
      {currentScreen === 'detail' && (
        <ProductDetailPage
          product={selectedProduct}
          setCurrentScreen={setCurrentScreen}
          likedProducts={likedProducts}
          toggleLike={toggleLike}
          startChat={startChat}
        />
      )}
      {currentScreen === 'exchange' && (
        <ExchangePage
          exchangeProducts={exchangeProducts}
          navigateToDetail={navigateToDetail}
          likedProducts={likedProducts}
          toggleLike={toggleLike}
          setCurrentScreen={setCurrentScreen}
          ProductCard={ProductCard}
        />
      )}
      {currentScreen === 'likes' && (
        <LikesPage
          likedProducts={likedProductsList}
          navigateToDetail={navigateToDetail}
        />
      )}
      {currentScreen === 'notifications' && (
        <NotificationsPage
          notifications={notifications}
          setCurrentScreen={setCurrentScreen}
        />
      )}
      {currentScreen === 'mypage' && (
        <MyPage
          setCurrentScreen={setCurrentScreen}
          setShowLogoutConfirm={setShowLogoutConfirm}
          products={products}
        />
      )}
      {currentScreen === 'chat' && (
        <ChatPage
          activeChat={activeChat}
          messages={activeChat ? (chatMessages[activeChat.id] || []) : []}
          sendMessage={sendMessage}
          setCurrentScreen={setCurrentScreen}
          setReviewTarget={setReviewTarget}
        />
      )}
      {currentScreen === 'reviews' && (
        <ReviewListPage
          reviews={reviews}
          setCurrentScreen={setCurrentScreen}
        />
      )}
      {currentScreen === 'review-write' && (
        <ReviewWritePage
          reviewTarget={reviewTarget}
          setCurrentScreen={setCurrentScreen}
          setReviews={setReviews}
        />
      )}
      {currentScreen === 'chatlist' && (
        <ChatListPage
          products={products}
          chatMessages={chatMessages}
          setActiveChat={setActiveChat}
          setCurrentScreen={setCurrentScreen}
        />
      )}
      {currentScreen === 'register' && (
        <ProductRegisterPage
          setCurrentScreen={setCurrentScreen}
        />
      )}
      {currentScreen === 'register-ai' && (
        <ProductRegisterAIPage
          setCurrentScreen={setCurrentScreen}
        />
      )}

      {currentScreen !== 'detail' && currentScreen !== 'chat' && currentScreen !== 'login' && currentScreen !== 'signup' && (
        <BottomNav
          currentScreen={currentScreen}
          setCurrentScreen={setCurrentScreen}
          showRegisterMenu={showRegisterMenu}
          setShowRegisterMenu={setShowRegisterMenu}
        />
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 m-4 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">로그아웃</h3>
            <p className="text-gray-600 mb-6">정말 로그아웃 하시겠습니까?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg">취소</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2 bg-yellow-500 text-white rounded-lg">로그아웃</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LoginScreen = ({ setCurrentScreen }: { setCurrentScreen: (screen: string) => void }) => {
  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-400 text-white p-8 flex items-center justify-center" style={{minHeight: '200px'}}>
        <div className="text-center">
          <div className="text-6xl mb-4">🏷️</div>
          <h1 className="text-3xl font-bold">NEWTAG</h1>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-2">📧 이메일</label>
          <input type="email" placeholder="이메일을 입력하세요" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-700 mb-2">🔒 비밀번호</label>
          <input type="password" placeholder="비밀번호를 입력하세요" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>

        <button onClick={() => setCurrentScreen('home')} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition mb-6">
          로그인 하기
        </button>

        <div className="text-center text-gray-400 mb-6">────── 또는 ──────</div>

        <button className="w-full border border-orange-500 text-orange-500 py-3 rounded-lg mb-3 hover:bg-orange-50 transition">
          🔵 Google로 계속하기
        </button>
        <button className="w-full bg-yellow-300 text-gray-800 py-3 rounded-lg mb-3 hover:bg-yellow-400 transition">
          🟡 Kakao로 계속하기
        </button>
        <button className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition">
          🟢 Naver로 계속하기
        </button>

        <p className="text-center mt-6 text-gray-600">
          회원이 아니신가요? <span onClick={() => setCurrentScreen('signup')} className="text-orange-500 font-semibold cursor-pointer">회원가입</span>
        </p>
      </div>
    </div>
  );
};

const SignupScreen = ({ setCurrentScreen }: { setCurrentScreen: (screen: string) => void }) => {
  const [checkingNick, setCheckingNick] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [nickAvailable, setNickAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  const checkNick = () => {
    setCheckingNick(true);
    setTimeout(() => {
      setNickAvailable(true);
      setCheckingNick(false);
    }, 500);
  };

  const checkEmail = () => {
    setCheckingEmail(true);
    setTimeout(() => {
      setEmailAvailable(true);
      setCheckingEmail(false);
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 flex items-center">
        <ChevronLeft className="w-6 h-6 cursor-pointer" onClick={() => setCurrentScreen('login')} />
        <h1 className="text-xl font-bold ml-3">회원가입</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">이름 *</label>
          <input type="text" placeholder="이름" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">아이디 (닉네임) *</label>
          <div className="flex gap-2">
            <input type="text" placeholder="아이디" className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            <button onClick={checkNick} disabled={checkingNick} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 whitespace-nowrap">
              {checkingNick ? '확인중...' : '중복확인'}
            </button>
          </div>
          {nickAvailable !== null && (
            <p className={`text-sm mt-1 ${nickAvailable ? 'text-green-500' : 'text-red-500'}`}>
              {nickAvailable ? '✓ 사용 가능한 아이디입니다' : '✗ 이미 사용중인 아이디입니다'}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">이메일 *</label>
          <div className="flex gap-2">
            <input type="email" placeholder="이메일" className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            <button onClick={checkEmail} disabled={checkingEmail} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 whitespace-nowrap">
              {checkingEmail ? '확인중...' : '중복확인'}
            </button>
          </div>
          {emailAvailable !== null && (
            <p className={`text-sm mt-1 ${emailAvailable ? 'text-green-500' : 'text-red-500'}`}>
              {emailAvailable ? '✓ 사용 가능한 이메일입니다' : '✗ 이미 사용중인 이메일입니다'}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">비밀번호 *</label>
          <input type="password" placeholder="비밀번호" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">비밀번호 확인 *</label>
          <input type="password" placeholder="비밀번호 확인" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">전화번호</label>
          <input type="tel" placeholder="010-0000-0000" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">생년월일</label>
          <input type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>

        <button onClick={() => setCurrentScreen('home')} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition">
          가입하기
        </button>
      </div>
    </div>
  );
};

const HomeScreen = ({ newProducts, hotProducts, recommendedProducts, navigateToDetail, likedProducts, toggleLike, setCurrentScreen, setCategoryType }: any) => {
  const handleViewAll = (type: string) => {
    setCategoryType(type);
    setCurrentScreen('category-list');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-400 text-white p-4">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🏷️</span> NEWTAG
          </h1>
          <div className="flex gap-3">
            <button onClick={() => setCurrentScreen('exchange')}><span className="text-2xl">🔄</span></button>
            <button><span className="text-2xl">📍</span></button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="상품명 검색..." className="w-full pl-10 pr-4 py-2 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white" />
        </div>
      </div>

      <div className="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b">
        <MapPin className="w-5 h-5 text-yellow-600" />
        <span className="text-sm font-medium">강남구</span>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <ProductSection
          title="🆕 최신 상품"
          products={newProducts}
          navigateToDetail={navigateToDetail}
          likedProducts={likedProducts}
          toggleLike={toggleLike}
          onViewAll={() => handleViewAll('latest')}
        />

        <ProductSection
          title="🔥 핫딜 상품"
          products={hotProducts}
          navigateToDetail={navigateToDetail}
          likedProducts={likedProducts}
          toggleLike={toggleLike}
          onViewAll={() => handleViewAll('hot')}
        />

        <ProductSection
          title="⭐ 추천 상품"
          products={recommendedProducts}
          navigateToDetail={navigateToDetail}
          likedProducts={likedProducts}
          toggleLike={toggleLike}
          onViewAll={() => handleViewAll('recommended')}
        />
      </div>
    </div>
  );
};

const ProductSection = ({ title, products, navigateToDetail, likedProducts, toggleLike, onViewAll }: any) => {
  if (products.length === 0) return null;

  return (
    <div className="mb-6 bg-white">
      <div className="px-4 py-3 flex justify-between items-center border-b">
        <h2 className="text-lg font-bold">{title}</h2>
        <button onClick={onViewAll} className="text-sm text-yellow-600 font-semibold flex items-center gap-1">
          더보기 <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto p-4 scrollbar-hide" style={{scrollbarWidth: 'none'}}>
        {products.map((product: Product) => (
          <div key={product.id} className="min-w-[160px]">
            <ProductCard
              product={product}
              onClick={() => navigateToDetail(product)}
              isLiked={likedProducts.includes(product.id)}
              onLikeToggle={() => toggleLike(product.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const CategoryListScreen = ({ categoryType, products, navigateToDetail, likedProducts, toggleLike, setCurrentScreen }: any) => {
  const getTitleAndEmoji = () => {
    switch(categoryType) {
      case 'latest': return '🆕 최신 상품';
      case 'hot': return '🔥 핫딜 상품';
      case 'recommended': return '⭐ 추천 상품';
      default: return '상품 목록';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 flex items-center gap-2">
        <ChevronLeft className="w-6 h-6 cursor-pointer" onClick={() => setCurrentScreen('home')} />
        <h1 className="text-lg font-bold">{getTitleAndEmoji()}</h1>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="grid grid-cols-2 gap-4 p-4">
          {products.map((product: Product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => navigateToDetail(product)}
              isLiked={likedProducts.includes(product.id)}
              onLikeToggle={() => toggleLike(product.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, onClick, isLiked, onLikeToggle }: any) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer bg-white">
      <div onClick={onClick} className="bg-gray-100 h-40 flex items-center justify-center text-6xl">
        {product.emoji}
      </div>
      <div className="p-3">
        <div className="text-sm font-semibold mb-1 truncate">{product.title}</div>
        <div className="text-lg font-bold text-yellow-600 mb-2">{product.price.toLocaleString()}원</div>
        <div className="text-xs text-gray-500 flex items-center justify-between">
          <span>{product.location}</span>
          <button onClick={(e) => { e.stopPropagation(); onLikeToggle(); }} className="flex items-center gap-1">
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
            <span>{product.likes}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const BottomNav = ({ currentScreen, setCurrentScreen, showRegisterMenu, setShowRegisterMenu }: BottomNavProps) => {
  const navItems = [
    { id: 'home', icon: Home, label: '홈' },
    { id: 'chatlist', icon: MessageCircle, label: '채팅' },
    { id: 'register', icon: PlusCircle, label: '등록' },
    { id: 'likes', icon: Heart, label: '찜' },
    { id: 'mypage', icon: User, label: 'MY' },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'register') {
      setShowRegisterMenu(!showRegisterMenu);
    } else {
      setShowRegisterMenu(false);
      setCurrentScreen(id);
    }
  };

  return (
    <div className="relative">
      {showRegisterMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowRegisterMenu(false)}
          ></div>

          <div className="absolute bottom-full left-0 right-0 mb-2 px-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
              <button
                onClick={() => {
                  setShowRegisterMenu(false);
                  setCurrentScreen('register');
                }}
                className="w-full px-6 py-4 text-left hover:bg-gray-50 transition border-b border-gray-100 flex items-center gap-3"
              >
                <div className="text-2xl">✍️</div>
                <div>
                  <div className="font-semibold text-gray-800">일반 상품 등록</div>
                  <div className="text-xs text-gray-500 mt-0.5">직접 상품 정보를 입력합니다</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowRegisterMenu(false);
                  setCurrentScreen('register-ai');
                }}
                className="w-full px-6 py-4 text-left hover:bg-orange-50 transition flex items-center gap-3"
              >
                <div className="text-2xl">🤖</div>
                <div>
                  <div className="font-semibold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">AI 자동 등록</div>
                  <div className="text-xs text-gray-500 mt-0.5">AI가 사진을 분석해 자동 작성 ⚡</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      <div className="border-t border-gray-200 bg-white">
        <div className="flex justify-around py-2">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className={`flex flex-col items-center gap-1 py-2 px-4 transition ${
                (currentScreen === id || (id === 'register' && showRegisterMenu)) ? 'text-yellow-600' : 'text-gray-400'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
