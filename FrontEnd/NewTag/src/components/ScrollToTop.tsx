import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 페이지 이동 시 스크롤을 최상단으로 이동시키는 컴포넌트
 * React Router와 함께 사용
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 페이지 경로가 변경될 때마다 스크롤을 최상단으로 이동
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
