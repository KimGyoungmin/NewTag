# 클라우드 서버 애플리케이션 업데이트 워크플로우

이 문서는 로컬 PC에서 코드를 수정한 후, 이미지 레지스트리(Docker Hub 또는 NCP Container Registry)를 통해 실제 클라우드 서버에 변경 사항을 배포하는 표준 절차를 안내합니다.

---

## 1단계: 로컬 PC에서 작업

> 이 단계는 개발자가 자신의 PC에서 코드 수정 후, 변경된 애플리케이션을 Docker 이미지로 만들어 원격 저장소(레지스트리)에 업로드하는 과정입니다.

### 1.1. 코드 수정
- 로컬 개발 환경에서 `frontend`, `backend` 또는 `model`의 소스 코드를 수정하고 기능을 구현합니다.

### 1.2. Docker 이미지 빌드
- 수정한 서비스의 Docker 이미지를 새로 빌드합니다.
- **예시 (백엔드 코드를 수정한 경우):**
  ```bash
  docker-compose build backend
  ```
- **(팁)** 모든 서비스의 이미지를 한번에 빌드하려면 `docker-compose build`를 실행합니다.

### 1.3. 이미지 태그(Tag) 지정
- 새로 빌드된 로컬 이미지에, 레지스트리로 푸시하기 위한 새로운 이름(태그)을 부여합니다.
- **`latest` 태그를 덮어쓰거나, `v1.0.1`과 같은 버전 태그를 사용하는 것을 권장합니다.**
- **명령어 형식:**
  ```bash
  docker tag <로컬_이미지_이름>:<태그> <레지스트리_경로>/<이미지_이름>:<태그>
  ```
- **예시 (pynchomo의 Docker Hub 사용 시):**
  ```bash
  docker tag newtag-backend:latest pynchomo/newtag-backend:latest
  ```
- **예시 (NCP Container Registry 사용 시):**
  ```bash
  docker tag newtag-backend:latest newtag-backend.kr.ncr.ntruss.com/newtag-backend:latest
  ```

### 1.4. 레지스트리로 푸시(Push)
- 태그를 부여한 이미지를 원격 이미지 레지스트리로 업로드합니다.
- **명령어 형식:**
  ```bash
  docker push <레지스트리_경로>/<이미지_이름>:<태그>
  ```
- **예시 (pynchomo의 Docker Hub 사용 시):**
  ```bash
  docker push pynchomo/newtag-backend:latest
  ```
- **예시 (NCP Container Registry 사용 시):**
  ```bash
  docker push newtag-backend.kr.ncr.ntruss.com/newtag-backend:latest
  ```
- **(참고)** 푸시하기 전에 해당 레지스트리에 `docker login`이 되어 있어야 합니다.

---

## 2단계: 클라우드 서버에서 작업

> 이 단계는 서버 관리자가 레지스트리에 올라온 최신 버전의 이미지를 서버로 가져와서, 기존에 실행 중이던 컨테이너를 새로운 버전으로 교체하는 과정입니다.

### 2.1. 서버 접속
- SSH를 사용하여 네이버 클라우드 서버에 접속합니다.
- 프로젝트 디렉토리(예: `cd NewTag`)로 이동합니다.

### 2.2. `docker-compose.yml` 파일 확인
- `docker-compose.yml` 파일의 `image` 항목이 **사용하려는 이미지의 정확한 주소**로 되어 있는지 확인합니다. (예: `pynchomo/newtag-backend:latest`)
- 만약 버전 태그를 사용했다면(예: `v1.0.1`), 해당 태그로 수정해야 합니다.

### 2.3. 최신 이미지 풀(Pull)
- 레지스트리에서 변경된 최신 이미지를 서버로 내려받습니다.
- **특정 서비스만 업데이트:**
  ```bash
  docker-compose pull backend
  ```
- **모든 서비스 업데이트:**
  ```bash
  docker-compose pull
  ```

### 2.4. 서비스 재시작
- 새로 내려받은 이미지로 컨테이너를 다시 생성하고 실행합니다. `docker-compose up` 명령어는 변경된 서비스만 자동으로 재시작합니다.
- **명령어:**
  ```bash
  docker-compose up -d
  ```
- **(팁)** 특정 서비스와 그에 의존하는 서비스만 재시작하려면 `docker-compose up -d <서비스명>`을 사용할 수 있습니다.

---

## 3단계: 최종 확인

1.  **컨테이너 상태 확인:**
    - `docker ps` 명령어를 실행하여 해당 서비스의 컨테이너가 몇 초 전에 새로 생성되었는지(`Up X seconds`) 확인합니다.
2.  **서비스 접속:**
    - 웹 브라우저에서 `https://newtag.store`에 접속하여 수정한 기능이 올바르게 반영되었는지 테스트합니다.
    - `docker logs <컨테이너_이름>` 명령어로 각 서비스의 로그를 확인하여 에러가 없는지 점검합니다.
