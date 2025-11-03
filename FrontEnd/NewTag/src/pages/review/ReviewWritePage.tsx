import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

interface ReviewTarget {
  productTitle: string;
  sellerName: string;
  productId: number;
}

interface Review {
  id: number;
  writerId: string;
  writerName: string;
  targetId: string;
  productTitle: string;
  rating: number;
  content: string;
  createdAt: string;
}

interface ReviewWritePageProps {
  reviewTarget: ReviewTarget | null;
  setCurrentScreen: (screen: string) => void;
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
}

const ReviewWritePage: React.FC<ReviewWritePageProps> = ({ reviewTarget, setCurrentScreen, setReviews }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState('');

  const handleStarClick = (value: number) => {
    setRating(value);
  };

  const handleSubmit = () => {
    if (rating === 0) {
      alert('별점을 선택해주세요!');
      return;
    }
    if (!content.trim()) {
      alert('후기 내용을 작성해주세요!');
      return;
    }

    const newReview: Review = {
      id: Date.now(),
      writerId: 'user1',
      writerName: '홍길동',
      targetId: 'user2',
      productTitle: reviewTarget?.productTitle || '아이폰 15 프로',
      rating: rating,
      content: content,
      createdAt: new Date().toLocaleDateString('ko-KR')
    };

    setReviews(prev => [...prev, newReview]);
    alert('후기가 등록되었습니다!');
    setCurrentScreen('reviews');
  };

  const renderStarSelection = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFullStar = (hoveredRating || rating) >= i;
      const isHalfStar = (hoveredRating || rating) >= i - 0.5 && (hoveredRating || rating) < i;

      stars.push(
        <div key={i} className="relative inline-block mx-1">
          <div
            className="absolute left-0 top-0 bottom-0 w-1/2 cursor-pointer z-10"
            onMouseEnter={() => setHoveredRating(i - 0.5)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => handleStarClick(i - 0.5)}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-1/2 cursor-pointer z-10"
            onMouseEnter={() => setHoveredRating(i)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => handleStarClick(i)}
          />
          <span className={`text-5xl select-none ${
            isFullStar ? 'text-yellow-500' :
            isHalfStar ? 'text-yellow-300' : 'text-gray-300'
          }`} style={{
            background: isHalfStar ? 'linear-gradient(90deg, #eab308 50%, #d1d5db 50%)' : 'none',
            WebkitBackgroundClip: isHalfStar ? 'text' : 'unset',
            WebkitTextFillColor: isHalfStar ? 'transparent' : 'inherit'
          }}>
            ★
          </span>
        </div>
      );
    }
    return stars;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 flex items-center gap-2">
        <ChevronLeft className="w-6 h-6 cursor-pointer" onClick={() => setCurrentScreen('chatlist')} />
        <h1 className="text-lg font-bold">후기 작성</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="text-sm text-gray-500 mb-1">거래 상품</div>
          <div className="font-semibold text-lg">{reviewTarget?.productTitle || '아이폰 15 프로'}</div>
          <div className="text-sm text-gray-600 mt-1">판매자: {reviewTarget?.sellerName || '김철수'}</div>
        </div>

        <div className="mb-8">
          <label className="block font-semibold mb-4 text-center text-lg">거래는 어떠셨나요?</label>
          <div className="flex justify-center items-center mb-3">
            {renderStarSelection()}
          </div>
          <div className="text-center">
            <span className="text-3xl font-bold text-yellow-600">{rating.toFixed(1)}</span>
            <span className="text-gray-500 ml-2">/ 5.0</span>
          </div>
          <div className="text-center text-sm text-gray-500 mt-2">
            별을 클릭하여 0.5점 단위로 평가해주세요
          </div>
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-2">후기 작성</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="거래 경험을 자세히 알려주세요&#10;(최소 10자 이상)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-[150px] resize-none"
            maxLength={500}
          />
          <div className="text-right text-sm text-gray-500 mt-1">
            {content.length} / 500
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <div className="text-sm font-semibold text-yellow-800 mb-2">💡 후기 작성 팁</div>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 상품 상태와 설명의 일치 여부</li>
            <li>• 판매자의 응대 및 소통</li>
            <li>• 거래 약속 준수 여부</li>
            <li>• 전반적인 거래 만족도</li>
          </ul>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
          후기 등록하기
        </button>
      </div>
    </div>
  );
};

export default ReviewWritePage;
