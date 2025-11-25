import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { authApi } from '../api/auth';
import { toast } from 'sonner';

export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // 이미 처리했으면 중복 실행 방지
    if (hasProcessed.current) {
      console.log('[GoogleCallback] 이미 처리됨 - 스킵');
      return;
    }

    const handleGoogleCallback = async () => {
      hasProcessed.current = true;
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      // 에러가 있는 경우
      if (errorParam) {
        const errorMessage = '구글 로그인이 취소되었습니다.';
        setError(errorMessage);
        toast.error(errorMessage);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // 인증 코드가 없는 경우
      if (!code) {
        const errorMessage = '구글 인증 코드가 없습니다.';
        setError(errorMessage);
        toast.error(errorMessage);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        // 백엔드로 인증 코드 전송
        console.log('[GoogleCallback] 인증 코드 전송:', code);
        const response = await authApi.handleGoogleCallback(code);
        console.log('[GoogleCallback] 백엔드 응답:', response);

        if (response.success) {
          console.log('[GoogleCallback] 로그인 성공, 토큰:', response.token);
          console.log('[GoogleCallback] 사용자 정보:', response.user);

          // 인증 상태 확인
          const isAuth = authApi.isAuthenticated();
          console.log('[GoogleCallback] 인증 상태:', isAuth);

          toast.success('구글 로그인에 성공했습니다!');

          // 약간의 지연 후 리다이렉트 (auth-change 이벤트 처리 대기)
          setTimeout(() => {
            console.log('[GoogleCallback] 홈으로 이동');
            navigate('/', { replace: true });
          }, 500);
        } else {
          throw new Error(response.message || '로그인에 실패했습니다.');
        }
      } catch (err) {
        console.error('[GoogleCallback] 에러:', err);
        const errorMessage = err instanceof Error ? err.message : '구글 로그인 중 오류가 발생했습니다.';
        setError(errorMessage);
        toast.error(errorMessage);
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleGoogleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 의존성 배열 - 마운트 시 한 번만 실행

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {error ? (
          <>
            <div className="mb-4 text-red-500">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">로그인 실패</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">로그인 페이지로 이동합니다...</p>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">구글 로그인 중...</h2>
            <p className="text-muted-foreground">잠시만 기다려 주세요.</p>
          </>
        )}
      </div>
    </div>
  );
}
