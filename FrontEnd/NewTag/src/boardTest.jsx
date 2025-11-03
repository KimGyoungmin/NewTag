import { useEffect, useState } from 'react';

// 단일 파일 내 스타일과 UI를 구성합니다.
// - 백엔드 주소: http://localhost:8081
// - 상단 헤더(그라데이션 + 뒤로가기 아이콘) 및 고정 푸터 구현

const API_BASE_URL = 'http://localhost:8081';
const APP_WIDTH = 393; // 스마트폰(아이폰 15 기준) 폭

function BoardTest() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/health`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setHealth(data);
      } catch (e) {
        setError(e.message || '요청 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  // 간단한 더미 데이터 (실제 데이터는 백엔드 연동 후 교체)
  const product = {
    title: '아이폰 15 프로',
    price: 800000,
    location: '서울시 강남구',
    timeAgo: '1시간 전',
    views: 142,
    likes: 23,
    seller: {
      name: '홍길동',
      grade: 'Gold 등급',
      rating: 5,
    },
  };

  return (
    <div style={styles.pageWrap}>
      {/* 헤더 */}
      <header style={styles.header}>
        <button aria-label="뒤로가기" style={styles.backBtn} onClick={() => window.history.back()}>
          {/* 심플한 화살표 아이콘 */}
          <span style={styles.backArrow}>‹</span>
        </button>
        <div style={styles.headerTitle}>상품 상세</div>
        <div style={{ width: 40 }} />
      </header>

      {/* 스크롤 영역 */}
      <main style={styles.content}>
        {/* 연결 상태 배지 */}
        <div style={styles.statusBox}>
          {loading && <span style={styles.statusText}>서버 확인 중...</span>}
          {!loading && error && (
            <span style={{ ...styles.statusText, color: '#c62828' }}>연결 실패: {error}</span>
          )}
          {!loading && !error && health && (
            <span style={{ ...styles.statusText, color: '#2e7d32' }}>연결 성공: {health.status}</span>
          )}
        </div>

        {/* 상품 이미지 영역 (예시 아이콘 대체) */}
        <div style={styles.imageBox}>
          <div style={styles.mockImage} />
        </div>

        {/* 상품 정보 */}
        <section style={styles.section}>
          <h1 style={styles.title}>{product.title}</h1>
          <div style={styles.priceRow}>
            <span role="img" aria-label="money" style={{ marginRight: 6 }}>💰</span>
            <strong style={styles.price}>{product.price.toLocaleString()}원</strong>
          </div>

          <div style={styles.metaRow}>
            <span>{product.location}</span>
            <span style={styles.dot}>•</span>
            <span>{product.timeAgo}</span>
            <span style={styles.dot}>•</span>
            <span>👁️ {product.views}</span>
            <span style={styles.dot}>•</span>
            <span>🤍 {product.likes}</span>
          </div>
        </section>

        {/* 구분선 */}
        <div style={styles.divider} />

        {/* 판매자 정보 */}
        <section style={styles.section}>
          <h2 style={styles.subTitle}>판매자 정보</h2>
          <div style={styles.sellerRow}>
            <div style={styles.avatar} />
            <div>
              <div style={styles.sellerName}>{product.seller.name}</div>
              <div style={styles.sellerMeta}>
                {'⭐'.repeat(product.seller.rating)} <span style={{ color: '#757575' }}>{product.seller.grade}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 아래 여백(고정 푸터와 겹침 방지) */}
        <div style={{ height: 96 }} />
      </main>

      {/* 고정 푸터 */}
      <footer style={styles.footer}>
        <button style={styles.wishBtn} onClick={() => alert('찜되었습니다!')}>❤ 찜</button>
        <button style={styles.chatBtn} onClick={() => alert('채팅을 시작합니다!')}>💬 채팅하기</button>
      </footer>
    </div>
  );
}

const styles = {
  pageWrap: {
    minHeight: '100dvh',
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: APP_WIDTH,
    margin: '0 auto',
  },
  header: {
    position: 'sticky',
    top: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    padding: '0 12px',
    color: '#fff',
    background: 'linear-gradient(90deg, #FF9800 0%, #FF5722 100%)',
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    border: 'none',
    background: 'transparent',
    color: '#fff',
    fontSize: 28,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { lineHeight: 1 },
  headerTitle: {
    fontSize: 16,
    fontWeight: 700,
  },
  content: {
    padding: '12px 16px 0 16px',
  },
  statusBox: {
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
  },
  imageBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 0',
  },
  mockImage: {
    width: 140,
    height: 140,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    boxShadow: 'inset 0 0 0 10px #9E9E9E',
  },
  section: {
    padding: '8px 0',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    margin: '0 0 6px 0',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    color: '#FF9800',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#616161',
    fontSize: 13,
  },
  dot: { color: '#BDBDBD' },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    margin: '12px 0',
  },
  subTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#616161',
    margin: '0 0 10px 0',
  },
  sellerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #90CAF9, #1976D2)',
  },
  sellerName: { fontWeight: 700, marginBottom: 4 },
  sellerMeta: { fontSize: 13 },
  footer: {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: 0,
    width: '100%',
    maxWidth: APP_WIDTH,
    display: 'flex',
    gap: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderTop: '1px solid #EEEEEE',
  },
  wishBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    border: '2px solid #FF6F61',
    backgroundColor: '#fff',
    color: '#FF6F61',
    fontWeight: 700,
    cursor: 'pointer',
  },
  chatBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    border: 'none',
    backgroundColor: '#FFC107',
    color: '#4E342E',
    fontWeight: 700,
    cursor: 'pointer',
  },
};

export default BoardTest;
