package com.goldenRun.NewTag.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.goldenRun.NewTag.Repository.CategoryRepository;
import com.goldenRun.NewTag.dto.AiDtos.AutoWriteRequest;
import com.goldenRun.NewTag.dto.AiDtos.AutoWriteResponse;
import com.goldenRun.NewTag.entity.Category;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiListingService {

    private final RestTemplate restTemplate;
    private final CategoryRepository categoryRepository;

    @Value("${app.ai-listing.base-url:http://localhost:8002}")
    private String aiBaseUrl;

    @Value("${app.upload-dir:static/uploads}")
    private String uploadDir;

    @Value("${app.upload.base-dir:}")
    private String uploadBaseDir;

    private static final List<CategoryHint> CATEGORY_HINTS =
            List.of(
                    new CategoryHint("전자", List.of("전자", "휴대폰", "핸드폰", "모바일", "태블릿", "카메라")),
                    new CategoryHint("가구", List.of("가구", "인테리어", "의자", "책상", "조명", "수납")),
                    new CategoryHint("패션", List.of("패션", "의류", "옷", "신발", "가방", "화장품", "액세서리")),
                    new CategoryHint("스포츠", List.of("스포츠", "레저", "운동", "자전거", "캠핑", "등산", "헬스")),
                    new CategoryHint("도서", List.of("도서", "책", "교재", "소설", "만화")));

    public AutoWriteResponse generateListing(AutoWriteRequest request) {
        if (request == null || CollectionUtils.isEmpty(request.imagePaths())) {
            throw new IllegalArgumentException("최소 1개의 이미지 경로가 필요합니다.");
        }

        log.info("[AI Listing] 받은 이미지 경로 개수: {}", request.imagePaths().size());
        log.info("[AI Listing] 받은 이미지 경로 목록: {}", request.imagePaths());

        // 백엔드에서 파일 존재 여부만 검증하고, Python 서버에는 원본 상대 경로 전송
        for (String imagePath : request.imagePaths()) {
            try {
                // 파일 존재 여부 검증
                String absolutePath = resolveAbsolutePath(imagePath);
                log.info("[AI Listing] 경로 검증 성공: {} -> {}", imagePath, absolutePath);
            } catch (Exception e) {
                log.error("[AI Listing] 경로 검증 실패: {} - {}", imagePath, e.getMessage());
                throw e;
            }
        }

        // Python 서버에는 원본 상대 경로를 그대로 전송
        AutoListingModelResponse modelResponse = invokeModel(request.imagePaths());
        Integer price = Optional.ofNullable(modelResponse.getPriceKRW()).filter(p -> p > 0).orElse(null);
        Category category = resolveCategory(modelResponse.getCategory());

        return AutoWriteResponse.builder()
                .title(modelResponse.getTitle())
                .content(modelResponse.getContent())
                .price(price)
                .categoryId(category != null ? category.getId() : null)
                .categoryName(category != null ? category.getCategoryNm() : null)
                .sourceImage(modelResponse.getSourceImage())
                .build();
    }

    private AutoListingModelResponse invokeModel(List<String> absolutePaths) {
        String endpoint = aiBaseUrl + "/auto-listing";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // DTO 객체 사용 (Map 대신)
        AutoListingModelRequest requestDto = AutoListingModelRequest.builder()
                .imagePaths(absolutePaths)
                .build();

        log.info("[AI Listing] AI 서버 호출 - endpoint: {}", endpoint);
        log.info("[AI Listing] 전송할 requestDto: {}", requestDto);
        log.info("[AI Listing] absolutePaths 개수: {}, 내용: {}", absolutePaths.size(), absolutePaths);

        HttpEntity<AutoListingModelRequest> requestEntity = new HttpEntity<>(requestDto, headers);

        try {
            ResponseEntity<AutoListingModelResponse> response =
                    restTemplate.exchange(endpoint, HttpMethod.POST, requestEntity, AutoListingModelResponse.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalStateException("AI 서버 응답을 받지 못했습니다.");
            }
            log.info("[AI Listing] AI 서버 응답 성공");
            return response.getBody();
        } catch (RestClientException ex) {
            log.error("[AI Listing] AI 서버 호출 실패 - endpoint: {}, error: {}", endpoint, ex.getMessage());
            log.error("[AI Listing] 전송 실패한 requestDto: {}", requestDto);
            log.error("AI 서버 호출 실패 상세", ex);
            throw new IllegalStateException("AI 자동 작성 서버와 통신에 실패했습니다.", ex);
        }
    }

    private Category resolveCategory(String predictedCategory) {
        if (!StringUtils.hasText(predictedCategory)) {
            return null;
        }
        String normalized = normalize(predictedCategory);
        List<Category> categories = categoryRepository.findAll();
        for (Category category : categories) {
            String candidate = normalize(category.getCategoryNm());
            if (!candidate.isBlank()
                    && (candidate.contains(normalized) || normalized.contains(candidate))) {
                return category;
            }
        }

        for (CategoryHint hint : CATEGORY_HINTS) {
            if (hint.matches(normalized)) {
                Optional<Category> resolved = categoryRepository.findFirstByCategoryNmContainingIgnoreCase(hint.label());
                if (resolved.isPresent()) {
                    return resolved.get();
                }
            }
        }
        return null;
    }

    private String resolveAbsolutePath(String rawPath) {
        if (!StringUtils.hasText(rawPath)) {
            throw new IllegalArgumentException("잘못된 이미지 경로입니다.");
        }

        log.debug("[AI Listing] resolveAbsolutePath 시작 - rawPath: {}", rawPath);
        log.debug("[AI Listing] uploadDir 설정값: {}", uploadDir);
        log.debug("[AI Listing] uploadBaseDir 설정값: {}", uploadBaseDir);

        String normalized = rawPath.replace("\\", "/").strip();
        Path initial = Paths.get(normalized);

        log.debug("[AI Listing] normalized path: {}", normalized);
        log.debug("[AI Listing] initial path isAbsolute: {}", initial.isAbsolute());

        if (initial.isAbsolute()) {
            if (!Files.exists(initial)) {
                log.error("[AI Listing] 절대 경로 파일이 존재하지 않음: {}", initial);
                throw new IllegalArgumentException("이미지 파일을 찾을 수 없습니다: " + initial);
            }
            log.debug("[AI Listing] 절대 경로 파일 찾음: {}", initial);
            return initial.toString();
        }

        List<Path> candidates = new ArrayList<>();
        if (StringUtils.hasText(uploadDir)) {
            Path candidate = buildCandidate(Paths.get(uploadDir), normalized);
            candidates.add(candidate);
            log.debug("[AI Listing] uploadDir 후보 경로: {}", candidate);
        }
        if (StringUtils.hasText(uploadBaseDir)) {
            Path candidate = buildCandidate(Paths.get(uploadBaseDir), normalized);
            candidates.add(candidate);
            log.debug("[AI Listing] uploadBaseDir 후보 경로: {}", candidate);
        }

        for (Path candidate : candidates) {
            if (candidate != null) {
                log.debug("[AI Listing] 후보 경로 확인 중: {} (exists: {})", candidate, Files.exists(candidate));
                if (Files.exists(candidate)) {
                    log.info("[AI Listing] 이미지 파일 찾음: {}", candidate);
                    return candidate.toString();
                }
            }
        }

        log.error("[AI Listing] 모든 후보 경로에서 파일을 찾지 못함: {}", candidates);
        throw new IllegalArgumentException("이미지 파일을 찾을 수 없습니다: " + candidates);
    }

    private Path buildCandidate(Path baseDir, String raw) {
        if (baseDir == null) {
            return null;
        }
        Path normalizedBase = baseDir.toAbsolutePath().normalize();
        String relative = raw;
        if (relative.startsWith("static/")) {
            relative = relative.substring("static/".length());
        }
        if (relative.startsWith("uploads/")) {
            relative = relative.substring("uploads/".length());
        }
        return normalizedBase.resolve(relative).normalize();
    }

    private static String normalize(String input) {
        if (!StringUtils.hasText(input)) {
            return "";
        }
        return input.replaceAll("\\s+", "").toLowerCase(Locale.KOREAN);
    }

    private record CategoryHint(String label, List<String> keywords) {
        boolean matches(String target) {
            return keywords.stream().filter(Objects::nonNull)
                    .map(keyword -> keyword.replaceAll("\\s+", "").toLowerCase(Locale.KOREAN))
                    .anyMatch(target::contains);
        }
    }

    @Data
    @Builder
    @AllArgsConstructor
    @lombok.NoArgsConstructor
    private static class AutoListingModelRequest {
        @JsonProperty("image_paths")
        private List<String> imagePaths;
    }

    @Data
    @Builder
    @AllArgsConstructor
    private static class AutoListingModelResponse {
        private String title;
        private String content;

        @JsonProperty("priceKRW")
        private Integer priceKRW;

        @JsonProperty("category")
        private String category;

        @JsonProperty("source_image")
        private String sourceImage;
    }
}
