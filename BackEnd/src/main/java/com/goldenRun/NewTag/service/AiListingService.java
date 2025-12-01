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

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Value("${app.upload.base-dir:uploads}")
    private String uploadBaseDir;

        private static final List<CategoryHint> CATEGORY_HINTS =
            List.of(
                    new CategoryHint("electronics", List.of("electronics", "laptop", "notebook", "phone", "mobile", "tablet", "camera")),
                    new CategoryHint("home", List.of("home", "interior", "furniture", "desk", "lamp", "organizer")),
                    new CategoryHint("fashion", List.of("fashion", "clothes", "bag", "shoe", "accessory")),
                    new CategoryHint("sports", List.of("sports", "exercise", "bike", "camping", "hiking", "fitness")),
                    new CategoryHint("book", List.of("book", "textbook", "novel", "comic"))
            );

    public AutoWriteResponse generateListing(AutoWriteRequest request) {
        if (request == null || CollectionUtils.isEmpty(request.imagePaths())) {
            throw new IllegalArgumentException("理쒖냼 1媛쒖쓽 ?대?吏 寃쎈줈媛 ?꾩슂?⑸땲??");
        }

        log.info("[AI Listing] 諛쏆? ?대?吏 寃쎈줈 媛쒖닔: {}", request.imagePaths().size());
        log.info("[AI Listing] 諛쏆? ?대?吏 寃쎈줈 紐⑸줉: {}", request.imagePaths());

        // 諛깆뿏?쒖뿉???뚯씪 議댁옱 ?щ?留?寃利앺븯怨? Python ?쒕쾭?먮뒗 ?먮낯 ?곷? 寃쎈줈 ?꾩넚
        List<String> resolvedPaths = new ArrayList<>();
        for (String imagePath : request.imagePaths()) {
            try {
                String absolutePath = resolveAbsolutePath(imagePath);
                log.info("[AI Listing] Request path resolved: {} -> {}", imagePath, absolutePath);
                resolvedPaths.add(absolutePath);
            } catch (Exception e) {
                log.error("[AI Listing] Failed to resolve path: {} - {}", imagePath, e.getMessage());
                throw e;
            }
        }

        AutoListingModelResponse modelResponse = invokeModel(resolvedPaths);
        Integer price = Optional.ofNullable(modelResponse.getPriceKRW()).filter(p -> p > 0).orElse(null);
        Category category = resolveCategory(modelResponse.getCategory());
        String forbiddenItem = Optional.ofNullable(modelResponse.getForbiddenItem())
                .orElseGet(() -> extractForbiddenItem(modelResponse.getListing()));


        return AutoWriteResponse.builder()
                .title(modelResponse.getTitle())
                .content(modelResponse.getContent())
                .price(price)
                .categoryId(category != null ? category.getId() : null)
                .categoryName(category != null ? category.getCategoryNm() : null)
                .category(modelResponse.getCategory())
                .forbiddenItem(forbiddenItem)
                .listing(modelResponse.getListing())
                .sourceImage(modelResponse.getSourceImage())
                .build();
    }

    private AutoListingModelResponse invokeModel(List<String> absolutePaths) {
        String endpoint = aiBaseUrl + "/auto-listing";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // DTO 媛앹껜 ?ъ슜 (Map ???
        AutoListingModelRequest requestDto = AutoListingModelRequest.builder()
                .imagePaths(absolutePaths)
                .build();

        log.info("[AI Listing] AI ?쒕쾭 ?몄텧 - endpoint: {}", endpoint);
        log.info("[AI Listing] ?꾩넚??requestDto: {}", requestDto);
        log.info("[AI Listing] absolutePaths 媛쒖닔: {}, ?댁슜: {}", absolutePaths.size(), absolutePaths);

        HttpEntity<AutoListingModelRequest> requestEntity = new HttpEntity<>(requestDto, headers);

        try {
            ResponseEntity<AutoListingModelResponse> response =
                    restTemplate.exchange(endpoint, HttpMethod.POST, requestEntity, AutoListingModelResponse.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalStateException("AI ?쒕쾭 ?묐떟??諛쏆? 紐삵뻽?듬땲??");
            }
            log.info("[AI Listing] AI ?쒕쾭 ?묐떟 ?깃났");
            return response.getBody();
        } catch (RestClientException ex) {
            log.error("[AI Listing] AI ?쒕쾭 ?몄텧 ?ㅽ뙣 - endpoint: {}, error: {}", endpoint, ex.getMessage());
            log.error("[AI Listing] ?꾩넚 ?ㅽ뙣??requestDto: {}", requestDto);
            log.error("AI ?쒕쾭 ?몄텧 ?ㅽ뙣 ?곸꽭", ex);
            throw new IllegalStateException("AI ?먮룞 ?묒꽦 ?쒕쾭? ?듭떊???ㅽ뙣?덉뒿?덈떎.", ex);
        }
    }

    private String extractForbiddenItem(Map<String, Object> listing) {
        if (listing == null) {
            return null;
        }
        Object value = listing.get("forbiddenItem");
        if (value == null) {
            value = listing.get("forbidden_item");
        }
        return value != null ? String.valueOf(value) : null;
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
            throw new IllegalArgumentException("?섎せ???대?吏 寃쎈줈?낅땲??");
        }

        log.debug("[AI Listing] resolveAbsolutePath ?쒖옉 - rawPath: {}", rawPath);
        log.debug("[AI Listing] uploadDir ?ㅼ젙媛? {}", uploadDir);
        log.debug("[AI Listing] uploadBaseDir ?ㅼ젙媛? {}", uploadBaseDir);

        String normalized = rawPath.replace("\\", "/").strip();
        Path initial = Paths.get(normalized);

        log.debug("[AI Listing] normalized path: {}", normalized);
        log.debug("[AI Listing] initial path isAbsolute: {}", initial.isAbsolute());

        if (initial.isAbsolute()) {
            if (!Files.exists(initial)) {
                log.error("[AI Listing] ?덈? 寃쎈줈 ?뚯씪??議댁옱?섏? ?딆쓬: {}", initial);
                throw new IllegalArgumentException("?대?吏 ?뚯씪??李얠쓣 ???놁뒿?덈떎: " + initial);
            }
            log.debug("[AI Listing] ?덈? 寃쎈줈 ?뚯씪 李얠쓬: {}", initial);
            return initial.toString();
        }

        List<Path> candidates = new ArrayList<>();
        if (StringUtils.hasText(uploadDir)) {
            Path candidate = buildCandidate(Paths.get(uploadDir), normalized);
            candidates.add(candidate);
            log.debug("[AI Listing] uploadDir ?꾨낫 寃쎈줈: {}", candidate);
        }
        if (StringUtils.hasText(uploadBaseDir)) {
            Path candidate = buildCandidate(Paths.get(uploadBaseDir), normalized);
            candidates.add(candidate);
            log.debug("[AI Listing] uploadBaseDir ?꾨낫 寃쎈줈: {}", candidate);
        }

        for (Path candidate : candidates) {
            if (candidate != null) {
                log.debug("[AI Listing] ?꾨낫 寃쎈줈 ?뺤씤 以? {} (exists: {})", candidate, Files.exists(candidate));
                if (Files.exists(candidate)) {
                    log.info("[AI Listing] ?대?吏 ?뚯씪 李얠쓬: {}", candidate);
                    return candidate.toString();
                }
            }
        }

        log.error("[AI Listing] 紐⑤뱺 ?꾨낫 寃쎈줈?먯꽌 ?뚯씪??李얠? 紐삵븿: {}", candidates);
        throw new IllegalArgumentException("?대?吏 ?뚯씪??李얠쓣 ???놁뒿?덈떎: " + candidates);
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
    @lombok.NoArgsConstructor
    private static class AutoListingModelResponse {
        private String title;
        private String content;

        @JsonProperty("priceKRW")
        private Integer priceKRW;

        @JsonProperty("category")
        private String category;

        @JsonProperty("source_image")
        private String sourceImage;

        private Map<String, Object> listing;

        @JsonProperty("forbiddenItem")
        private String forbiddenItem;

        @JsonProperty("vision_attributes")
        private Map<String, Object> visionAttributes;
    }
}


