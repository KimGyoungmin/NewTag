import React from 'react';
import { ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import type { Product } from '../../types';

interface ProductSectionProps {
  title: string;
  products: Product[];
  navigateToDetail: (product: Product) => void;
  likedProducts: number[];
  toggleLike: (id: number) => void;
  onViewAll: () => void;
}

const ProductSection: React.FC<ProductSectionProps> = ({
  title,
  products,
  navigateToDetail,
  likedProducts,
  toggleLike,
  onViewAll,
}) => {
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
        {products.map(product => (
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

export default ProductSection;
