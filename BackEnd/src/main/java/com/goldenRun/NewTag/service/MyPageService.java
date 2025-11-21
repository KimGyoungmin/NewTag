package com.goldenRun.NewTag.service;

import com.goldenRun.NewTag.Repository.*;
import com.goldenRun.NewTag.dto.ProductDtos.ListItem;
import com.goldenRun.NewTag.dto.UserDtos.ProfileUpdateRequest;
import com.goldenRun.NewTag.dto.UserDtos.UserProfileData;
import com.goldenRun.NewTag.dto.UserDtos.PurchaseItem;
import com.goldenRun.NewTag.dto.UserDtos.ReviewItem;
import com.goldenRun.NewTag.entity.*;
import com.goldenRun.NewTag.enums.ProductStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service("MyPageService")
@RequiredArgsConstructor
@Transactional
public class MyPageService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;
    private final FavoriteRepository favoriteRepository;

    private String getCurrentUserNick() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    /** Optional 없이 User 직접 반환 */
    private User getCurrentUser() {
        String nick = getCurrentUserNick();
        User user = userRepository.findByNick(nick);

        if (user == null) {
            throw new NoSuchElementException("인증된 사용자 정보를 찾을 수 없습니다.");
        }
        return user;
    }

    // =========================================================================
    // 1. 프로필 조회
    // =========================================================================
    @Transactional(readOnly = true)
    public UserProfileData getProfile() {
        User currentUser = getCurrentUser();

        Double mannerTemperature =
                currentUser.getTrust() != null ? currentUser.getTrust().doubleValue() : 0.0;

        Long reviewCount = reviewRepository.countByTarget(currentUser);

        return UserProfileData.builder()
                .id(String.valueOf(currentUser.getId()))
                .name(currentUser.getName())
                .nickname(currentUser.getNick())
                .email(currentUser.getEmail())
                .profileImage(currentUser.getProfileImg())
                .rating(mannerTemperature)
                .reviewCount(reviewCount != null ? reviewCount.intValue() : 0)
                .location("미설정")
                .build();
    }

    // =========================================================================
    // 2. 프로필 업데이트
    // =========================================================================
    @Transactional
    public User updateProfile(ProfileUpdateRequest request) {
        User user = getCurrentUser();

        if (request.getNickName() != null && !request.getNickName().isEmpty()) {
            user.setNick(request.getNickName());
        }
        if (request.getProfileImageUrl() != null) {
            user.setProfileImg(request.getProfileImageUrl());
        }

        return userRepository.save(user);
    }

    // =========================================================================
    // 3. 등록한 상품 조회
    // =========================================================================
    @Transactional(readOnly = true)
    public List<ListItem> getRegisteredProducts() {
        User seller = getCurrentUser();

        List<Product> products = productRepository.findBySellerAndIsDeletedFalse(seller);

        return products.stream()
                .map(this::convertToListProductItem)
                .collect(Collectors.toList());
    }

    // =========================================================================
    // 4. 관심 상품 조회
    // =========================================================================
    @Transactional(readOnly = true)
    public List<ListItem> getFavorites() {
        User user = getCurrentUser();
        List<Favorite> favorites = favoriteRepository.findByUser(user);

        return favorites.stream()
                .map(Favorite::getProduct)
                .filter(Objects::nonNull)
                .map(this::convertToListProductItem)
                .collect(Collectors.toList());
    }

    // =========================================================================
    // 5. 구매 내역 (준비 중)
    // =========================================================================
    @Transactional(readOnly = true)
    public List<PurchaseItem> getPurchaseHistory() {
        return Collections.emptyList();
    }

    // =========================================================================
    // 6. 받은 후기 조회
    // =========================================================================
    @Transactional(readOnly = true)
    public List<ReviewItem> getReviews() {
        User targetUser = getCurrentUser();
        List<Review> reviews = reviewRepository.findByTarget(targetUser);

        return reviews.stream()
                .map(this::convertToReviewItem)
                .collect(Collectors.toList());
    }

    // =========================================================================
    // 7. 상품 상태 업데이트
    // =========================================================================
    @Transactional
    public void updateProductStatus(Long productId, String status) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("상품 정보를 찾을 수 없습니다."));

        if (!product.getSeller().getNick().equals(getCurrentUserNick())) {
            throw new SecurityException("상품 상태를 변경할 권한이 없습니다.");
        }

        ProductStatus newStatus;
        try {
            newStatus = ProductStatus.valueOf(status.toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("유효하지 않은 상품 상태 값입니다: " + status);
        }

        product.setStatus(newStatus);
        productRepository.save(product);
    }

    // =========================================================================
    // 8. 상품 삭제 (Soft Delete)
    // =========================================================================
    @Transactional
    public void deleteProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("상품 정보를 찾을 수 없습니다."));

        if (!product.getSeller().getNick().equals(getCurrentUserNick())) {
            throw new SecurityException("상품을 삭제할 권한이 없습니다.");
        }

        product.setIsDeleted(true);
        productRepository.save(product);
    }


    // =========================================================================
    // DTO 변환
    // =========================================================================

    /** Product → ListItem 변환 */
    private ListItem convertToListProductItem(Product product) {

        int favoriteCount = favoriteRepository.findByProduct(product).size();

        return ListItem.builder()
                .id(product.getId().intValue())
                .title(product.getTitle())
                .price(product.getPrice().doubleValue())
                .locationNm(product.getLocation_nm())
                .createdAt(product.getCreatedAt())
                .viewCount(product.getView_count())
                .favoriteCount(favoriteCount)
                .isResell(product.getIsResell())
                .build();
    }

    /** Review → ReviewItem 변환 (UserDtos 구조 적용) */
    private ReviewItem convertToReviewItem(Review review) {
        return ReviewItem.builder()
                .id(review.getId().toString())
                .reviewer(review.getWriter().getNick())
                .reviewerImage(review.getWriter().getProfileImg())
                .rating(review.getRating().doubleValue())
                .comment(review.getContent())
                .productTitle(review.getTransaction().getProduct().getTitle())
                .date(review.getCreatedAt())
                .build();
    }
}
