
package com.goldenRun.NewTag.Repository;

import com.goldenRun.NewTag.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    /**
     * 특정 사용자가 특정 상품을 찜했는지 확인
     */
    boolean existsByProductIdAndUserId(Long productId, Long userId);

    /**
     * 특정 사용자와 상품의 찜 정보 조회
     */
    Optional<Favorite> findByProductIdAndUserId(Long productId, Long userId);

    /**
     * 특정 상품의 찜 개수 조회
     */
    long countByProductId(Long productId);

    /**
     * 여러 상품의 찜 개수를 한 번에 조회 (N+1 문제 해결)
     */
    @Query("SELECT f.product.id, COUNT(f) FROM Favorite f WHERE f.product.id IN :productIds GROUP BY f.product.id")
    java.util.List<Object[]> countByProductIds(@Param("productIds") java.util.List<Long> productIds);

    /**
     * 특정 사용자가 찜한 상품 목록 조회
     */
    @Query("SELECT f.product.id FROM Favorite f WHERE f.user.id = :userId")
    Set<Long> findProductIdsByUserId(@Param("userId") Long userId);

    /**
     * 특정 사용자와 상품의 찜 정보 삭제
     */
    void deleteByProductIdAndUserId(Long productId, Long userId);
}
