import React from 'react';
import { ChevronLeft } from 'lucide-react';
import ProductCard from '../../components/product/ProductCard';
import type { Product, Screen } from '../../types';

interface CategoryListPageProps {
  categoryType: string;
  products: Product[];
  navigateToDetail: (product: Product) => void;
  likedProducts: number[];
  toggleLike: (id: number) => void;
  setCurrentScreen: (screen: Screen) => void;
}

const CategoryListPage: React.FC<CategoryListPageProps> = ({
  categoryType,
  products,
  navigateToDetail,
  likedProducts,
  toggleLike,
  setCurrentScreen,
}) => {
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
          {products.map(product => (
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

export default CategoryListPage;
