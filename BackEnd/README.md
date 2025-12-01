# NewTag Backend

Spring Boot 3.4.10 기반 백엔드 API 서버

## 환경 설정

### 1. 환경 변수 설정

데이터베이스 연결 정보는 환경 변수로 관리됩니다.

#### 개발 환경 설정 방법

1. `.env.example` 파일을 복사하여 `.env` 파일 생성:
   ```bash
   cp .env.example .env
   ```

2. `.env` 파일을 열어 실제 값으로 수정:
   ```properties
   DB_HOST=127.0.0.1
   DB_PORT=8080          # MySQL 기본 포트는 3306입니다
   DB_NAME=newtag
   DB_USERNAME=developer
   DB_PASSWORD=실제_비밀번호_입력
   ```

3. 환경 변수 로드 (선택사항):
   - IntelliJ IDEA: Run Configuration에서 Environment Variables 설정
   - VS Code: `.vscode/launch.json`에 환경 변수 추가
   - 터미널: `export $(cat .env | xargs)` (Linux/Mac)

#### 환경 변수 목록

| 변수명 | 설명 | 기본값 | 필수 여부 |
|--------|------|--------|-----------|
| `DB_HOST` | 데이터베이스 호스트 | 127.0.0.1 | 선택 |
| `DB_PORT` | 데이터베이스 포트 | 8080 | 선택 |
| `DB_NAME` | 데이터베이스 이름 | newtag | 선택 |
| `DB_USERNAME` | 데이터베이스 사용자명 | developer | 선택 |
| `DB_PASSWORD` | 데이터베이스 비밀번호 | 없음 | **필수** |

> **중요**: `DB_PASSWORD`는 필수 환경 변수입니다. 설정하지 않으면 애플리케이션이 시작되지 않습니다.

### 2. 데이터베이스 설정

MySQL 데이터베이스가 필요합니다.

#### MySQL 설치 확인
```bash
mysql --version
```

#### 데이터베이스 생성
프로젝트 루트의 `DDL.sql`과 `DCL.sql` 파일을 실행하세요.

```bash
mysql -u root -p < DDL.sql
mysql -u root -p < DCL.sql
```

### 3. 애플리케이션 실행

```bash
# Maven을 사용하여 실행
./mvnw spring-boot:run

# 또는 jar 파일 빌드 후 실행
./mvnw clean package
java -jar target/NewTag-0.0.1-SNAPSHOT.jar
```

## 기술 스택

- Java 17
- Spring Boot 3.4.10
- Spring Data JPA
- Spring Security
- MySQL Connector
- JWT (JSON Web Token)
- Validation

## 보안 주의사항

- `.env` 파일은 절대 Git에 커밋하지 마세요
- `.env.example`은 실제 비밀번호를 포함하지 않아야 합니다
- 프로덕션 환경에서는 강력한 비밀번호를 사용하세요
- 프로덕션 배포 시 환경 변수는 서버 환경 또는 비밀 관리 도구(AWS Secrets Manager, HashiCorp Vault 등)를 통해 관리하세요
