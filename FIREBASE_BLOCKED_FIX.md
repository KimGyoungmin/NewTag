# Firebase ERR_BLOCKED_BY_CLIENT 에러 해결 가이드

**날짜**: 2025-11-17
**이슈**: 상품 상세 페이지에서 채팅하기 버튼 클릭 시 ERR_BLOCKED_BY_CLIENT 에러 발생
**상태**: 🔄 해결 방법 제시

---

## 🔴 문제 설명

### 증상
```
상품 상세 페이지 > 채팅하기 버튼 클릭 시:
- 콘솔에 ERR_BLOCKED_BY_CLIENT 에러 표시
- 채팅방으로 이동하지 않음
- Firebase Firestore 요청이 차단됨
```

### 에러 메시지
```
Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
```

---

## 🔍 원인 분석

### 1. 광고 차단기 (가장 흔한 원인)
광고 차단 확장 프로그램이 Firebase 관련 요청을 차단:
- **AdBlock**
- **uBlock Origin**
- **AdBlock Plus**
- **Ghostery**

**차단 이유**:
- Firebase 스크립트 URL에 `firebase`, `firestore`, `analytics` 등의 키워드 포함
- 광고 추적 스크립트로 오인

### 2. 브라우저 확장 프로그램
개인정보 보호 관련 확장 프로그램:
- **Privacy Badger**
- **NoScript**
- **Disconnect**

### 3. 방화벽 또는 네트워크 정책
회사/학교 네트워크에서 Firebase 도메인 차단

### 4. CORS 정책 (가능성 낮음)
Firebase 설정 오류 시

---

## ✅ 해결 방법

### 방법 1: 광고 차단기 비활성화 (즉시 해결)

#### Chrome/Edge에서:

1. **확장 프로그램 확인**
   ```
   주소창 > 확장 프로그램 아이콘 클릭 > 사이트에서 비활성화
   ```

2. **특정 사이트에서만 비활성화** (권장)
   - AdBlock 아이콘 클릭
   - "이 페이지에서 일시중지" 선택
   - 페이지 새로고침 (F5)

3. **완전 비활성화** (테스트용)
   ```
   chrome://extensions/
   ```
   - 광고 차단 확장 프로그램 끄기
   - 페이지 새로고침

#### 확인 방법:
```javascript
// 브라우저 콘솔에서 실행
console.log('Firebase Config:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'OK' : 'Missing',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
});
```

---

### 방법 2: 화이트리스트에 Firebase 도메인 추가

#### uBlock Origin:
1. 확장 프로그램 아이콘 클릭
2. "신뢰할 수 있는 사이트" 추가:
   ```
   firebaseapp.com
   googleapis.com
   firebaseio.com
   ```

#### AdBlock Plus:
1. 설정 > 허용 목록
2. 도메인 추가:
   ```
   @@||firebaseapp.com^
   @@||googleapis.com^
   @@||gstatic.com^
   ```

---

### 방법 3: 시크릿 모드에서 테스트

1. **Chrome/Edge**:
   ```
   Ctrl + Shift + N (Windows)
   Cmd + Shift + N (Mac)
   ```

2. **확인 사항**:
   - 시크릿 모드에서 정상 작동 → 확장 프로그램 문제
   - 시크릿 모드에서도 오류 → 코드 문제

---

### 방법 4: 환경 변수 확인 (개발자용)

**`.env` 파일 확인**:
```bash
# 파일 위치: FrontEnd/NewTag/.env

# Firebase Configuration
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
```

**현재 설정값**:
```bash
✅ VITE_FIREBASE_API_KEY: AIzaSyBN1Mgp_lwoIs8cuyHRqYPCsXL0mdmsIfA
✅ VITE_FIREBASE_AUTH_DOMAIN: chatting-bd796.firebaseapp.com
✅ VITE_FIREBASE_PROJECT_ID: chatting-bd796
✅ VITE_FIREBASE_STORAGE_BUCKET: chatting-bd796.firebasestorage.app
✅ VITE_FIREBASE_MESSAGING_SENDER_ID: 972715044765
✅ VITE_FIREBASE_APP_ID: 1:972715044765:web:bc26bdc4cb8503b2a84974
```

**환경 변수 적용 확인**:
```bash
# 개발 서버 재시작
cd FrontEnd/NewTag
npm run dev
```

---

### 방법 5: Firebase SDK 버전 확인

