package com.goldenRun.NewTag.service;

import com.goldenRun.NewTag.Repository.CategoryRepository;
import com.goldenRun.NewTag.Repository.ProductRepository;
import com.goldenRun.NewTag.Repository.UserRepository;
import com.goldenRun.NewTag.dto.PostDtos;
import com.goldenRun.NewTag.entity.Category;
import com.goldenRun.NewTag.entity.Product;
import com.goldenRun.NewTag.entity.ProductImage;
import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.enums.ProductStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PostService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public PostDtos.SimpleResponse createPost(PostDtos.CreateRequest request, String currentUserNick) {
        User seller = resolveCurrentUser(currentUserNick);
        Category category = resolveCategory(request.getCategoryId());

        Product product = buildProductEntity(request, seller, category);
        Product saved = productRepository.save(product);

        return toSimpleResponse(saved);
    }

    public void deletePost(Long productId, String currentUserNick) {
        User seller = resolveCurrentUser(currentUserNick);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        if (!product.getSeller().getId().equals(seller.getId())) {
            throw new AccessDeniedException("본인이 등록한 게시글만 삭제할 수 있습니다.");
        }

        product.setIs_delete(true);
        product.setUpdatedAt(LocalDateTime.now());
    }

    private User resolveCurrentUser(String currentUserNick) {
        if (!StringUtils.hasText(currentUserNick)) {
            throw new AccessDeniedException("인증된 사용자만 접근할 수 있습니다.");
        }

        User user = userRepository.findByNick(currentUserNick);
        if (user == null) {
            throw new AccessDeniedException("사용자 정보를 찾을 수 없습니다.");
        }
        return user;
    }

    private Product buildProductEntity(PostDtos.CreateRequest request, User seller, Category category) {
        Product product = Product.builder()
                .price(toBigDecimal(request.getPrice()))
                .title(request.getTitle())
                .content(request.getContent())
                .status(ProductStatus.ON_SELL)
                .location_nm(request.getLocationNm())
                .latitude(toBigDecimal(request.getLatitude()))
                .longitude(toBigDecimal(request.getLongitude()))
                .view_count(0)
                .is_delete(false)
                .isResell(Boolean.TRUE.equals(request.getIsResell()))
                .seller(seller)
                .category(category)
                .images(new ArrayList<>())
                .build();

        List<ProductImage> images = buildImageEntities(request.getImages(), product);
        product.getImages().addAll(images);

        return product;
    }

    private Category resolveCategory(Long categoryId) {
        if (categoryId == null) {
            throw new IllegalArgumentException("카테고리를 선택해 주세요.");
        }

        return categoryRepository.findById(categoryId)
                .orElseGet(() -> {
                    Category category = new Category();
                    category.setId(categoryId);
                    return category;
                });
    }

    private List<ProductImage> buildImageEntities(List<PostDtos.ImageRequest> imageRequests, Product product) {
        List<ProductImage> results = new ArrayList<>();
        if (CollectionUtils.isEmpty(imageRequests)) {
            return results;
        }

        boolean hasMain = imageRequests.stream().anyMatch(img -> Boolean.TRUE.equals(img.getIsMain()));

        for (int i = 0; i < imageRequests.size(); i++) {
            PostDtos.ImageRequest request = imageRequests.get(i);
            boolean isMain = Boolean.TRUE.equals(request.getIsMain());
            if (!hasMain && i == 0) {
                isMain = true;
            }

            ProductImage image = ProductImage.builder()
                    .path(request.getPath())
                    .is_main(isMain)
                    .product(product)
                    .build();
            results.add(image);
        }

        return results;
    }

    private PostDtos.SimpleResponse toSimpleResponse(Product product) {
        String mainImage = product.getImages().stream()
                .filter(ProductImage::getIs_main)
                .map(img -> resolveImagePath(img.getPath()))
                .findFirst()
                .orElse(resolveImagePath(null));

        return PostDtos.SimpleResponse.builder()
                .id(product.getId())
                .title(product.getTitle())
                .price(product.getPrice())
                .status(product.getStatus())
                .mainImage(mainImage)
                .isResell(product.getIsResell())
                .createdAt(product.getCreatedAt())
                .build();
    }

    private BigDecimal toBigDecimal(Double value) {
        return value == null ? null : BigDecimal.valueOf(value);
    }

    private String resolveImagePath(String path) {
        if (path == null || path.isBlank()) {
            return "/api/v1/static/p_default_img.png";
        }
        if (path.startsWith("http") || path.startsWith("/")) {
            return path;
        }
        return "/api/v1/static/" + path.replace("\\", "/");
    }
}
