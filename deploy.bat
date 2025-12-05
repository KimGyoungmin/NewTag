@echo off
REM NewTag 배포 스크립트 (Windows용)
REM 사용법:
REM   전체 배포:   deploy.bat v1.0.3
REM   개별 배포:   deploy.bat v1.0.3 frontend
REM   여러 개:     deploy.bat v1.0.3 frontend backend

setlocal enabledelayedexpansion

if "%1"=="" (
    echo [ERROR] 버전을 지정해주세요.
    echo 사용법: deploy.bat v1.0.3 [서비스]
    echo.
    echo 예시:
    echo   deploy.bat v1.0.3                    - 전체 배포
    echo   deploy.bat v1.0.3 frontend           - frontend만
    echo   deploy.bat v1.0.3 frontend backend   - frontend와 backend만
    exit /b 1
)

set VERSION=%1
set DEPLOY_ALL=true

REM 두 번째 인자부터 서비스 이름 확인
set DEPLOY_FRONTEND=false
set DEPLOY_BACKEND=false
set DEPLOY_MODEL=false

if not "%2"=="" set DEPLOY_ALL=false

REM 인자 파싱 (간단한 방식)
if /i "%2"=="frontend" set DEPLOY_FRONTEND=true
if /i "%3"=="frontend" set DEPLOY_FRONTEND=true
if /i "%4"=="frontend" set DEPLOY_FRONTEND=true

if /i "%2"=="backend" set DEPLOY_BACKEND=true
if /i "%3"=="backend" set DEPLOY_BACKEND=true
if /i "%4"=="backend" set DEPLOY_BACKEND=true

if /i "%2"=="model" set DEPLOY_MODEL=true
if /i "%3"=="model" set DEPLOY_MODEL=true
if /i "%4"=="model" set DEPLOY_MODEL=true

REM 전체 배포면 모든 서비스 활성화
if "%DEPLOY_ALL%"=="true" (
    set DEPLOY_FRONTEND=true
    set DEPLOY_BACKEND=true
    set DEPLOY_MODEL=true
)
set NCR_FRONTEND=newtag-frontend.kr.ncr.ntruss.com
set NCR_BACKEND=newtag-backend.kr.ncr.ntruss.com
set NCR_MODEL=newtag-model.kr.ncr.ntruss.com

REM .env 파일에서 NCR 인증 정보 읽기
set ENV_FILE=BackEnd\.env
for /f "tokens=1,2 delims==" %%a in ('findstr /r "^AWS_ACCESS_KEY=" %ENV_FILE%') do set NCR_USERNAME=%%b
for /f "tokens=1,2 delims==" %%a in ('findstr /r "^AWS_SECRET_KEY=" %ENV_FILE%') do set NCR_PASSWORD=%%b

echo ========================================
if "%DEPLOY_ALL%"=="true" (
    echo NewTag 전체 배포 - 버전: %VERSION%
) else (
    echo NewTag 선택 배포 - 버전: %VERSION%
    if "%DEPLOY_FRONTEND%"=="true" echo   - Frontend
    if "%DEPLOY_BACKEND%"=="true" echo   - Backend
    if "%DEPLOY_MODEL%"=="true" echo   - Model
)
echo ========================================

REM ========================================
REM 1. NCR 로그인
REM ========================================
echo.
echo [1/5] Naver Container Registry 로그인 중...

REM Frontend Registry 로그인
if "%DEPLOY_FRONTEND%"=="true" (
    echo   - Frontend Registry 로그인...
    echo %NCR_PASSWORD% | docker login %NCR_FRONTEND% -u %NCR_USERNAME% --password-stdin >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Frontend Registry 로그인 실패
        echo 수동으로 로그인하세요: docker login %NCR_FRONTEND%
        exit /b 1
    )
)

REM Backend Registry 로그인
if "%DEPLOY_BACKEND%"=="true" (
    echo   - Backend Registry 로그인...
    echo %NCR_PASSWORD% | docker login %NCR_BACKEND% -u %NCR_USERNAME% --password-stdin >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Backend Registry 로그인 실패
        exit /b 1
    )
)

REM Model Registry 로그인
if "%DEPLOY_MODEL%"=="true" (
    echo   - Model Registry 로그인...
    echo %NCR_PASSWORD% | docker login %NCR_MODEL% -u %NCR_USERNAME% --password-stdin >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Model Registry 로그인 실패
        exit /b 1
    )
)

echo [OK] NCR 로그인 완료

REM ========================================
REM 2. 로컬 이미지 확인
REM ========================================
echo.
echo [2/5] 로컬 이미지 확인 중...

