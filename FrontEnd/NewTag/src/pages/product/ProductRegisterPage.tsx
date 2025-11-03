import React from 'react';
import { ChevronLeft, Camera } from 'lucide-react';

interface ProductRegisterPageProps {
  setCurrentScreen: (screen: string) => void;
}

const ProductRegisterPage: React.FC<ProductRegisterPageProps> = ({ setCurrentScreen }) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 flex items-center gap-2">
        <ChevronLeft className="w-6 h-6 cursor-pointer" onClick={() => setCurrentScreen('home')} />
        <h1 className="text-lg font-bold">일반 상품 등록</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <label className="block font-semibold mb-3">📷 사진 등록</label>
          <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-yellow-500 hover:bg-yellow-50 transition">
            <div className="text-center">
              <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <div className="text-sm text-gray-500">사진을 추가해주세요</div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">제목</label>
          <input type="text" placeholder="상품 제목을 입력하세요" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">카테고리</label>
          <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500">
            <option>디지털기기</option>
            <option>가구/인테리어</option>
            <option>생활가전</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">가격</label>
          <input type="text" placeholder="가격을 입력하세요" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">설명</label>
          <textarea placeholder="상품 설명을 입력하세요" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-[100px]"></textarea>
        </div>

        <button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition mt-6">
          등록하기
        </button>
      </div>
    </div>
  );
};

export default ProductRegisterPage;
