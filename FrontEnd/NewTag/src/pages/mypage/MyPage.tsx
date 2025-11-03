import React from 'react';
import { Bell, LogOut, DollarSign, TrendingUp, Eye } from 'lucide-react';

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
}

interface MyPageProps {
  setCurrentScreen: (screen: string) => void;
  setShowLogoutConfirm: (show: boolean) => void;
  products: Product[];
}

const MyPage: React.FC<MyPageProps> = ({ setCurrentScreen, setShowLogoutConfirm, products }) => {
  const soldCount = 8;
  const totalRevenue = 2450000;
  const avgViews = 125;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">마이페이지</h1>
        <div className="flex gap-3">
          <button onClick={() => setCurrentScreen('notifications')}>
            <Bell className="w-6 h-6" />
          </button>
          <button onClick={() => setShowLogoutConfirm(true)}>
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center gap-4 p-6 border-b bg-white">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-3xl">👤</div>
          <div>
            <div className="font-semibold text-lg">홍길동</div>
            <div className="text-sm text-yellow-500 flex items-center gap-1">
              <span>⭐⭐⭐</span>
              <span>Gold 등급</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white mb-2">
          <h3 className="font-semibold text-lg mb-4">📊 이번 달 판매 리포트</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
              <DollarSign className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
              <div className="text-2xl font-bold text-yellow-600">{totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-gray-600 mt-1">총 판매액</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
              <TrendingUp className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-600">{soldCount}</div>
              <div className="text-xs text-gray-600 mt-1">판매 완료</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <Eye className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-600">{avgViews}</div>
              <div className="text-xs text-gray-600 mt-1">평균 조회수</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-4">
          <button className="bg-white p-4 rounded-lg border border-gray-200 hover:border-yellow-500 transition">
            <div className="text-2xl mb-2">📦</div>
            <div className="text-sm font-semibold">판매 내역</div>
          </button>
          <button className="bg-white p-4 rounded-lg border border-gray-200 hover:border-orange-500 transition">
            <div className="text-2xl mb-2">🛒</div>
            <div className="text-sm font-semibold">구매 내역</div>
          </button>
          <button onClick={() => setCurrentScreen('likes')} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-red-500 transition">
            <div className="text-2xl mb-2">❤️</div>
            <div className="text-sm font-semibold">관심 목록</div>
          </button>
          <button onClick={() => setCurrentScreen('reviews')} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-purple-500 transition">
            <div className="text-2xl mb-2">⭐</div>
            <div className="text-sm font-semibold">후기 관리</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
