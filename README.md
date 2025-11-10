# NewTag - 중고 거래 플랫폼

AI 기반 상품 등록과 실시간 채팅 기능을 갖춘 중고 거래 플랫폼입니다.

## 📋 목차
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [시작하기](#-시작하기)
- [환경 설정](#-환경-설정)
- [실행 방법](#-실행-방법)
- [주요 기능](#-주요-기능)
- [문서](#-문서)

---

## 🛠 기술 스택

### FrontEnd
- **Framework**: React 18.3.1 + TypeScript
- **Build Tool**: Vite 6.0
- **UI Library**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **HTTP Client**: Axios
- **Real-time Chat**: Firebase Firestore

### BackEnd
- **Framework**: Spring Boot 3.x
- **Language**: Java 17
- **Database**: MySQL 8.0
- **ORM**: JPA/Hibernate
- **Build Tool**: Maven

---

## 📁 프로젝트 구조

```
NewTag/
├── BackEnd/                 # Spring Boot API 서버
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/goldenRun/NewTag/
│   │       │       ├── controller/
│   │       │       ├── service/
│   │       │       ├── entity/
│   │       │       └── repository/
│   │       └── resources/
│   │           └── application.properties
│   └── pom.xml
│
├── FrontEnd/NewTag/         # React 프론트엔드
│   ├── src/
│   │   ├── api/             # API 클라이언트
│   │   ├── components/      # React 컴포넌트
│   │   ├── pages/           # 페이지 컴포넌트
│   │   ├── types/           # TypeScript 타입
│   │   ├── App.tsx          # 메인 앱
│   │   └── main.jsx         # 진입점
│   ├── package.json
│   └── vite.config.js
│
├── DDL.sql                  # 데이터베이스 스키마
├── DML.sql                  # 초기 데이터
└── product.vuerd.json       # ERD 설계
```

---

## 🚀 시작하기

### 1️⃣ 필수 설치 항목

다음 소프트웨어들이 설치되어 있어야 합니다:

#### 공통
- **Git**: 버전 관리
  ```bash
  # 설치 확인
  git --version
  ```

#### FrontEnd
- **Node.js**: v18.0.0 이상 (v20 권장)
  ```bash
  # 설치 확인
  node --version
  npm --version
  ```
  - 설치: [https://nodejs.org/](https://nodejs.org/)

#### BackEnd
- **Java JDK**: 17 이상
  ```bash
  # 설치 확인
  java -version
  javac -version
  ```
  - 설치: [https://adoptium.net/](https://adoptium.net/)

- **MySQL**: 8.0 이상
  ```bash
  # 설치 확인
  mysql --version
  ```
  - 설치: [https://dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/)

#### 선택 (권장)
- **IDE**: IntelliJ IDEA (BackEnd) / VSCode (FrontEnd)
- **MySQL Workbench**: 데이터베이스 관리
- **Postman**: API 테스트

---

## ⚙️ 환경 설정

### 1. 프로젝트 Clone

```bash
git clone <repository-url>
cd NewTag
```

### 2. 데이터베이스 설정

#### MySQL 데이터베이스 생성
```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE Insa6_aiservice_p3_5 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 (선택)
CREATE USER 'newtag_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON Insa6_aiservice_p3_5.* TO 'newtag_user'@'localhost';
FLUSH PRIVILEGES;

# 데이터베이스 선택
USE Insa6_aiservice_p3_5;

# 스키마 생성
source DDL.sql;

# 초기 데이터 삽입 (선택)
source DML.sql;

# 종료
exit;
```

### 3. BackEnd 환경 변수 설정

**파일**: `BackEnd/src/main/resources/application.properties`

```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/Insa6_aiservice_p3_5?serverTimezone=UTC&characterEncoding=UTF-8
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD

# JPA Configuration
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# Server Port
server.port=8080
```

⚠️ **중요**: `YOUR_MYSQL_PASSWORD`를 실제 MySQL 비밀번호로 변경하세요!

**더 안전한 방법** (환경 변수 사용):
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/Insa6_aiservice_p3_5
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD}
```

그 후 환경 변수 설정:
```bash
# Windows
set DB_USERNAME=root
set DB_PASSWORD=your_password

# Mac/Linux
export DB_USERNAME=root
export DB_PASSWORD=your_password
```

### 4. FrontEnd 환경 변수 설정

**파일**: `FrontEnd/NewTag/.env`

```bash
# .env.example 복사
cd FrontEnd/NewTag
cp .env.example .env
```

`.env` 파일 수정:
```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8080/api/v1

# Firebase Configuration (Firebase 프로젝트 생성 후 설정)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Firebase 설정 (채팅 기능용)

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 생성
3. Firestore Database 활성화 (테스트 모드)
4. 웹 앱 추가 후 설정값을 `.env`에 복사

---

## 🎯 실행 방법

### BackEnd 실행

**방법 1: Maven 사용 (터미널)**
```bash
cd BackEnd

# 의존성 설치 및 실행
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

**방법 2: IDE 사용**
1. IntelliJ IDEA에서 `BackEnd` 폴더 열기
2. `NewTagApplication.java` 파일 열기
3. Run 버튼 클릭 (▶️)

**서버 실행 확인**:
- URL: `http://localhost:8080`
- Health Check: `http://localhost:8080/api/v1/health`

### FrontEnd 실행

```bash
cd FrontEnd/NewTag

# 1. 의존성 설치 (최초 1회만)
npm install

# 2. 개발 서버 실행
npm run dev
```

**브라우저에서 확인**:
- URL: `http://localhost:5173`

### 전체 시스템 실행 순서

1. **MySQL 서버 실행** (보통 자동 실행됨)
2. **BackEnd 서버 실행** (`http://localhost:8080`)
3. **FrontEnd 서버 실행** (`http://localhost:5173`)
4. 브라우저에서 `http://localhost:5173` 접속

---

## ✨ 주요 기능

### 현재 구현된 기능
- ✅ 회원가입 / 로그인
- ✅ 이메일 중복 확인
- ✅ 닉네임 중복 확인
- ✅ Figma 기반 UI/UX
- ✅ 반응형 디자인

### 구현 예정 기능
- 🔄 상품 등록/조회/수정/삭제
- 🔄 AI 기반 상품 등록
- 🔄 실시간 채팅 (Firebase)
- 🔄 상품 검색
- 🔄 찜하기
- 🔄 거래 후기

---

## 🔍 문제 해결

### FrontEnd 빌드 오류

```bash
# node_modules 삭제 후 재설치
cd FrontEnd/NewTag
rm -rf node_modules package-lock.json
npm install
```

### BackEnd 빌드 오류

```bash
# Maven 클린 빌드
cd BackEnd
./mvnw clean install
```

### 데이터베이스 연결 오류

1. MySQL 서버 실행 확인
   ```bash
   # Windows
   net start MySQL80

   # Mac
   mysql.server start
   ```

2. 데이터베이스 존재 확인
   ```bash
   mysql -u root -p
   SHOW DATABASES;
   ```

3. `application.properties`의 URL/사용자명/비밀번호 확인

### 포트 충돌 오류

**BackEnd (8080 포트 사용 중)**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID번호> /F

# Mac/Linux
lsof -i :8080
kill -9 <PID>
```

**FrontEnd (5173 포트 사용 중)**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID번호> /F

# Mac/Linux
lsof -i :5173
kill -9 <PID>
```

---

## 📚 문서

- [INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md) - API 연결 가이드
- [GITIGNORE_GUIDE.md](GITIGNORE_GUIDE.md) - Git 설정 가이드
- [DDL.sql](DDL.sql) - 데이터베이스 스키마
- [product.vuerd.json](product.vuerd.json) - ERD 설계

---

## 🤝 기여하기

### 브랜치 전략
- `main`: 프로덕션 코드
- `dev`: 개발 브랜치
- `feature/*`: 기능 개발
- `fix/*`: 버그 수정

### 커밋 메시지 규칙
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 업무 수정
```

---

## 📞 문의

문제가 발생하면 이슈를 등록해주세요.

---

## 📄 라이선스

이 프로젝트는 교육용으로 제작되었습니다.

---

**마지막 업데이트**: 2025-11-10
