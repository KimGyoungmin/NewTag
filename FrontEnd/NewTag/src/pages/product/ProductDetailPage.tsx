import React from 'react';
import { ChevronLeft, MapPin, Eye, Heart, MessageCircle } from 'lucide-react';

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

interface ProductDetailPageProps {
  product: Product | null;
  setCurrentScreen: (screen: string) => void;
  likedProducts: number[];
  toggleLike: (productId: number) => void;
  startChat: (product: Product) => void;
}

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  setCurrentScreen,
  likedProducts,
  toggleLike,
  startChat
}) => {
  if (!product) return null;
  const isLiked = likedProducts.includes(product.id);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 flex items-center gap-2">
        <ChevronLeft className="w-6 h-6 cursor-pointer" onClick={() => setCurrentScreen('home')} />
        <h1 className="text-lg font-bold">상품 상세</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-8xl">{product.emoji}</div>

        <div className="p-6">
          <h2 className="text-xl font-bold">{product.title}</h2>
          <div className="text-2xl font-bold text-yellow-600 mt-2">💰 {product.price.toLocaleString()}원</div>

          <div className="mt-4 space-y-1 text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>서울시 {product.location}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span>🕐 1시간 전</span>
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{product.views}</span>
              <span className="flex items-center gap-1"><Heart className="w-4 h-4" />{product.likes}</span>
            </div>
          </div>

          <div className="border-t mt-6 pt-6">
            <h3 className="font-semibold text-lg mb-3">판매자 정보</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-2xl">👤</div>
              <div>
                <div className="font-semibold">{product.seller}</div>
                <div className="text-sm text-gray-500">⭐⭐⭐ Gold 등급</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 p-4 border-t bg-white">
        <button onClick={() => toggleLike(product.id)} className={`flex-1 py-3 rounded-lg font-semibold ${isLiked ? 'bg-red-50 text-red-500 border border-red-500' : 'bg-white text-yellow-600 border border-yellow-600'}`}>
          <Heart className={`w-5 h-5 inline mr-1 ${isLiked ? 'fill-red-500' : ''}`} />찜
        </button>
        <button onClick={() => startChat(product)} className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-lg font-semibold">
          <MessageCircle className="w-5 h-5 inline mr-1" />채팅하기
        </button>
      </div>
    </div>
  );
};

export default ProductDetailPage;
