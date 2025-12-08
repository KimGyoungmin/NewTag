#!/bin/bash

# NewTag 배포 스크립트
# 사용법:
#   전체 배포:   ./deploy.sh v1.0.3
#   개별 배포:   ./deploy.sh v1.0.3 frontend
#   여러 개:     ./deploy.sh v1.0.3 frontend backend

set -e  # 에러 발생 시 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 버전 체크
if [ -z "$1" ]; then
    echo -e "${RED}❌ 에러: 버전을 지정해주세요.${NC}"
    echo "사용법: ./deploy.sh v1.0.3 [서비스]"
    echo ""
    echo "예시:"
    echo "  ./deploy.sh v1.0.3                    - 전체 배포"
    echo "  ./deploy.sh v1.0.3 frontend           - frontend만"
    echo "  ./deploy.sh v1.0.3 frontend backend   - frontend와 backend만"
    exit 1
fi

VERSION=$1
DEPLOY_ALL=true
DEPLOY_FRONTEND=false
DEPLOY_BACKEND=false
DEPLOY_MODEL=false

# 두 번째 인자부터 서비스 이름 확인
shift
if [ $# -gt 0 ]; then
    DEPLOY_ALL=false
    for service in "$@"; do
        case "${service,,}" in
            frontend) DEPLOY_FRONTEND=true ;;
            backend) DEPLOY_BACKEND=true ;;
            model) DEPLOY_MODEL=true ;;
            *) echo -e "${YELLOW}⚠️  알 수 없는 서비스: $service${NC}" ;;
        esac
    done
fi

# 전체 배포면 모든 서비스 활성화
if [ "$DEPLOY_ALL" = true ]; then
    DEPLOY_FRONTEND=true
    DEPLOY_BACKEND=true
    DEPLOY_MODEL=true
fi
NCR_REGISTRY="newtag-frontend.kr.ncr.ntruss.com"
NCR_BACKEND_REGISTRY="newtag-backend.kr.ncr.ntruss.com"
NCR_MODEL_REGISTRY="newtag-model.kr.ncr.ntruss.com"

# .env 파일에서 NCR 인증 정보 읽기
ENV_FILE="BackEnd/.env"
NCR_USERNAME=$(grep "^AWS_ACCESS_KEY=" "$ENV_FILE" | cut -d '=' -f2)
NCR_PASSWORD=$(grep "^AWS_SECRET_KEY=" "$ENV_FILE" | cut -d '=' -f2)

echo -e "${GREEN}========================================${NC}"
if [ "$DEPLOY_ALL" = true ]; then
    echo -e "${GREEN}🚀 NewTag 전체 배포 - 버전: ${VERSION}${NC}"
else
    echo -e "${GREEN}🚀 NewTag 선택 배포 - 버전: ${VERSION}${NC}"
    [ "$DEPLOY_FRONTEND" = true ] && echo "  - Frontend"
    [ "$DEPLOY_BACKEND" = true ] && echo "  - Backend"
    [ "$DEPLOY_MODEL" = true ] && echo "  - Model"
fi
echo -e "${GREEN}========================================${NC}"

# ========================================
# 1. NCR 로그인
# ========================================
echo -e "\n${YELLOW}🔐 1단계: Naver Container Registry 로그인 중...${NC}"

# Frontend Registry 로그인
echo "  - Frontend Registry 로그인..."
echo "$NCR_PASSWORD" | docker login "$NCR_REGISTRY" -u "$NCR_USERNAME" --password-stdin >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend Registry 로그인 실패${NC}"
    echo "수동으로 로그인하세요: docker login $NCR_REGISTRY"
    exit 1
fi

# Backend Registry 로그인
echo "  - Backend Registry 로그인..."
echo "$NCR_PASSWORD" | docker login "$NCR_BACKEND_REGISTRY" -u "$NCR_USERNAME" --password-stdin >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend Registry 로그인 실패${NC}"
    exit 1
fi

