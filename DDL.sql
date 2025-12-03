-- ============================================
-- DDL: 데이터베이스 및 테이블 구조 정의
-- ============================================

-- 데이터베이스 생성


USE Insa6_aiservice_p3_5;


-- user 테이블
CREATE TABLE user
(
  id             BIGINT          NOT NULL AUTO_INCREMENT COMMENT '유저 PK',
  name           VARCHAR(20)  NOT NULL COMMENT '유저 이름',
  nick           VARCHAR(50)  NOT NULL COMMENT '유저 아이디',
  password       VARCHAR(200)     NULL COMMENT '유저 비밀번호',
  email          VARCHAR(200) NOT NULL COMMENT '유저 이메일',
  phone          VARCHAR(50)      NULL COMMENT '유저 연락처',
  birth          DATE             NULL COMMENT '유저 생년월일',
  
  -- 소셜 로그인 관련
  provider       VARCHAR(20)  NOT NULL DEFAULT 'LOCAL' COMMENT '소셜 로그인 제공자 (LOCAL, GOOGLE, KAKAO, NAVER)',
  provider_id    VARCHAR(100)     NULL COMMENT '소셜 로그인 제공자 고유 ID',
  
  -- 권한 및 상태
  role           ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER' COMMENT '사용자 권한',
  is_delete      BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '유저 소프트삭제',
  trust          DOUBLE       NOT NULL DEFAULT 0.0 COMMENT '유저 신뢰점수',
  
  -- 날짜 관련
  last_login_at  DATETIME         NULL COMMENT '마지막 로그인 시간',
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '유저 생성날짜',
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '유저 수정날짜',
  
  profile_img    VARCHAR(100) NOT NULL DEFAULT 'default_img.png' COMMENT '유저 프로필 이미지',
  
  PRIMARY KEY (id),
  UNIQUE KEY unique_nick (nick),
  UNIQUE KEY unique_provider_account (provider, provider_id),
  UNIQUE KEY unique_email (email),
  
  -- 비즈니스 로직 검증
  CONSTRAINT check_user_type CHECK (
    -- LOCAL 회원: password 필수, provider_id는 NULL
    (provider = 'LOCAL' AND password IS NOT NULL AND provider_id IS NULL) 
    OR 
    -- 소셜 회원: provider_id 필수, password는 NULL
    (provider IN ('GOOGLE', 'KAKAO', 'NAVER') AND provider_id IS NOT NULL AND password IS NULL)
  )
  
) COMMENT '유저 테이블'

-- address 테이블
CREATE TABLE address
(
  id          BIGINT            NOT NULL AUTO_INCREMENT COMMENT '유저 주소 PK',
  location_nm VARCHAR(100)   NOT NULL COMMENT '유저 현재위치 지역이름',
  latitude    DECIMAL(10, 7) NOT NULL COMMENT '유저 현재위치 위도',
  longitude   DECIMAL(10, 7) NOT NULL COMMENT '유저 현재위치 경도',
  user_id     INT            NOT NULL COMMENT '유저 PK',
  PRIMARY KEY (id)
) COMMENT '유저 주소 등록 테이블';

-- category 테이블
CREATE TABLE category
(
  id          BIGINT         NOT NULL AUTO_INCREMENT COMMENT '카테고리 PK',
  category_nm VARCHAR(40) NOT NULL COMMENT '카테고리 이름',
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '카테고리 생성날짜',
  updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '카테고리 수정날짜',
  PRIMARY KEY (id),
  UNIQUE KEY unique_category_name (category_nm)
) COMMENT '상품 카테고리';

