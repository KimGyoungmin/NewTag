import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { ProductEditPage } from '../pages/ProductEditPage';
import { SelectBuyerPage } from '../pages/SelectBuyerPage';
import { ChatPage } from '../pages/ChatPage';
import { SellerProfilePage } from '../pages/SellerProfilePage';
import { ResellDetailPage } from '../pages/ResellDetailPage';
import { ReviewWritePage } from '../pages/ReviewWritePage';
import type { ResellProductRecord } from '../data/resellProducts';
import type { ReviewNavigationPayload } from '../types';

/**
 * React Router의 useParams를 사용하여 URL 파라미터를 props로 전달하는 래퍼 컴포넌트들
 */

export function ProductDetailWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleNavigate = (page: string, navId?: string) => {
    if (navId) {
      navigate(`/${page}/${navId}`);
    } else {
      navigate(`/${page}`);
    }
  };

  return <ProductDetailPage productId={id || ''} onNavigate={handleNavigate} />;
}

export function ProductEditWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleNavigate = (page: string, navId?: string) => {
    if (navId) {
      navigate(`/${page}/${navId}`);
    } else {
      navigate(`/${page}`);
    }
  };

  return <ProductEditPage productId={id || ''} onNavigate={handleNavigate} />;
}

export function SelectBuyerWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleNavigate = (page: string, navId?: string) => {
    if (navId) {
      navigate(`/${page}/${navId}`);
    } else {
      navigate(`/${page}`);
    }
  };

  return <SelectBuyerPage productId={id || ''} onNavigate={handleNavigate} />;
}

export function ChatRoomWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleNavigate = (page: string, navId?: string) => {
    if (page === 'review-write' && navId) {
      // navId는 JSON 문자열로 전달됨
      try {
        const payload = JSON.parse(navId) as ReviewNavigationPayload;
        navigate('/review-write', { state: { payload } });
        return;
      } catch (e) {
        console.error('Failed to parse review payload', e);
      }
    }
    if (navId) {
      navigate(`/${page}/${navId}`);
    } else {
      navigate(`/${page}`);
    }
  };

  return <ChatPage chatId={id || ''} onNavigate={handleNavigate} />;
}

export function ReviewWriteWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { payload?: ReviewNavigationPayload } | null;
  const payload = state?.payload ?? null;

  const handleNavigate = (page: string, navId?: string) => {
    if (navId) {
      navigate(`/${page}/${navId}`);
    } else {
      navigate(`/${page}`);
    }
  };

  return <ReviewWritePage payload={payload} onNavigate={handleNavigate} />;
}

export function SellerProfileWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleNavigate = (page: string, navId?: string) => {
    if (navId) {
      navigate(`/${page}/${navId}`);
    } else {
      navigate(`/${page}`);
    }
  };

  return <SellerProfilePage sellerId={id || ''} onNavigate={handleNavigate} />;
}

export function ResellDetailWrapper({ products }: { products?: ResellProductRecord[] }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleNavigate = (page: string, navId?: string) => {
    if (navId) {
      navigate(`/${page}/${navId}`);
    } else {
      navigate(`/${page}`);
    }
  };

  return <ResellDetailPage productId={id || ''} onNavigate={handleNavigate} products={products} />;
}
