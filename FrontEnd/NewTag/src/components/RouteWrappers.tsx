import { useParams, useNavigate } from 'react-router-dom';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { ProductEditPage } from '../pages/ProductEditPage';
import { SelectBuyerPage } from '../pages/SelectBuyerPage';
import { ChatPage } from '../pages/ChatPage';
import { SellerProfilePage } from '../pages/SellerProfilePage';
import { ResellDetailPage } from '../pages/ResellDetailPage';

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
    if (navId) {
      navigate(`/${page}/${navId}`);
    } else {
      navigate(`/${page}`);
    }
  };

  return <ChatPage chatId={id || ''} onNavigate={handleNavigate} />;
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

export function ResellDetailWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleNavigate = (page: string, navId?: string) => {
    if (navId) {
      navigate(`/${page}/${navId}`);
    } else {
      navigate(`/${page}`);
    }
  };

  return <ResellDetailPage productId={id || ''} onNavigate={handleNavigate} />;
}