**package.json 확인**:
```bash
cd FrontEnd/NewTag
npm list firebase
```

**최신 버전으로 업데이트** (필요시):
```bash
npm install firebase@latest
```

---

## 🧪 테스트 방법

### 1. 브라우저 콘솔 테스트

```javascript
// 개발자 도구 콘솔 (F12) 에서 실행

// Firebase 초기화 확인
import { db } from './services/firebase/config';
console.log('Firestore Instance:', db);

// Firestore 연결 테스트
import { collection, getDocs } from 'firebase/firestore';
getDocs(collection(db, 'test'))
  .then(() => console.log('✅ Firebase 연결 성공'))
  .catch(err => console.error('❌ Firebase 연결 실패:', err));
```

### 2. 네트워크 탭 확인

1. **개발자 도구** (F12)
2. **Network 탭** 선택
3. **채팅하기 버튼** 클릭
4. **필터**: `firebase` 또는 `firestore`
5. **상태 코드 확인**:
   - ✅ 200 OK → 정상
   - ❌ (failed) net::ERR_BLOCKED_BY_CLIENT → 차단됨
   - ❌ 401 Unauthorized → 인증 문제
   - ❌ 403 Forbidden → 권한 문제

### 3. 채팅하기 플로우 디버깅

```typescript
// ProductDetailPage.tsx의 handleChat 함수에 로그 추가

const handleChat = async () => {
  console.log('[1] 채팅하기 시작');
  console.log('[2] 상품 정보:', product);

  let currentUser = null;
  try {
    currentUser = await authApiService.getCurrentUser();
    console.log('[3] 현재 사용자:', currentUser);
  } catch (err) {
    console.error('[3] 사용자 조회 실패:', err);
  }

  if (!currentUser || !currentUser.id) {
    console.log('[4] 로그인 필요');
    toast.error("로그인이 필요해요.");
    return;
  }

  if (!product.seller?.id) {
    console.log('[4] 판매자 정보 없음');
    toast.error("판매자 정보가 없어요.");
    return;
  }

  try {
    console.log('[5] Firebase 채팅방 생성 시도...');
    const chatId = await chatService.getOrCreateChatRoom(
      product.id,
      {
        id: product.seller.id,
        nick: product.seller.nick,
        profileImg: product.seller.profileImg ? getFullImageUrl(product.seller.profileImg) : undefined,
      },
      {
        id: currentUser.id,
        nick: currentUser.nick,
        profileImg: currentUser.profileImg ? getFullImageUrl(currentUser.profileImg) : undefined,
      },
      {
        title: product.title,
        image: productImage,
        price: product.price,
      }
    );

    console.log('[6] 채팅방 ID:', chatId);
    onNavigate('chatroom', chatId);
    console.log('[7] 채팅방 이동 완료');
  } catch (error) {
    console.error('[ERROR] Firebase 오류:', error);
    toast.error("채팅방을 불러오지 못했어요.");
  }
};
```

---

## 🔧 코드 레벨 해결 방법

### 1. Firebase 초기화 체크 추가

`services/firebase/config.ts`:
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { FIREBASE_CONFIG } from '../../constants';

// Firebase 설정 검증
const validateFirebaseConfig = () => {
  const required = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missing = required.filter(key => !FIREBASE_CONFIG[key as keyof typeof FIREBASE_CONFIG]);

  if (missing.length > 0) {
    console.error('❌ Firebase 설정 누락:', missing);
    throw new Error(`Firebase configuration missing: ${missing.join(', ')}`);
  }

  console.log('✅ Firebase 설정 검증 완료');
};

// 검증 실행
validateFirebaseConfig();

