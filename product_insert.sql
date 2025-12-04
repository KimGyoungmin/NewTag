USE Insa6_aiservice_p3_5;

DROP PROCEDURE IF EXISTS insert_dummy_products;
DELIMITER $$

CREATE PROCEDURE insert_dummy_products()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE rndCat INT;
    DECLARE rndSellerIdx INT;
    DECLARE rndSeller INT;
    DECLARE rndPrice INT;
    DECLARE rndView INT;
    DECLARE rndTitle VARCHAR(255);
    DECLARE rndContent TEXT;
    DECLARE imgKeyword VARCHAR(50);

    WHILE i <= 100 DO
        -- 랜덤 카테고리 (1~10, 20)
        SET rndCat = ELT(FLOOR(1 + RAND()*11), 1,2,3,4,5,6,7,8,9,10,20);

        -- 유효한 seller id 목록(19명)을 순환 배정
        SET rndSellerIdx = ((i - 1) % 19) + 1;
        CASE rndSellerIdx
            WHEN 1 THEN SET rndSeller = 1;
            WHEN 2 THEN SET rndSeller = 2;
            WHEN 3 THEN SET rndSeller = 3;
            WHEN 4 THEN SET rndSeller = 4;
            WHEN 5 THEN SET rndSeller = 5;
            WHEN 6 THEN SET rndSeller = 6;
            WHEN 7 THEN SET rndSeller = 7;
            WHEN 8 THEN SET rndSeller = 8;
            WHEN 9 THEN SET rndSeller = 9;
            WHEN 10 THEN SET rndSeller = 15;
            WHEN 11 THEN SET rndSeller = 16;
            WHEN 12 THEN SET rndSeller = 17;
            WHEN 13 THEN SET rndSeller = 18;
            WHEN 14 THEN SET rndSeller = 19;
            WHEN 15 THEN SET rndSeller = 22;
            WHEN 16 THEN SET rndSeller = 23;
            WHEN 17 THEN SET rndSeller = 24;
            WHEN 18 THEN SET rndSeller = 26;
            WHEN 19 THEN SET rndSeller = 27;
        END CASE;

        -- 랜덤 가격 및 조회수
        SET rndPrice = FLOOR(RAND()*2000000) + 5000;
        SET rndView = FLOOR(RAND()*300);

        -- 카테고리별 키워드 설정
        CASE rndCat
            WHEN 1 THEN SET imgKeyword = 'electronics';
            WHEN 2 THEN SET imgKeyword = 'furniture';
            WHEN 3 THEN SET imgKeyword = 'fashion';
            WHEN 4 THEN SET imgKeyword = 'sports';
            WHEN 5 THEN SET imgKeyword = 'books';
            WHEN 6 THEN SET imgKeyword = 'beauty';
            WHEN 7 THEN SET imgKeyword = 'kitchen';
            WHEN 8 THEN SET imgKeyword = 'baby';
            WHEN 9 THEN SET imgKeyword = 'pet';
            WHEN 10 THEN SET imgKeyword = 'object';
            WHEN 20 THEN SET imgKeyword = 'gaming';
        END CASE;

        -- 대표 상품 제목/내용
        SET rndTitle = CONCAT(imgKeyword, ' item #', i);
        SET rndContent = CONCAT('This is a dummy product for ', imgKeyword, ' category. Item #', i);

        -- PRODUCT INSERT (is_resell 컬럼 제거)
        INSERT INTO product (
            price, title, content, status, location_nm, latitude, longitude,
            view_count, seller_id, category_id
        ) VALUES (
            rndPrice, rndTitle, rndContent, 'ON_SELL',
            '서울 성수동', 37.5446, 127.0565,
            rndView, rndSeller, rndCat
        );

        -- P_IMG INSERT (방금 등록된 상품과 연동)
        INSERT INTO p_img (p_img, is_main, product_id)
        VALUES (
            CONCAT('https://source.unsplash.com/600x600/?', imgKeyword),
            TRUE,
            LAST_INSERT_ID()
        );

        SET i = i + 1;
    END WHILE;
END $$

DELIMITER ;

CALL insert_dummy_products();
DROP PROCEDURE insert_dummy_products;
