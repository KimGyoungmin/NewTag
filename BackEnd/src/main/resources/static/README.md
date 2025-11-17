# Static 리소스 폴더

이 폴더는 상품 이미지, 프로필 이미지 등의 정적 파일을 저장하는 곳입니다.

## 필수 파일

다음 기본 이미지 파일들을 이 폴더에 추가해주세요:

1. **p_default_img.png** - 상품 기본 이미지 (예: 400x400px)
2. **default_img.png** - 사용자 프로필 기본 이미지 (예: 200x200px)

## 접근 경로

- URL: `http://localhost:8081/api/v1/static/{파일명}`
- 예시: `http://localhost:8081/api/v1/static/p_default_img.png`

## 상품 이미지 저장

상품 이미지는 다음과 같은 형식으로 저장됩니다:
- 파일명: `product_{timestamp}_{random}.jpg`
- 경로: `BackEnd/src/main/resources/static/`
- DB 저장: `p_img` 테이블의 `p_img` 컬럼에 파일명만 저장

## 캐싱

정적 파일은 1시간(3600초) 동안 브라우저에 캐싱됩니다.