# Model Registry 로그인
echo "  - Model Registry 로그인..."
echo "$NCR_PASSWORD" | docker login "$NCR_MODEL_REGISTRY" -u "$NCR_USERNAME" --password-stdin >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Model Registry 로그인 실패${NC}"
    exit 1
fi

echo -e "${GREEN}✅ NCR 로그인 완료${NC}"

# ========================================
# 2. 로컬 이미지 빌드 확인
# ========================================
echo -e "\n${YELLOW}📦 2단계: 로컬 이미지 확인 중...${NC}"
if ! docker image inspect newtag-frontend:latest >/dev/null 2>&1; then
    echo -e "${YELLOW}로컬 이미지가 없습니다. 빌드를 실행합니다...${NC}"
    docker-compose build
else
    echo -e "${GREEN}✅ 로컬 이미지 확인 완료${NC}"
fi

# ========================================
# 3. NCR 태그 생성
# ========================================
echo -e "\n${YELLOW}🏷️  3단계: 서버용 태그 생성 중...${NC}"

echo "  - Frontend 태그 생성..."
docker tag newtag-frontend:latest ${NCR_REGISTRY}/newtag-frontend:${VERSION}

echo "  - Backend 태그 생성..."
docker tag newtag-backend:latest ${NCR_BACKEND_REGISTRY}/newtag-backend:${VERSION}

echo "  - Model 태그 생성..."
docker tag newtag-model:latest ${NCR_MODEL_REGISTRY}/newtag-model:${VERSION}

echo -e "${GREEN}✅ 태그 생성 완료${NC}"

# ========================================
# 4. NCR에 푸시
# ========================================
echo -e "\n${YELLOW}☁️  4단계: Naver Container Registry에 푸시 중...${NC}"

echo "  - Frontend 푸시..."
docker push ${NCR_REGISTRY}/newtag-frontend:${VERSION}

echo "  - Backend 푸시..."
docker push ${NCR_BACKEND_REGISTRY}/newtag-backend:${VERSION}

echo "  - Model 푸시..."
docker push ${NCR_MODEL_REGISTRY}/newtag-model:${VERSION}

echo -e "${GREEN}✅ 이미지 푸시 완료${NC}"

# ========================================
# 5. 서버 docker-compose.yml 업데이트 가이드
# ========================================
echo -e "\n${YELLOW}📝 5단계: 서버 설정 업데이트${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "서버에서 다음 명령어를 실행하세요:"
echo ""
echo -e "${GREEN}ssh user@newtag.store${NC}"
echo -e "${GREEN}cd /path/to/NewTag${NC}"
echo ""
echo "docker-compose.yml 파일을 다음과 같이 수정:"
echo ""
echo "  frontend:"
echo "    image: ${NCR_REGISTRY}/newtag-frontend:${VERSION}"
echo ""
echo "  backend:"
echo "    image: ${NCR_BACKEND_REGISTRY}/newtag-backend:${VERSION}"
echo ""
echo "  model:"
echo "    image: ${NCR_MODEL_REGISTRY}/newtag-model:${VERSION}"
echo ""
echo "저장 후 실행:"
echo -e "${GREEN}docker-compose pull${NC}"
echo -e "${GREEN}docker-compose up -d${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ========================================
# 6. 배포 정보 저장
# ========================================
echo -e "\n${YELLOW}💾 배포 정보 저장 중...${NC}"
cat > LAST_DEPLOY.txt <<EOF
배포 버전: ${VERSION}
배포 시간: $(date)
이미지:
  - ${NCR_REGISTRY}/newtag-frontend:${VERSION}
  - ${NCR_BACKEND_REGISTRY}/newtag-backend:${VERSION}
  - ${NCR_MODEL_REGISTRY}/newtag-model:${VERSION}
EOF

echo -e "${GREEN}✅ 배포 준비 완료!${NC}"
echo -e "\n${GREEN}🎉 모든 이미지가 NCR에 푸시되었습니다.${NC}"
echo -e "${YELLOW}⚠️  서버에서 docker-compose.yml을 업데이트하고 배포하세요.${NC}"
