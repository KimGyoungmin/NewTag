import React from 'react';
import { Heart } from 'lucide-react';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  isLiked: boolean;
  onLikeToggle: () => void;
  showExchangeBadge?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick,
  isLiked,
  onLikeToggle,
  showExchangeBadge = false,
}) => {
  // 임시: 프로토타입 데이터에서 emoji 사용, 실제로는 이미지 URL 사용
  const displayImage = (product as any).emoji || product.images?.[0]?.pImg || 'p_default_img.png';
  const isEmoji = typeof displayImage === 'string' && displayImage.length <= 4;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer bg-white relative">
      {showExchangeBadge && (
        <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold z-10">
          🔄 교환가능
        </div>
      )}

      <div onClick={onClick} className="bg-gray-100 h-40 flex items-center justify-center">
        {isEmoji ? (
          <span className="text-6xl">{displayImage}</span>
        ) : (
          <img src={displayImage} alt={product.title} className="w-full h-full object-cover" />
        )}
      </div>

      <div className="p-3">
        <div className="text-sm font-semibold mb-1 truncate">{product.title}</div>
        <div className="text-lg font-bold text-yellow-600 mb-2">{product.price.toLocaleString()}원</div>
        <div className="text-xs text-gray-500 flex items-center justify-between">
          <span>{product.locationNm}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLikeToggle();
            }}
            className="flex items-center gap-1"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
            <span>{product.favoriteCount || (product as any).likes || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
