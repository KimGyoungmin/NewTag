import React from 'react';
import { Search, MapPin, Repeat, Navigation } from 'lucide-react';
import ProductSection from '../../components/product/ProductSection';
import type { Product, Screen } from '../../types';

interface HomePageProps {
  newProducts: Product[];
  hotProducts: Product[];
  recommendedProducts: Product[];
  navigateToDetail: (product: Product) => void;
  likedProducts: number[];
  toggleLike: (id: number) => void;
  setCurrentScreen: (screen: Screen) => void;
  setCategoryType: (type: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({
  newProducts,
  hotProducts,
  recommendedProducts,
  navigateToDetail,
  likedProducts,
  toggleLike,
  setCurrentScreen,
  setCategoryType,
}) => {
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
            <button onClick={() => setCurrentScreen('exchange')}><Repeat className="w-6 h-6" /></button>
            <button><Navigation className="w-6 h-6" /></button>
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

export default HomePage;
