import React from 'react';
import { Heart } from 'lucide-react';

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

interface LikesPageProps {
  likedProducts: Product[];
  navigateToDetail: (product: Product) => void;
}

const LikesPage: React.FC<LikesPageProps> = ({ likedProducts, navigateToDetail }) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4">
        <h1 className="text-xl font-bold">찜한 상품</h1>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        {likedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Heart className="w-16 h-16 mb-4" />
            <div>찜한 상품이 없습니다</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4">
            {likedProducts.map(product => (
              <div key={product.id} onClick={() => navigateToDetail(product)} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer bg-white">
                <div className="bg-gray-100 h-40 flex items-center justify-center text-6xl">{product.emoji}</div>
                <div className="p-3">
                  <div className="text-sm font-semibold mb-1 truncate">{product.title}</div>
                  <div className="text-lg font-bold text-yellow-600">{product.price.toLocaleString()}원</div>
                  <div className="text-xs text-gray-500">{product.location}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LikesPage;
