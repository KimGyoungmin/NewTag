-- ============================================
-- Product Dummy Data from Daangn Marketplace
-- ============================================

USE Insa6_aiservice_p3_5;

-- ============================================
-- Product Table INSERT Statements
-- ============================================
-- Note: seller_id는 3, 4, 5 (USER role)
-- category_id: 1(전자기기), 2(가구/인테리어), 3(의류잡화), 4(스포츠/레저), 5(도서)
-- Location: 광주광역시 동구 동명동 (lat: 35.1468, lon: 126.9232)

-- 전자기기 카테고리 (category_id = 1)
INSERT INTO product (price, title, content, status, location_nm, latitude, longitude, view_count, seller_id, category_id) VALUES
(280000, '아이폰12미니 64 퍼플', '아이폰12미니 64기가 퍼플 색상입니다. 사용감 있지만 정상 작동합니다. 배터리 효율 82% 정도입니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 12, 3, 1),
(190000, 'DJI 매빅미니1 드론 풀세트', 'DJI 매빅미니1 드론 풀세트입니다. 배터리 3개 포함, 케이스, 충전기 모두 포함되어 있습니다. 비행시간 총 10시간 미만으로 거의 새것입니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 25, 4, 1),
(72000, '와콤 그립 펜 KP-501E-01 새제품', '와콤 그립 펜 새제품 미개봉입니다. 선물받았는데 사용 안 해서 판매합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 8, 5, 1),
(700000, '애플워치 울트라2 49mm 티타늄 케이스', '애플워치 울트라2 티타늄 케이스입니다. 작년 12월 구매했고 거의 사용하지 않았습니다. 액정 스크래치 전혀 없습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 34, 3, 1),
(170000, '미개봉 Seagate One Touch 외장하드 4TB', 'Seagate 외장하드 4TB 미개봉 새제품입니다. 선물받았는데 필요없어서 판매합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 19, 4, 1),
(135000, '진공관 앰프', '진공관 앰프입니다. 음질 매우 좋습니다. 정상 작동 확인했습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 11, 5, 1),
(990000, 'Century 에어컨 인버터 18평 설치비 포함', 'Century 인버터 에어컨 18평형입니다. 설치비 포함 가격이며, 2년 사용했습니다. 이사 가면서 판매합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 42, 3, 1),
(79000, '삼성 제습기 AY-103DWAWK 10L', '삼성 제습기 10리터 용량입니다. 1년 사용했고 깨끗하게 관리했습니다. 정상 작동합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 15, 4, 1);

-- 가구/인테리어 카테고리 (category_id = 2)
INSERT INTO product (price, title, content, status, location_nm, latitude, longitude, view_count, seller_id, category_id) VALUES
(0, '블랙 메쉬 사무용 의자 무료나눔', '블랙 메쉬 사무용 의자 무료 나눔합니다. 직접 가져가실 분만 연락주세요. 약간의 사용감 있지만 상태 양호합니다.', 'RESERVED', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 56, 5, 2),
(35000, '흰색 외목대 란타나', '흰색 란타나 화분입니다. 꽃이 아름답게 피어있습니다. 직거래만 가능합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 7, 3, 2),
(10000, '쿠션 사각 스툴', '쿠션 사각 스툴입니다. 거실에서 사용했고 깨끗합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 9, 4, 2),
(23000, '동구밭 화이트 블룸 퍼퓸바 세트', '동구밭 화이트 블룸 퍼퓸바 세트입니다. 미개봉 새제품입니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 5, 5, 2),
(30000, '양키캔들 워머 세트 (+전구2개)', '양키캔들 워머 세트입니다. 전구 2개 포함되어 있습니다. 사용감 거의 없습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 14, 3, 2),
(50000, '카운터 테이블', '카운터 테이블입니다. 카페에서 사용하던 제품이고 상태 좋습니다. 직거래만 가능합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 22, 4, 2),
(130000, '베이커리 랙 20매', '베이커리 랙 20매 수납 가능합니다. 제빵 작업실에서 사용했고 깨끗합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 18, 5, 2),
(70000, '스텐 3단 선반', '스테인리스 3단 선반입니다. 주방이나 작업실에서 사용하기 좋습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 11, 3, 2),
(45000, '보라색꽃이 이쁜 듀란타', '보라색 꽃이 아름다운 듀란타입니다. 건강하게 잘 자라고 있습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 6, 4, 2),
(35000, '흰색 란타나', '흰색 란타나 화분입니다. 직거래만 가능합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 8, 5, 2),
(15000, '미켈란젤로 스튜팟 20cm 새상품', '미켈란젤로 스튜팟 20cm 새제품입니다. 선물받았는데 사용 안 해서 판매합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 12, 3, 2),
(13000, '인시내 도자기 밥그릇 세트', '인시내 도자기 밥그릇 세트입니다. 4인 세트이고 깨끗합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 7, 4, 2),
(15000, '트리팜 LPM 접이식 테이블 마블블랙', '트리팜 접이식 테이블입니다. 캠핑이나 야외활동에 좋습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 10, 5, 2),
(43000, '전통 자수 병풍', '전통 자수 병풍입니다. 인테리어 소품으로 좋습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 4, 3, 2),
(30000, '덕구리 화분 (붉은색)', '붉은색 덕구리 화분입니다. 직거래만 가능합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 5, 4, 2);

-- 의류잡화 카테고리 (category_id = 3)
INSERT INTO product (price, title, content, status, location_nm, latitude, longitude, view_count, seller_id, category_id) VALUES
(100000, '산드로 트위드 스커트', '산드로 트위드 스커트입니다. 한 번 착용했고 거의 새것입니다. 사이즈 44입니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 23, 5, 3),
(120000, '타임 트위드 스팽글 가디건', '타임 브랜드 트위드 스팽글 가디건입니다. 정품이고 상태 좋습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 18, 3, 3),
(50000, '클래식 트위드 자켓 네이비 FREE', '클래식 트위드 자켓 네이비 프리사이즈입니다. 봄/가을 착용하기 좋습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 15, 4, 3),
(37000, '네파 파카 105 팝니다', '네파 파카 사이즈 105입니다. 겨울 파카이고 따뜻합니다. 아이 옷이라 작아져서 판매합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 9, 5, 3),
(34000, '겨울 파카 100 팝니다', '겨울 파카 사이즈 100입니다. 초등학생 착용했고 상태 좋습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 7, 3, 3),
(12000, '와이드 핏 기모 트레이닝 팬츠(그레이)', '와이드 핏 기모 트레이닝 팬츠 그레이 색상입니다. 거의 새것입니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 11, 4, 3),
(12000, '검정색 가디건 팝니다', '검정색 가디건입니다. 얇은 소재라 봄/가을 착용하기 좋습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 6, 5, 3),
(12000, '검정색 와이드 핏 슬랙스 팝니다', '검정색 와이드 핏 슬랙스입니다. 정장 바지로 착용했고 상태 양호합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 13, 3, 3),
(15000, '프릴 나시', '프릴 나시 상의입니다. 여름 착용하기 좋습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 5, 4, 3),
(20000, '에이블리 순느 원피스', '에이블리 순느 브랜드 원피스입니다. 한 번 착용했고 깨끗합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 17, 5, 3),
(13000, '여리핏 티셔츠', '여리핏 티셔츠입니다. 데일리로 착용하기 좋습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 8, 3, 3),
(5000, 'TATE 롱 가디건 M', 'TATE 브랜드 롱 가디건 M사이즈입니다. 사용감 있지만 상태 양호합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 9, 4, 3),
(9000, '센터폴 기모 맨투맨 95사이즈', '센터폴 기모 맨투맨 95사이즈입니다. 아이 옷이고 깨끗합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 6, 5, 3),
(12000, '컬쳐콜 카키 야상 점퍼 55사이즈', '컬쳐콜 카키 야상 점퍼 55사이즈입니다. 가을/봄 착용하기 좋습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 10, 3, 3),
(1000000, '구찌 레더 주미 미니', '구찌 정품 레더 주미 미니백입니다. 구매 영수증 있습니다. 거의 새것입니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 89, 4, 3),
(700000, '버버리 미니포켓 토트백 블랙 탄', '버버리 정품 미니포켓 토트백 블랙 탄 색상입니다. 정품 인증서 포함입니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 67, 5, 3),
(2000000, '디올 미디움 레이디 백 까나쥬', '디올 레이디 백 까나쥬 패턴입니다. 미디움 사이즈이고 정품입니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 125, 3, 3),
(3000000, '루이비통 쿠상 모노그램 pm 네이비', '루이비통 쿠상 PM 사이즈 네이비 색상입니다. 한정판이고 희소성 높습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 178, 4, 3),
(800000, '셀린느 벨트백 미니', '셀린느 벨트백 미니 사이즈입니다. 정품이고 상태 매우 좋습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 72, 5, 3),
(2200000, '루이비통 미니 도핀', '루이비통 미니 도핀백입니다. 정품이고 거의 사용하지 않았습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 98, 3, 3),
(2800000, '몽클레어 클루니 후드 다운 패딩 블랙 7사이즈', '몽클레어 클루니 후드 다운 패딩 블랙 7사이즈입니다. 정품이고 작년 겨울 구매했습니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 145, 4, 3);

-- 스포츠/레저 카테고리 (category_id = 4)
INSERT INTO product (price, title, content, status, location_nm, latitude, longitude, view_count, seller_id, category_id) VALUES
(30000, 'E-Run Bike 전기 자전거', 'E-Run Bike 전기 자전거입니다. 배터리 충전 가능하고 정상 작동합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 28, 5, 4),
(80000, '전동 스쿠터 화이트', '전동 스쿠터 화이트 색상입니다. 배터리 효율 좋고 정상 작동합니다.', 'SOLD_OUT', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 76, 3, 4),
(30000, '차광망 98프로 새거', '차광망 98프로 차광률 새제품입니다. 미사용 상태입니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 5, 4, 4),
(20000, '반코팅장갑', '반코팅 작업용 장갑입니다. 대량으로 판매합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 3, 5, 4);

-- 도서 카테고리 (category_id = 5)
INSERT INTO product (price, title, content, status, location_nm, latitude, longitude, view_count, seller_id, category_id) VALUES
(12345, '비룡소 북클럽 비버 그림동화 창작동화', '비룡소 북클럽 비버 그림동화 창작동화 세트입니다. 전집으로 30권 정도 됩니다. 상태 양호합니다.', 'ON_SELL', '광주광역시 동구 동명동', 35.1468000, 126.9232000, 14, 3, 5);


-- ============================================
-- P_IMG Table INSERT Statements
-- ============================================
-- 각 상품에 대한 이미지 URL 추가
-- product_id는 위에서 생성된 상품 순서대로 1부터 시작

-- 전자기기 상품 이미지 (product_id 1-8)
INSERT INTO p_img (p_img, is_main, product_id) VALUES
('https://img.kr.gcp-karroter.net/origin/article/202510/1761917225167a721afadf273ee8ac0d2088fc8c0c232f9d3039361bc45cb427a7934bcec23c60.webp', TRUE, 1),
('https://img.kr.gcp-karroter.net/origin/article/202511/1762568771399f912a245b2b6675376b7bfa094c708f3f67646ec800d01638f3b2477e4c114210.webp', TRUE, 2),
('https://img.kr.gcp-karroter.net/origin/article/202510/17603177152284c0513d69c4d397c0e0188b8811829f94bd77732c05387c4c7300728bfd0bc340.webp', TRUE, 3),
('https://img.kr.gcp-karroter.net/origin/article/202511/1762733463324eeb7453a8f5d5b0e25752c866b9ea8d08fbcd8a6ba9da0b952b4ca21009a072b0.webp', TRUE, 4),
('https://img.kr.gcp-karroter.net/origin/article/202511/176273757074302f77fe3589b4b1a00eb0a502a5c897de172eea7f6d5bec7019ef48aaef646f51.webp', TRUE, 5),
('https://img.kr.gcp-karroter.net/origin/article/202511/1762420486608feafc69eb0cac5cfd4f901cc08d77410485f905fd53d11935b0e07a241cd89360.webp', TRUE, 6),
('https://img.kr.gcp-karroter.net/origin/article/202511/9a7743006d53b7987b0f385c90f5e4d6889d71e53f39c7ececca8d13d6363672_0.webp', TRUE, 7),
('https://img.kr.gcp-karroter.net/origin/article/202510/bbb86d6709bc5e40377ac51329cd8e12db778805b36bb191fb06c13ebb881e24_0.webp', TRUE, 8);

-- 가구/인테리어 상품 이미지 (product_id 9-23)
INSERT INTO p_img (p_img, is_main, product_id) VALUES
('https://img.kr.gcp-karroter.net/origin/article/202511/1762745708892a4501b07cf14ac334d910b63a93c7e1f7c137ccdbb164ee2258de060c90e39820.webp', TRUE, 9),
('https://img.kr.gcp-karroter.net/origin/article/202508/b635ca01a64507e5d3dad93ae1305c0719ffce7e03837329e590197d77e599ce_0.webp', TRUE, 10),
('https://img.kr.gcp-karroter.net/origin/article/202511/1762420212160feafc69eb0cac5cfd4f901cc08d77410485f905fd53d11935b0e07a241cd89360.webp', TRUE, 11),
('https://img.kr.gcp-karroter.net/origin/article/202511/1762078379291593fa2f4322ad832442cf33f475a626f1ac625802c752668aad2c75c4111705d0.webp', TRUE, 12),
('https://img.kr.gcp-karroter.net/origin/article/202511/1762163596012593fa2f4322ad832442cf33f475a626f1ac625802c752668aad2c75c4111705d0.webp', TRUE, 13),
('https://img.kr.gcp-karroter.net/origin/article/202511/1762245772676662608cf3b770112dc133278c47dafe958725ebdfab0b092f110f079e55e76450.webp', TRUE, 14),
('https://img.kr.gcp-karroter.net/origin/article/202511/1762245843457662608cf3b770112dc133278c47dafe958725ebdfab0b092f110f079e55e76450.webp', TRUE, 15),
('https://img.kr.gcp-karroter.net/origin/article/202511/ab91a483fe84551daf7ce37e8ed115c7a8542a4dec524f70bce01ee93db36668_0.webp', TRUE, 16),
('https://img.kr.gcp-karroter.net/origin/article/202511/ea0d0f245beeb9d3c312abfd5e6d026b04bf3f868328567ea1cdcce46a59f6f0_0.webp', TRUE, 17),
('https://img.kr.gcp-karroter.net/origin/article/202510/8e20d07c2cb82e3ce8874df8b134d674b88901ebd730f0d45ca3c2aef7b4b989_0.webp', TRUE, 18),
('https://img.kr.gcp-karroter.net/origin/article/202508/b635ca01a64507e5d3dad93ae1305c0719ffce7e03837329e590197d77e599ce_0.webp', TRUE, 19),
('https://img.kr.gcp-karroter.net/origin/article/202510/c5df934146e75ffb288fa4843952c7c4d7a8826638b62eb6063b9cf18882e86a_0.webp', TRUE, 20),
('https://img.kr.gcp-karroter.net/origin/article/202510/976efd84a35908f2b38125ca375ba57e4c53ee7814f6873f2d9a5d6942ccad9b_0.webp', TRUE, 21),
('https://img.kr.gcp-karroter.net/origin/article/202510/aec4716957b2738409cdbb2f2f1f2a6360f2de77253a77f6553a5ebeb294e849_0.webp', TRUE, 22),
('https://img.kr.gcp-karroter.net/origin/article/202511/85375c922f6cdc337ad4239e853efa1afc3f09b8ddf1c585a179814b8063277d_0.webp', TRUE, 23);

-- 의류잡화 상품 이미지 (product_id 24-44)
INSERT INTO p_img (p_img, is_main, product_id) VALUES
('https://img.kr.gcp-karroter.net/origin/article/202511/17622615038012003da66801e80f2b6c0809b90ebd1eb7c36eb82cfbbd4dc01eec99c06877de60.webp', TRUE, 24),
('https://img.kr.gcp-karroter.net/origin/article/202510/1761311553516005016cd3af715afe31da1d0d931940ddff7c8f5d3282fb85e4aa9f4a1be23df0.webp', TRUE, 25),
('https://img.kr.gcp-karroter.net/origin/article/202511/17622615038012003da66801e80f2b6c0809b90ebd1eb7c36eb82cfbbd4dc01eec99c06877de60.webp', TRUE, 26),
('https://img.kr.gcp-karroter.net/origin/article/202510/7ba23f97f7f7fa1bd27d23fd469fcba7fd5d8eafbcd974966e5b0c9c703b9f64_0.webp', TRUE, 27),
('https://img.kr.gcp-karroter.net/origin/article/202510/14c3fc9f41631b88df31a2340f1eac9888a6631030e520a84f2b44acb71c6693_0.webp', TRUE, 28),
('https://img.kr.gcp-karroter.net/origin/article/202510/d2fd829ced7401514c2c398d0bb6a0eab18c9059a85926998cb32423379f75f6_0.webp', TRUE, 29),
('https://img.kr.gcp-karroter.net/origin/article/202510/19293d7ad3eeeecd54cabaffeaabc57dc210f6c0ef7a217ec064f204f5505bd2_0.webp', TRUE, 30),
('https://img.kr.gcp-karroter.net/origin/article/202510/ab3c72a1e4bd0a9a7788e6955e5772b9b2d38b270c6bfda73f3638fae325a2cf_0.webp', TRUE, 31),
('https://img.kr.gcp-karroter.net/origin/article/202507/175151495254556ed226718ece8ad43655bcead5a963900d2f2574c38e5a13756d3a81cf2c8660.jpg', TRUE, 32),
('https://img.kr.gcp-karroter.net/origin/article/202508/175506019961556ed226718ece8ad43655bcead5a963900d2f2574c38e5a13756d3a81cf2c8660.jpg', TRUE, 33),
('https://img.kr.gcp-karroter.net/origin/article/202510/176057475707756ed226718ece8ad43655bcead5a963900d2f2574c38e5a13756d3a81cf2c8660.webp', TRUE, 34),
('https://img.kr.gcp-karroter.net/origin/article/202509/c999ae20768f68c3b88ad28b42b61034ef7bb1659e6b3cf2125b9797d69c1a1c_0.webp', TRUE, 35),
('https://img.kr.gcp-karroter.net/origin/article/202509/0ff165341dbb478f42fe6f9d08cdffd415090e2534e9826fa49cb2b8c1c15d2e_0.webp', TRUE, 36),
('https://img.kr.gcp-karroter.net/origin/article/202510/e4754048f15c1d76f6e2fa5ba8ad204095d4e0824b24066a2a8090f8c64b680b_0.webp', TRUE, 37),
('https://img.kr.gcp-karroter.net/origin/article/202509/53aa4b0d366a833bec4c9d2ff0b234c8c95cb75424d1d634f8eabb6716eac222_0.webp', TRUE, 38),
('https://img.kr.gcp-karroter.net/origin/article/202509/807a0cfd7bafb06de568a686410b2a5582c5b31b5658ee03eda3b0ec723c8a07_0.webp', TRUE, 39),
('https://img.kr.gcp-karroter.net/origin/article/202509/5ed47c94056ca494735b9e80bb834e266178249181f25b4b4db9b14a9932aa5a_0.webp', TRUE, 40),
('https://img.kr.gcp-karroter.net/origin/article/202509/8e5083ae40e1d816ba60af8e397f0a743151b07700d34890b3735802aab04bd0_0.webp', TRUE, 41),
('https://img.kr.gcp-karroter.net/origin/article/202509/ff0d0cf387d4ae7d42c704cd17a87e3da0d126469d31e474a22cedfa82f36d39_0.webp', TRUE, 42),
('https://img.kr.gcp-karroter.net/origin/article/202509/c999ae20768f68c3b88ad28b42b61034ef7bb1659e6b3cf2125b9797d69c1a1c_0.webp', TRUE, 43),
('https://img.kr.gcp-karroter.net/origin/article/202511/85375c922f6cdc337ad4239e853efa1afc3f09b8ddf1c585a179814b8063277d_0.webp', TRUE, 44);

-- 스포츠/레저 상품 이미지 (product_id 45-48)
INSERT INTO p_img (p_img, is_main, product_id) VALUES
('https://img.kr.gcp-karroter.net/origin/article/202511/176274260168383fb26a9825f9c1a15928e1e1ffde67f8bacbea07afbebc9ea0939a28d2848620.webp', TRUE, 45),
('https://img.kr.gcp-karroter.net/origin/article/202511/176274164431283fb26a9825f9c1a15928e1e1ffde67f8bacbea07afbebc9ea0939a28d2848620.webp', TRUE, 46),
('https://img.kr.gcp-karroter.net/origin/article/202508/175505662777041afbebc4542660432ccd034c1626f6b499dacef82f1c595cd9b8f310b919e3a0.jpg', TRUE, 47),
('https://img.kr.gcp-karroter.net/origin/article/202508/175445058552141afbebc4542660432ccd034c1626f6b499dacef82f1c595cd9b8f310b919e3a0.jpg', TRUE, 48);

-- 도서 상품 이미지 (product_id 49)
INSERT INTO p_img (p_img, is_main, product_id) VALUES
('https://img.kr.gcp-karroter.net/origin/article/202509/32b9268f3d8b95a1fa599f26600f3b8a67c88e3269545bcb66b72fe3f3aac9dd_0.webp', TRUE, 49);

-- 추가 이미지 (서브 이미지들 - 일부 상품에 여러 이미지 추가)
INSERT INTO p_img (p_img, is_main, product_id) VALUES
('https://img.kr.gcp-karroter.net/origin/article/202510/1761311553516005016cd3af715afe31da1d0d931940ddff7c8f5d3282fb85e4aa9f4a1be23df0.webp', FALSE, 1),
('https://img.kr.gcp-karroter.net/origin/article/202511/1762568771399f912a245b2b6675376b7bfa094c708f3f67646ec800d01638f3b2477e4c114210.webp', FALSE, 4),
('https://img.kr.gcp-karroter.net/origin/article/202511/1762245772676662608cf3b770112dc133278c47dafe958725ebdfab0b092f110f079e55e76450.webp', FALSE, 14),
('https://img.kr.gcp-karroter.net/origin/article/202509/53aa4b0d366a833bec4c9d2ff0b234c8c95cb75424d1d634f8eabb6716eac222_0.webp', FALSE, 38),
('https://img.kr.gcp-karroter.net/origin/article/202509/807a0cfd7bafb06de568a686410b2a5582c5b31b5658ee03eda3b0ec723c8a07_0.webp', FALSE, 39),
('https://img.kr.gcp-karroter.net/origin/article/202509/5ed47c94056ca494735b9e80bb834e266178249181f25b4b4db9b14a9932aa5a_0.webp', FALSE, 40);
