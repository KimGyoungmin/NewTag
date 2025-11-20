package com.goldenRun.NewTag.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 상품 자동 정리 스케줄러
 * - 90일 이상 소프트 삭제된 상품을 자동으로 정리
 * - 매일 새벽 3시에 실행
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProductCleanupScheduler {

    private final ProductService productService;
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 오래된 삭제 상품 정리 배치 작업
     * 매일 새벽 3시 실행 (cron: 초 분 시 일 월 요일)
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void cleanupOldDeletedProducts() {
        String startTime = LocalDateTime.now().format(FORMATTER);
        log.info("=== 상품 자동 정리 배치 작업 시작: {} ===", startTime);

        try {
            int deletedCount = productService.cleanupOldDeletedProducts();

            String endTime = LocalDateTime.now().format(FORMATTER);
            log.info("=== 상품 자동 정리 배치 작업 완료: {} | 삭제된 상품 수: {}개 ===", endTime, deletedCount);

            // 삭제된 상품이 있을 경우 알림 (향후 슬랙, 이메일 등으로 확장 가능)
            if (deletedCount > 0) {
                log.warn("주의: {}개의 상품이 완전 삭제되었습니다. 로그를 확인하세요.", deletedCount);
            }
        } catch (Exception e) {
            log.error("상품 자동 정리 배치 작업 중 오류 발생", e);
        }
    }

    /**
     * 테스트용 메서드 - 매 1시간마다 실행 (개발 환경에서만 활성화)
     * 운영 환경에서는 주석 처리 필요
     */
    // @Scheduled(cron = "0 0 * * * *")
    // public void cleanupOldDeletedProductsHourly() {
    //     log.info("=== [테스트] 상품 자동 정리 배치 작업 시작 ===");
    //     cleanupOldDeletedProducts();
    // }
}
