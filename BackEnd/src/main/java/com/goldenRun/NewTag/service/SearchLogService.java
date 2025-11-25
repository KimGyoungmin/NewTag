package com.goldenRun.NewTag.service;

import com.goldenRun.NewTag.Repository.ProductRepository;
import com.goldenRun.NewTag.Repository.SearchLogRepository;
import com.goldenRun.NewTag.Repository.UserRepository;
import com.goldenRun.NewTag.entity.Product;
import com.goldenRun.NewTag.entity.SearchLog;
import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.enums.DeviceType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SearchLogService {

    private final SearchLogRepository searchLogRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    /**
     * 검색 로그 저장
     */
    public void logSearch(Long userId, String keyword, int resultCount, String deviceType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        DeviceType type = parseDeviceType(deviceType);

        SearchLog searchLog = SearchLog.builder()
                .user(user)
                .keyword(keyword)
                .resultCount(resultCount)
                .deviceType(type)
                .build();

        searchLogRepository.save(searchLog);
    }

    /**
     * 상품 클릭 로그 업데이트
     */
    public void logProductClick(Long searchLogId, Long productId) {
        SearchLog searchLog = searchLogRepository.findById(searchLogId)
                .orElseThrow(() -> new IllegalArgumentException("검색 로그를 찾을 수 없습니다."));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        searchLog.setClickedProduct(product);
        searchLog.setClickedAt(LocalDateTime.now());
    }

    /**
     * 사용자별 최근 검색어 조회
     */
    @Transactional(readOnly = true)
    public List<String> getRecentKeywords(Long userId, int limit) {
        List<String> keywords = searchLogRepository.findRecentKeywordsByUser(userId);
        return keywords.stream()
                .limit(limit)
                .toList();
    }

    /**
     * 인기 검색어 조회 (최근 7일)
     */
    @Transactional(readOnly = true)
    public List<String> getPopularKeywords(int limit) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(7);
        List<Object[]> results = searchLogRepository.findPopularKeywords(startDate);

        return results.stream()
                .limit(limit)
                .map(row -> (String) row[0])
                .toList();
    }

    /**
     * 특정 검색어 삭제
     * 사용자의 특정 검색어에 대한 모든 검색 기록을 삭제합니다.
     */
    public void deleteRecentKeyword(Long userId, String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new IllegalArgumentException("검색어가 비어있습니다.");
        }

        // 사용자 존재 확인
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 해당 사용자의 특정 키워드 검색 기록 삭제
        List<SearchLog> searchLogs = searchLogRepository.findByUserIdAndKeyword(userId, keyword);
        searchLogRepository.deleteAll(searchLogs);
    }

    /**
     * 사용자의 모든 검색 기록 삭제
     */
    public void deleteAllRecentKeywords(Long userId) {
        // 사용자 존재 확인
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 해당 사용자의 모든 검색 기록 삭제
        List<SearchLog> searchLogs = searchLogRepository.findByUserOrderByCreatedAtDesc(userId);
        searchLogRepository.deleteAll(searchLogs);
    }

    /**
     * DeviceType 파싱
     */
    private DeviceType parseDeviceType(String deviceType) {
        if (deviceType == null || deviceType.isEmpty()) {
            return DeviceType.UNKNOWN;
        }

        return switch (deviceType.toUpperCase()) {
            case "PC", "DESKTOP" -> DeviceType.PC;
            case "MOBILE", "PHONE" -> DeviceType.MOBILE;
            case "TABLET" -> DeviceType.TABLET;
            default -> DeviceType.UNKNOWN;
        };
    }
}
