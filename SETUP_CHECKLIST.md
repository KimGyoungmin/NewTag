# 🚀 NewTag 프로젝트 설치 체크리스트

새로운 팀원이나 다른 개발자가 프로젝트를 시작할 때 사용하는 체크리스트입니다.

---

## ✅ 설치 전 체크리스트

### 필수 소프트웨어 설치 확인

```bash
# Git 확인
git --version
# 출력 예시: git version 2.x.x
# 미설치 시: https://git-scm.com/

# Node.js 확인 (v18 이상)
node --version
# 출력 예시: v18.x.x 또는 v20.x.x
# 미설치 시: https://nodejs.org/

# npm 확인
npm --version
# 출력 예시: 9.x.x 또는 10.x.x

# Java 확인 (17 이상)
java -version
# 출력 예시: openjdk version "17.x.x"
# 미설치 시: https://adoptium.net/

# Maven 확인
./BackEnd/mvnw --version
# 프로젝트에 포함된 Maven Wrapper 사용

# MySQL 확인
mysql --version
# 출력 예시: mysql Ver 8.x.x
# 미설치 시: https://dev.mysql.com/downloads/mysql/
```

---

## 📥 프로젝트 클론 및 초기 설정

### 1단계: 저장소 클론
```bash
# ✅ 1-1. 프로젝트 클론
git clone <repository-url>
cd NewTag

# ✅ 1-2. 브랜치 확인
git branch
# * dev 또는 * main 확인
```

---

## 💾 데이터베이스 설정

### 2단계: MySQL 설정

```bash
# ✅ 2-1. MySQL 서버 실행 확인
# Windows
net start MySQL80

# Mac
mysql.server start

# Linux
sudo systemctl start mysql

# ✅ 2-2. MySQL 접속
mysql -u root -p
# 비밀번호 입력
```

**MySQL 콘솔에서 실행:**
```sql
-- ✅ 2-3. 데이터베이스 생성
CREATE DATABASE Insa6_aiservice_p3_5
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- ✅ 2-4. 데이터베이스 선택
USE Insa6_aiservice_p3_5;

-- ✅ 2-5. 스키마 생성
source DDL.sql;
-- 또는 Windows: \. C:/Users/.../NewTag/DDL.sql

-- ✅ 2-6. 초기 데이터 삽입 (선택)
source DML.sql;

-- ✅ 2-7. 테이블 확인
SHOW TABLES;
-- user, product, category, transaction 등 확인

-- ✅ 2-8. 종료
exit;
```

**체크포인트:**
- [ ] 데이터베이스 생성 완료
- [ ] 테이블 10개 이상 생성 확인

---

## 🔧 BackEnd 설정

### 3단계: Spring Boot 설정

```bash
# ✅ 3-1. BackEnd 디렉토리로 이동
cd BackEnd
```

**✅ 3-2. application.properties 설정**

파일: `src/main/resources/application.properties`

```properties
# 수정 필요한 부분
spring.datasource.password=여기에_본인_MySQL_비밀번호_입력
```

**환경 변수 사용 시 (권장):**
```bash
# Windows
set DB_PASSWORD=본인_MySQL_비밀번호

# Mac/Linux
export DB_PASSWORD=본인_MySQL_비밀번호
```

**✅ 3-3. 빌드 및 실행**
```bash
# Maven 빌드
./mvnw clean install

# Spring Boot 실행
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

**✅ 3-4. 서버 실행 확인**
```bash
# 새 터미널에서 실행
curl http://localhost:8080/api/v1/health

# 또는 브라우저에서
# http://localhost:8080
```

**체크포인트:**
- [ ] 빌드 성공
- [ ] 서버가 8080 포트에서 실행 중
- [ ] 데이터베이스 연결 성공 로그 확인

**에러 발생 시:**
```bash
# 포트 충돌 확인
netstat -ano | findstr :8080  # Windows
lsof -i :8080                  # Mac/Linux

# Maven 캐시 삭제 후 재시도
./mvnw clean
./mvnw install
```

---

## 🎨 FrontEnd 설정

### 4단계: React 설정

```bash
# ✅ 4-1. FrontEnd 디렉토리로 이동
cd ../FrontEnd/NewTag
```

**✅ 4-2. .env 파일 생성**
```bash
# .env.example 복사
cp .env.example .env

# Windows
copy .env.example .env
```

**✅ 4-3. .env 파일 수정**

파일: `.env`

```env
# Backend API (기본값 유지)
VITE_API_BASE_URL=http://localhost:8080/api/v1

