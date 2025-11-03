import React from 'react';
import { Home, MessageCircle, PlusCircle, Heart, User } from 'lucide-react';
import type { Screen } from '../../types';

interface BottomNavProps {
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  showRegisterMenu: boolean;
  setShowRegisterMenu: (show: boolean) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  setCurrentScreen,
  showRegisterMenu,
  setShowRegisterMenu,
}) => {
  const navItems = [
    { id: 'home' as Screen, icon: Home, label: '홈' },
    { id: 'chatlist' as Screen, icon: MessageCircle, label: '채팅' },
    { id: 'register' as Screen, icon: PlusCircle, label: '등록' },
    { id: 'likes' as Screen, icon: Heart, label: '찜' },
    { id: 'mypage' as Screen, icon: User, label: 'MY' },
  ];

  const handleNavClick = (id: Screen) => {
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

export default BottomNav;
