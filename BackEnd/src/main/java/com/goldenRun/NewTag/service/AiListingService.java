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
import java.util.Map;
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
                    new CategoryHint("전자", List.of("전자", "디지털", "휴대폰", "모바일", "노트북", "카메라")),
                    new CategoryHint("가구", List.of("가구", "인테리어", "의자", "책상", "조명", "수납")),
                    new CategoryHint("패션", List.of("패션", "의류", "옷", "신발", "가방", "잡화", "액세서리")),
                    new CategoryHint("스포츠", List.of("스포츠", "레저", "운동", "자전거", "캠핑", "등산", "헬스")),
                    new CategoryHint("도서", List.of("도서", "책", "교재", "소설", "만화")));

    public AutoWriteResponse generateListing(AutoWriteRequest request) {
        if (request == null || CollectionUtils.isEmpty(request.imagePaths())) {
            throw new IllegalArgumentException("최소 한 장의 이미지 경로가 필요합니다.");
        }
        List<String> resolved = new ArrayList<>();
        for (String imagePath : request.imagePaths()) {
            resolved.add(resolveAbsolutePath(imagePath));
        }

        AutoListingModelResponse modelResponse = invokeModel(resolved);
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
        Map<String, Object> payload = Map.of("image_paths", absolutePaths);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<AutoListingModelResponse> response =
                    restTemplate.exchange(endpoint, HttpMethod.POST, requestEntity, AutoListingModelResponse.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalStateException("AI 서버 응답을 받지 못했습니다.");
            }
            return response.getBody();
        } catch (RestClientException ex) {
            log.error("AI 서버 호출 실패", ex);
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

        String normalized = rawPath.replace("\\", "/").strip();
        Path initial = Paths.get(normalized);
        if (initial.isAbsolute()) {
            if (!Files.exists(initial)) {
                throw new IllegalArgumentException("이미지 파일을 찾을 수 없습니다: " + initial);
            }
            return initial.toString();
        }

        List<Path> candidates = new ArrayList<>();
        if (StringUtils.hasText(uploadDir)) {
            candidates.add(buildCandidate(Paths.get(uploadDir), normalized));
        }
        if (StringUtils.hasText(uploadBaseDir)) {
            candidates.add(buildCandidate(Paths.get(uploadBaseDir), normalized));
        }

        for (Path candidate : candidates) {
            if (candidate != null && Files.exists(candidate)) {
                return candidate.toString();
            }
        }

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