// Firebase 초기화
export const app = initializeApp(FIREBASE_CONFIG);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log('🔥 Firebase initialized successfully');
```

### 2. 에러 핸들링 개선

`services/firebase/chatService.ts`:
```typescript
export const chatService = {
  async getOrCreateChatRoom(
    productId: number,
    seller: { id: number; nick: string; profileImg?: string },
    buyer: { id: number; nick: string; profileImg?: string },
    productInfo: { title: string; image: string; price: number }
  ): Promise<string> {
    try {
      // Firebase 연결 확인
      if (!db) {
        throw new Error('Firebase Firestore가 초기화되지 않았습니다.');
      }

      // ... 기존 로직

    } catch (error: any) {
      // 상세한 에러 로깅
      console.error('채팅방 생성 실패:', {
        error: error.message,
        code: error.code,
        productId,
        seller: seller.id,
        buyer: buyer.id
      });

      // 사용자 친화적 에러 메시지
      if (error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
        throw new Error('광고 차단 프로그램을 비활성화해주세요.');
      } else if (error.code === 'permission-denied') {
        throw new Error('Firebase 권한이 없습니다. 관리자에게 문의하세요.');
      } else {
        throw error;
      }
    }
  }
};
```

### 3. Fallback UI 추가

ProductDetailPage에 에러 메시지 개선:
```typescript
const handleChat = async () => {
  // ... 기존 로직

  try {
    const chatId = await chatService.getOrCreateChatRoom(/* ... */);
    onNavigate('chatroom', chatId);
  } catch (error: any) {
    console.error('Failed to start chat:', error);

    // 에러 종류별 메시지
    if (error.message?.includes('광고 차단')) {
      toast.error(
        "광고 차단 프로그램이 Firebase를 차단했습니다.\n" +
        "AdBlock을 이 사이트에서 비활성화하고 다시 시도해주세요.",
        { duration: 5000 }
      );
    } else {
      toast.error("채팅방을 불러오지 못했어요.");
    }
  }
};
```

---

## 📋 체크리스트

사용자용 체크리스트:

```
□ 광고 차단기 비활성화했나요?
  □ AdBlock
  □ uBlock Origin
  □ Privacy Badger
  □ 기타 확장 프로그램

□ 시크릿 모드에서 테스트해봤나요?

□ 브라우저를 재시작했나요?

□ 캐시를 삭제했나요? (Ctrl + Shift + Delete)

□ 다른 브라우저에서 테스트해봤나요?
  □ Chrome
  □ Firefox
  □ Edge
```

개발자용 체크리스트:

```
□ .env 파일에 Firebase 설정이 있나요?

□ 환경 변수가 올바르게 로드되나요?
  (콘솔: console.log(import.meta.env))

□ Firebase SDK 버전이 최신인가요?

□ Firestore 보안 규칙이 올바른가요?

□ 네트워크 탭에서 Firebase 요청이 보이나요?

□ 콘솔에 Firebase 초기화 로그가 있나요?
```

---

## 🎯 권장 해결 순서

### 사용자 (일반)
1. ✅ **시크릿 모드**에서 테스트
2. ✅ 정상 작동 → **광고 차단기** 비활성화
3. ✅ 여전히 안됨 → **브라우저 변경** 또는 **캐시 삭제**

### 개발자
1. ✅ **환경 변수** 확인 (.env)
2. ✅ **Firebase 초기화** 로그 확인
3. ✅ **네트워크 탭**에서 요청 확인
4. ✅ **에러 핸들링** 추가
5. ✅ **Firebase Console**에서 프로젝트 설정 확인

---

## 📞 추가 지원

### Firebase Console 확인
```
https://console.firebase.google.com/project/chatting-bd796
```

확인 사항:
- ✅ Firestore Database 활성화
- ✅ 보안 규칙 설정
- ✅ Storage 활성화
- ✅ Authentication 설정 (선택)

### 보안 규칙 (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 채팅방 읽기/쓰기 허용 (개발 환경)
    match /chats/{chatId} {
      allow read, write: if true; // TODO: 프로덕션에서는 인증 추가
    }

    match /chats/{chatId}/messages/{messageId} {
      allow read, write: if true;
    }
  }
}
```

**주의**: `allow read, write: if true`는 개발용입니다. 프로덕션에서는 인증 추가 필요!

---

## 🔗 참고 자료

- [Firebase 공식 문서](https://firebase.google.com/docs/web/setup)
- [ERR_BLOCKED_BY_CLIENT 해결](https://stackoverflow.com/questions/tagged/err-blocked-by-client)
- [Chrome 확장 프로그램 관리](https://support.google.com/chrome/answer/187443)
- [Firebase Firestore 보안 규칙](https://firebase.google.com/docs/firestore/security/get-started)

---

## 📝 해결 후 확인사항

✅ 채팅하기 버튼 클릭 시:
1. 콘솔에 에러 없음
2. 채팅방 페이지로 이동
3. Firebase Firestore에 채팅방 문서 생성 확인
4. 메시지 전송/수신 정상 작동

---

**문서 버전**: 1.0
**최종 업데이트**: 2025-11-17
**작성자**: Claude Code
**상태**: ✅ 해결 방법 제시 완료

