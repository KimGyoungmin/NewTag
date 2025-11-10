# Git 설정 가이드

## ✅ .gitignore 설정 완료

### 프로젝트 구조별 .gitignore

#### 1. 루트 `.gitignore`
```
NewTag/.gitignore
```
- Claude AI 워크플로우 파일
- 환경 변수 (.env)
- 아카이브 폴더
- Python 임시 파일
- OS 파일
- IDE 설정

#### 2. FrontEnd `.gitignore`
```
FrontEnd/NewTag/.gitignore
```
- node_modules
- dist (빌드 결과물)
- .env 파일들
- 로그 파일
- 에디터 설정

#### 3. BackEnd `.gitignore`
```
BackEnd/.gitignore
```
- target/ (Maven 빌드)
- .env 파일들
- IDE 설정 (IntelliJ, Eclipse 등)

---

## 🔐 환경 변수 관리

### 민감한 정보는 절대 Git에 포함하지 마세요!

**제외되는 파일들:**
- `.env`
- `.env.local`
- `.env.production`
- `application.properties` (BackEnd - 실제 DB 정보 포함 시)

**포함되는 파일들:**
- `.env.example` (템플릿만 포함)
- `application.properties.example` (권장)

---

## 📋 .env 파일 생성 방법

### FrontEnd 환경 변수

1. **템플릿 복사**
   ```bash
   cd FrontEnd/NewTag
   cp .env.example .env
   ```

2. **.env 파일 수정**
   ```env
   # Backend API
   VITE_API_BASE_URL=http://localhost:8080/api/v1

   # Firebase Configuration (실제 값으로 변경!)
   VITE_FIREBASE_API_KEY=실제_API_키
   VITE_FIREBASE_AUTH_DOMAIN=프로젝트ID.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=프로젝트ID
   VITE_FIREBASE_STORAGE_BUCKET=프로젝트ID.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=실제_ID
   VITE_FIREBASE_APP_ID=실제_앱ID
   ```

### BackEnd 환경 변수

**파일**: `BackEnd/src/main/resources/application.properties`

⚠️ **주의**: 실제 DB 정보가 들어있으면 Git에 푸시하지 마세요!

**권장 방법**:
1. `application.properties.example` 생성 (템플릿)
2. `application.properties`를 .gitignore에 추가
3. 환경 변수로 관리

```properties
# application.properties.example
spring.datasource.url=jdbc:mysql://localhost:3306/데이터베이스명
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
```

---

## 🚨 Git에 이미 추가된 민감한 파일 제거하기

만약 실수로 .env나 민감한 파일을 커밋했다면:

```bash
# Git 추적에서만 제거 (파일은 유지)
git rm --cached .env
git rm --cached FrontEnd/NewTag/.env

# 커밋
git commit -m "Remove sensitive files from git tracking"

# .gitignore에 추가되었는지 확인
git check-ignore -v .env
```

---

## 📊 현재 Git 상태 확인

### 추적되지 않아야 할 파일들

```bash
# 민감한 파일이 추적되고 있는지 확인
git ls-files | grep -E "(\.env$|\.log$|node_modules|target/)"

# 결과가 없으면 OK ✅
```

### .gitignore가 작동하는지 확인

```bash
# 특정 파일이 무시되는지 확인
git check-ignore -v .env
git check-ignore -v archive/
git check-ignore -v FrontEnd/NewTag/node_modules/

# 출력이 있으면 정상적으로 무시됨 ✅
```

---

## ✅ 체크리스트

프로젝트를 Git에 푸시하기 전에 확인하세요:

- [ ] `.env` 파일이 Git에 포함되지 않음
- [ ] `node_modules/` 폴더가 제외됨
- [ ] `dist/`, `target/` 빌드 결과물이 제외됨
- [ ] 데이터베이스 비밀번호가 포함된 파일 제외됨
- [ ] Firebase API 키가 포함된 파일 제외됨
- [ ] `.env.example` 파일은 포함됨 (템플릿)
- [ ] `DDL.sql`, `DML.sql` 스키마 파일은 포함됨

---

## 🔍 정기적인 점검

```bash
# Git 상태 확인
git status

# 추적 중인 모든 파일 확인
git ls-files

# 최근 커밋에서 민감한 파일 확인
git diff --name-only HEAD~1
```

---

**작성일**: 2025-11-10
