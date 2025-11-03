import React from 'react';
import { ChevronLeft, Repeat } from 'lucide-react';

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

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  isLiked: boolean;
  onLikeToggle: () => void;
}

interface ExchangePageProps {
  exchangeProducts: Product[];
  navigateToDetail: (product: Product) => void;
  likedProducts: number[];
  toggleLike: (productId: number) => void;
  setCurrentScreen: (screen: string) => void;
  ProductCard: React.FC<ProductCardProps>;
}

const ExchangePage: React.FC<ExchangePageProps> = ({
  exchangeProducts,
  navigateToDetail,
  likedProducts,
  toggleLike,
  setCurrentScreen,
  ProductCard
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 flex items-center gap-2">
        <ChevronLeft className="w-6 h-6 cursor-pointer" onClick={() => setCurrentScreen('home')} />
        <h1 className="text-lg font-bold">물물교환</h1>
      </div>

      <div className="bg-yellow-50 p-4 border-b">
        <div className="flex items-start gap-3">
          <Repeat className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <div className="font-semibold text-gray-800 mb-1">💡 물물교환이란?</div>
            <div className="text-sm text-gray-600">금전 거래 없이 물건을 서로 교환하는 거래 방식입니다.</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        {exchangeProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Repeat className="w-16 h-16 mb-4" />
            <div>교환 가능한 상품이 없습니다</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4">
            {exchangeProducts.map(product => (
              <div key={product.id} className="relative">
                <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold z-10">
                  🔄 교환가능
                </div>
                <ProductCard
                  product={product}
                  onClick={() => navigateToDetail(product)}
                  isLiked={likedProducts.includes(product.id)}
                  onLikeToggle={() => toggleLike(product.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExchangePage;
