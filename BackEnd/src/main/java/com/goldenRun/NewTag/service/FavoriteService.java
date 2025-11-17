package com.goldenRun.NewTag.service;

import com.goldenRun.NewTag.entity.Favorite;
import com.goldenRun.NewTag.entity.Product;
import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.Repository.FavoriteRepository;
import com.goldenRun.NewTag.Repository.ProductRepository;
import com.goldenRun.NewTag.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    /**
     * 찜하기 추가
     */
    @Transactional
    public void addFavorite(Long productId, Long userId) {
        // 이미 찜한 상품인지 확인
        if (favoriteRepository.existsByProductIdAndUserId(productId, userId)) {
            throw new IllegalStateException("이미 찜한 상품입니다.");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Favorite favorite = Favorite.builder()
                .product(product)
                .user(user)
                .build();

        favoriteRepository.save(favorite);
    }

    /**
     * 찜하기 취소
     */
    @Transactional
    public void removeFavorite(Long productId, Long userId) {
        favoriteRepository.deleteByProductIdAndUserId(productId, userId);
    }

    /**
     * 찜하기 토글 (있으면 삭제, 없으면 추가)
     */
    @Transactional
    public boolean toggleFavorite(Long productId, Long userId) {
        if (favoriteRepository.existsByProductIdAndUserId(productId, userId)) {
            removeFavorite(productId, userId);
            return false; // 찜 취소됨
        } else {
            addFavorite(productId, userId);
            return true; // 찜 추가됨
        }
    }

    /**
     * 특정 사용자가 특정 상품을 찜했는지 확인
     */
    public boolean isFavorite(Long productId, Long userId) {
        return favoriteRepository.existsByProductIdAndUserId(productId, userId);
    }

    /**
     * 특정 상품의 찜 개수 조회
     */
    public long getFavoriteCount(Long productId) {
        return favoriteRepository.countByProductId(productId);
    }

    /**
     * 특정 사용자가 찜한 상품 ID 목록 조회
     */
    public Set<Long> getFavoriteProductIds(Long userId) {
        return favoriteRepository.findProductIdsByUserId(userId);
    }
}