-- product 테이블
CREATE TABLE product
(
  id          BIGINT                                   NOT NULL AUTO_INCREMENT COMMENT '상품 PK',
  price       DOUBLE                                NOT NULL COMMENT '상품 가격',
  title       VARCHAR(100)                          NOT NULL COMMENT '상품 제목',
  content     TEXT                                  NOT NULL COMMENT '상품 내용',
  status      ENUM('ON_SELL','SOLD_OUT','RESERVED') NOT NULL DEFAULT 'ON_SELL' COMMENT '상품 상태',
  location_nm VARCHAR(100)                          NOT NULL COMMENT '판매지역',
  latitude    DECIMAL(10, 7)                        NOT NULL COMMENT '지역 위도',
  longitude   DECIMAL(10, 7)                        NOT NULL COMMENT '지역 경도',
  view_count  INT                                   NOT NULL DEFAULT 0 COMMENT '상품 조회수',
  is_delete   BOOLEAN                               NOT NULL DEFAULT FALSE COMMENT '상품 소프트삭제',
  created_at  DATETIME                              NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '상품 생성날짜',
  updated_at  DATETIME                              NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '상품 수정날짜',
  seller_id   INT                                   NOT NULL COMMENT '판매유저 PK',
  category_id INT                                   NOT NULL COMMENT '카테고리 PK',
  PRIMARY KEY (id)
) COMMENT '상품 테이블';



-- p_img 테이블
CREATE TABLE p_img
(
  id         BIGINT          NOT NULL AUTO_INCREMENT COMMENT '상품 이미지 pk',
  p_img      VARCHAR(100) NOT NULL DEFAULT 'p_default_img.png' COMMENT '상품 이미지',
  is_main    BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '상품 메인이미지',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '이미지 생성날짜',
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '이미지 수정날짜',
  product_id INT          NOT NULL COMMENT '상품 PK',
  PRIMARY KEY (id)
) COMMENT '상품 이미지';

-- favorite 테이블
CREATE TABLE favorite
(
  id         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '찜 PK',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '찜 생성날짜',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '찜 수정날짜',
  product_id INT      NOT NULL COMMENT '상품 PK',
  user_id    INT      NOT NULL COMMENT '유저 PK',
  PRIMARY KEY (id),
  UNIQUE KEY unique_favorite (product_id, user_id)
) COMMENT '찜(관심) 테이블';

-- transaction 테이블
CREATE TABLE transaction
(
  id         BIGINT                           NOT NULL AUTO_INCREMENT COMMENT '거래 PK',
  status     ENUM('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') NULL     DEFAULT 'PENDING' COMMENT '거래 상태',
  created_at DATETIME                      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '거래 완료날짜',
  updated_at DATETIME                      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '거래 수정날짜',
  product_id INT                           NOT NULL COMMENT '상품 PK',
  buyer_id   INT                           NOT NULL COMMENT '구매유저 PK',
  seller_id  INT                           NOT NULL COMMENT '판매유저 PK',
  PRIMARY KEY (id)
) COMMENT '거래 테이블';

-- review 테이블
CREATE TABLE review
(
  id             BIGINT      NOT NULL AUTO_INCREMENT COMMENT '후기 PK',
  rating         INT      NOT NULL COMMENT '평점 (1 ~ 5)',
  content        TEXT     NULL COMMENT '후기 내용',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '후기 생성날짜',
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '후기 수정날짜',
  transaction_id INT      NOT NULL COMMENT '해당거래 PK',
  writer_id      INT      NOT NULL COMMENT '작성자 PK',
  target_id      INT      NOT NULL COMMENT '받는사람 PK',
  PRIMARY KEY (id),
  UNIQUE KEY unique_transaction_writer (transaction_id, writer_id),

  -- CHECK 제약조건으로 1-5 범위 강제
  CONSTRAINT check_rating_range CHECK (rating >= 1 AND rating <= 5)

) COMMENT '후기 테이블';

