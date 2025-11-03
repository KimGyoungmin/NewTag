import React, { useState } from 'react';
import { ChevronLeft, Star } from 'lucide-react';

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

interface ReviewListPageProps {
  reviews: Review[];
  setCurrentScreen: (screen: string) => void;
}

const ReviewCard: React.FC<{ review: Review; isWritten?: boolean }> = ({ review, isWritten }) => {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-500">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-500">½</span>);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<span key={i} className="text-gray-300">★</span>);
    }
    return stars;
  };

  return (
    <div className="bg-white p-4 mb-2 border-b">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-xl">
            👤
          </div>
          <div>
            <div className="font-semibold">{isWritten ? '받는 사람' : review.writerName}</div>
            <div className="text-xs text-gray-500">{review.createdAt}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex gap-0.5 text-lg">{renderStars(review.rating)}</div>
          <div className="text-sm font-semibold text-yellow-600">{review.rating.toFixed(1)}</div>
        </div>
      </div>
      <div className="text-sm text-gray-500 mb-2">상품: {review.productTitle}</div>
      <div className="text-gray-700 leading-relaxed">{review.content}</div>
    </div>
  );
};

const ReviewListPage: React.FC<ReviewListPageProps> = ({ reviews, setCurrentScreen }) => {
  const [activeTab, setActiveTab] = useState<'received' | 'written'>('received');

  const receivedReviews = reviews.filter(r => r.targetId === 'user1');
  const writtenReviews = reviews.filter(r => r.writerId === 'user1');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 flex items-center gap-2">
        <ChevronLeft className="w-6 h-6 cursor-pointer" onClick={() => setCurrentScreen('mypage')} />
        <h1 className="text-lg font-bold">후기 관리</h1>
      </div>

      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 py-3 font-semibold ${
            activeTab === 'received'
              ? 'text-yellow-600 border-b-2 border-yellow-600'
              : 'text-gray-400'
          }`}
        >
          받은 후기 ({receivedReviews.length})
        </button>
        <button
          onClick={() => setActiveTab('written')}
          className={`flex-1 py-3 font-semibold ${
            activeTab === 'written'
              ? 'text-yellow-600 border-b-2 border-yellow-600'
              : 'text-gray-400'
          }`}
        >
          쓴 후기 ({writtenReviews.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        {activeTab === 'received' && (
          <div>
            {receivedReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Star className="w-16 h-16 mb-4" />
                <div>받은 후기가 없습니다</div>
              </div>
            ) : (
              receivedReviews.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))
            )}
          </div>
        )}
        {activeTab === 'written' && (
          <div>
            {writtenReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Star className="w-16 h-16 mb-4" />
                <div>쓴 후기가 없습니다</div>
              </div>
            ) : (
              writtenReviews.map(review => (
                <ReviewCard key={review.id} review={review} isWritten />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewListPage;