# Firebase 설정 (나중에 설정 가능)
VITE_FIREBASE_API_KEY=여기에_Firebase_API_키_입력
VITE_FIREBASE_AUTH_DOMAIN=프로젝트명.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=프로젝트ID
VITE_FIREBASE_STORAGE_BUCKET=프로젝트명.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=숫자ID
VITE_FIREBASE_APP_ID=앱ID
```

⚠️ **주의**: Firebase는 채팅 기능에만 필요합니다. 일단 비워두고 나중에 설정 가능!

**✅ 4-4. 의존성 설치**
```bash
npm install
```

예상 시간: 2-3분

**✅ 4-5. 개발 서버 실행**
```bash
npm run dev
```

**✅ 4-6. 브라우저에서 확인**
```
http://localhost:5173
```

**체크포인트:**
- [ ] npm install 성공
- [ ] 개발 서버가 5173 포트에서 실행 중
- [ ] 브라우저에서 페이지가 정상 표시됨

**에러 발생 시:**
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# 포트 충돌 확인
netstat -ano | findstr :5173  # Windows
lsof -i :5173                  # Mac/Linux
```

---

## 🔥 Firebase 설정 (선택사항 - 채팅 기능)

### 5단계: Firebase 프로젝트 생성

**나중에 설정해도 됩니다!** 채팅 기능이 필요할 때 진행하세요.

1. **✅ Firebase Console 접속**
   - https://console.firebase.google.com/

2. **✅ 프로젝트 추가**
   - 프로젝트 이름: NewTag (또는 원하는 이름)
   - Google Analytics: 선택사항

3. **✅ Firestore Database 활성화**
   - Firestore Database 메뉴 선택
   - 데이터베이스 만들기
   - **테스트 모드로 시작** 선택
   - 위치: asia-northeast3 (서울)

4. **✅ 웹 앱 추가**
   - 프로젝트 설정 ⚙️ → 일반 탭
   - 웹 앱 추가 (</>)
   - 앱 닉네임: NewTag Web
   - 설정 정보 복사

5. **✅ .env 파일 업데이트**
   - 복사한 Firebase 설정을 `.env`에 붙여넣기
   - 개발 서버 재시작: `npm run dev`

**체크포인트:**
- [ ] Firebase 프로젝트 생성
- [ ] Firestore Database 활성화
- [ ] 웹 앱 등록
- [ ] .env 파일 업데이트

---

## ✅ 최종 테스트

### 전체 시스템 확인

**✅ 1. 서버 상태 확인**
- [ ] MySQL 서버 실행 중
- [ ] BackEnd 서버 실행 중 (`http://localhost:8080`)
- [ ] FrontEnd 서버 실행 중 (`http://localhost:5173`)

**✅ 2. 기능 테스트**

브라우저에서 `http://localhost:5173` 접속 후:

1. **회원가입 테스트**
   - [ ] 회원가입 페이지 접속
   - [ ] 닉네임 중복 확인 작동
   - [ ] 이메일 중복 확인 작동
   - [ ] 회원가입 성공

2. **로그인 테스트**
   - [ ] 로그인 페이지 접속
   - [ ] 로그인 성공
   - [ ] 홈페이지로 리다이렉트

3. **UI 확인**
   - [ ] 헤더 표시
   - [ ] 하단 네비게이션 표시
   - [ ] 페이지 이동 정상 작동

**✅ 3. 개발자 도구 확인**
- [ ] Console에 에러 없음 (F12)
- [ ] Network 탭에서 API 호출 확인
- [ ] 200 또는 201 응답 코드 확인

---

## 🚨 문제 해결

### 자주 발생하는 문제들

#### 1. "Cannot connect to database"
```bash
# MySQL 서버 상태 확인
mysql -u root -p

# 안 되면 MySQL 재시작
# Windows: net stop MySQL80 && net start MySQL80
# Mac: mysql.server restart
```

#### 2. "Port 8080 already in use"
```bash
# 포트 사용 중인 프로세스 종료
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID번호> /F

# Mac/Linux
lsof -i :8080
kill -9 <PID>
```

#### 3. "Module not found" (FrontEnd)
```bash
cd FrontEnd/NewTag
rm -rf node_modules package-lock.json
npm install
```

#### 4. Firebase 에러 무시
Firebase를 설정하지 않았다면 콘솔에 Firebase 관련 에러가 나와도 괜찮습니다.
채팅 기능 외에는 영향이 없습니다.

---

## 📞 도움 요청

모든 단계를 시도했는데도 문제가 해결되지 않으면:

1. **에러 메시지 전체 복사**
2. **어느 단계에서 에러가 발생했는지 기록**
3. **실행 환경 정보**
   - OS: Windows / Mac / Linux
   - Node.js 버전
   - Java 버전
   - MySQL 버전

4. **이슈 등록** 또는 팀원에게 공유

---

## 🎉 설치 완료!

모든 체크박스를 확인했다면 개발을 시작할 준비가 되었습니다!

**다음 단계:**
- [INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md) - API 연결 가이드 확인
- [README.md](README.md) - 프로젝트 전체 문서 확인

---

**작성일**: 2025-11-10