-- search_log 테이블
CREATE TABLE search_log
(
  id                  BIGINT                                    NOT NULL AUTO_INCREMENT COMMENT '검색어 PK',
  keyword             VARCHAR(200)                              NOT NULL COMMENT '검색어',
  result_count        INT                                       NOT NULL DEFAULT 0 COMMENT '검색 결과 개수',
  clicked_at          DATETIME                                      NULL COMMENT '클릭 시간',
  device_type         ENUM('PC', 'MOBILE', 'TABLET','UNKNOWN')      NULL COMMENT '디바이스 타입',
  created_at          DATETIME                                  NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '검색 날짜',
  clicked_product_id  BIGINT                                           NULL COMMENT '상품 PK',
  user_id             BIGINT                                       NOT NULL COMMENT '유저 PK',
  PRIMARY KEY (id)
) COMMENT '검색어 로그 테이블';

-- Foreign Key 제약조건
ALTER TABLE product
  ADD CONSTRAINT FK_user_TO_product
    FOREIGN KEY (seller_id)
    REFERENCES user (id);

ALTER TABLE product
  ADD CONSTRAINT FK_category_TO_product
    FOREIGN KEY (category_id)
    REFERENCES category (id);

ALTER TABLE p_img
  ADD CONSTRAINT FK_product_TO_p_img
    FOREIGN KEY (product_id)
    REFERENCES product (id);

ALTER TABLE favorite
  ADD CONSTRAINT FK_product_TO_favorite
    FOREIGN KEY (product_id)
    REFERENCES product (id);

ALTER TABLE favorite
  ADD CONSTRAINT FK_user_TO_favorite
    FOREIGN KEY (user_id)
    REFERENCES user (id);

ALTER TABLE transaction
  ADD CONSTRAINT FK_product_TO_transaction
    FOREIGN KEY (product_id)
    REFERENCES product (id);

ALTER TABLE transaction
  ADD CONSTRAINT FK_user_TO_transaction_buyer
    FOREIGN KEY (buyer_id)
    REFERENCES user (id);

ALTER TABLE transaction
  ADD CONSTRAINT FK_user_TO_transaction_seller
    FOREIGN KEY (seller_id)
    REFERENCES user (id);

ALTER TABLE address
  ADD CONSTRAINT FK_user_TO_address
    FOREIGN KEY (user_id)
    REFERENCES user (id);

ALTER TABLE review
  ADD CONSTRAINT FK_transaction_TO_review
    FOREIGN KEY (transaction_id)
    REFERENCES transaction (id);

ALTER TABLE review
  ADD CONSTRAINT FK_user_TO_review_writer
    FOREIGN KEY (writer_id)
    REFERENCES user (id);

ALTER TABLE review
  ADD CONSTRAINT FK_user_TO_review_target
    FOREIGN KEY (target_id)
    REFERENCES user (id);

ALTER TABLE search_log
  ADD CONSTRAINT FK_user_TO_search_log
    FOREIGN KEY (user_id)
    REFERENCES user (id);

ALTER TABLE search_log
  ADD CONSTRAINT FK_product_TO_search_log
    FOREIGN KEY (clicked_product_id)
    REFERENCES product (id);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_product_seller ON product(seller_id);
CREATE INDEX idx_product_status ON product(status);
CREATE INDEX idx_product_location ON product(latitude, longitude);
CREATE INDEX idx_review_writer ON review(writer_id);
CREATE INDEX idx_review_target ON review(target_id);
CREATE INDEX idx_transaction_buyer ON transaction(buyer_id);
CREATE INDEX idx_transaction_seller ON transaction(seller_id);
CREATE INDEX idx_user_email ON user(email);
CREATE INDEX idx_user_provider ON user(provider, provider_id);
CREATE INDEX idx_user_is_delete ON user(is_delete);
CREATE INDEX idx_user_created_at ON user(created_at);
CREATE INDEX idx_search_log_user ON search_log(user_id);
CREATE INDEX idx_search_log_keyword ON search_log(keyword);
CREATE INDEX idx_search_log_created_at ON search_log(created_at);
CREATE INDEX idx_search_log_clicked_product ON search_log(clicked_product_id);