if "%DEPLOY_FRONTEND%"=="true" (
    docker image inspect newtag-frontend:latest >nul 2>&1
    if errorlevel 1 (
        echo [WARN] Frontend 이미지가 없습니다. 빌드하세요: docker-compose build frontend
        exit /b 1
    )
    echo   - Frontend 이미지 확인 완료
)

if "%DEPLOY_BACKEND%"=="true" (
    docker image inspect newtag-backend:latest >nul 2>&1
    if errorlevel 1 (
        echo [WARN] Backend 이미지가 없습니다. 빌드하세요: docker-compose build backend
        exit /b 1
    )
    echo   - Backend 이미지 확인 완료
)

if "%DEPLOY_MODEL%"=="true" (
    docker image inspect newtag-model:latest >nul 2>&1
    if errorlevel 1 (
        echo [WARN] Model 이미지가 없습니다. 빌드하세요: docker-compose build model
        exit /b 1
    )
    echo   - Model 이미지 확인 완료
)

echo [OK] 로컬 이미지 확인 완료

REM ========================================
REM 3. NCR 태그 생성
REM ========================================
echo.
echo [3/5] 서버용 태그 생성 중...

if "%DEPLOY_FRONTEND%"=="true" (
    echo   - Frontend 태그 생성...
    docker tag newtag-frontend:latest %NCR_FRONTEND%/newtag-frontend:%VERSION%
)

if "%DEPLOY_BACKEND%"=="true" (
    echo   - Backend 태그 생성...
    docker tag newtag-backend:latest %NCR_BACKEND%/newtag-backend:%VERSION%
)

if "%DEPLOY_MODEL%"=="true" (
    echo   - Model 태그 생성...
    docker tag newtag-model:latest %NCR_MODEL%/newtag-model:%VERSION%
)

echo [OK] 태그 생성 완료

REM ========================================
REM 4. NCR에 푸시
REM ========================================
echo.
echo [4/5] Naver Container Registry에 푸시 중...

if "%DEPLOY_FRONTEND%"=="true" (
    echo   - Frontend 푸시...
    docker push %NCR_FRONTEND%/newtag-frontend:%VERSION%
)

if "%DEPLOY_BACKEND%"=="true" (
    echo   - Backend 푸시...
    docker push %NCR_BACKEND%/newtag-backend:%VERSION%
)

if "%DEPLOY_MODEL%"=="true" (
    echo   - Model 푸시...
    docker push %NCR_MODEL%/newtag-model:%VERSION%
)

echo [OK] 이미지 푸시 완료

REM ========================================
REM 5. 서버 배포 가이드
REM ========================================
echo.
echo [5/5] 서버 배포 가이드
echo ========================================
echo 서버에서 다음 명령어를 실행하세요:
echo.
echo ssh user@newtag.store
echo cd /path/to/NewTag
echo.
echo docker-compose.yml 파일을 다음과 같이 수정:
echo.
if "%DEPLOY_FRONTEND%"=="true" (
    echo   frontend:
    echo     image: %NCR_FRONTEND%/newtag-frontend:%VERSION%
    echo.
)
if "%DEPLOY_BACKEND%"=="true" (
    echo   backend:
    echo     image: %NCR_BACKEND%/newtag-backend:%VERSION%
    echo.
)
if "%DEPLOY_MODEL%"=="true" (
    echo   model:
    echo     image: %NCR_MODEL%/newtag-model:%VERSION%
    echo.
)
echo 저장 후 실행:
echo   docker-compose pull
echo   docker-compose up -d
echo ========================================

REM ========================================
REM 6. 배포 정보 저장
REM ========================================
echo.
echo 배포 정보 저장 중...
(
echo 배포 버전: %VERSION%
echo 배포 시간: %date% %time%
echo 이미지:
if "%DEPLOY_FRONTEND%"=="true" echo   - %NCR_FRONTEND%/newtag-frontend:%VERSION%
if "%DEPLOY_BACKEND%"=="true" echo   - %NCR_BACKEND%/newtag-backend:%VERSION%
if "%DEPLOY_MODEL%"=="true" echo   - %NCR_MODEL%/newtag-model:%VERSION%
) > LAST_DEPLOY.txt

echo.
echo ========================================
echo [SUCCESS] 배포 준비 완료!
echo ========================================
echo 모든 이미지가 NCR에 푸시되었습니다.
echo 서버에서 docker-compose.yml을 업데이트하고 배포하세요.
echo ========================================

endlocal
