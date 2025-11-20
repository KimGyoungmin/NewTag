package com.goldenRun.NewTag.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.goldenRun.NewTag.entity.Product;
import com.goldenRun.NewTag.enums.ProductStatus;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // 삭제되지 않은 상품 조회
    @Query("SELECT p FROM Product p WHERE p.is_delete = false")
    List<Product> findAllNotDeleted();

    // 삭제되지 않은 상품을 페이징하여 조회
    @Query("SELECT p FROM Product p WHERE p.is_delete = false")
    Page<Product> findAllNotDeleted(Pageable pageable);

    // 카테고리별 상품 조회
    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.is_delete = false")
    Page<Product> findByCategoryNotDeleted(@Param("categoryId") Long categoryId, Pageable pageable);

    // 판매 상태별 상품 조회
    @Query("SELECT p FROM Product p WHERE p.status = :status AND p.is_delete = false")
    Page<Product> findByStatusNotDeleted(@Param("status") ProductStatus status, Pageable pageable);

    // 판매자별 상품 조회
    @Query("SELECT p FROM Product p WHERE p.seller.id = :sellerId AND p.is_delete = false")
    Page<Product> findBySellerNotDeleted(@Param("sellerId") Long sellerId, Pageable pageable);

    // 제목으로 검색
    @Query("SELECT p FROM Product p WHERE p.is_delete = false AND p.title LIKE %:keyword%")
    Page<Product> searchByTitle(@Param("keyword") String keyword, Pageable pageable);

    // 카테고리와 상태로 필터링
    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.status = :status AND p.is_delete = false")
    Page<Product> findByCategoryAndStatusNotDeleted(
        @Param("categoryId") Long categoryId,
        @Param("status") ProductStatus status,
        Pageable pageable
    );

    // 위치 기반 검색 (거리 계산)
    @Query("SELECT p FROM Product p WHERE p.is_delete = false " +
           "AND (6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude)) * " +
           "cos(radians(p.longitude) - radians(:lon)) + sin(radians(:lat)) * " +
           "sin(radians(p.latitude)))) <= :distance")
    Page<Product> findByLocation(
        @Param("lat") Double latitude,
        @Param("lon") Double longitude,
        @Param("distance") Double distance,
        Pageable pageable
    );

    @Query("SELECT p FROM Product p " +
            "WHERE p.category.id = :categoryId " +
            "AND p.id <> :productId " +
            "AND p.is_delete = false " +
            "ORDER BY p.view_count DESC, p.createdAt DESC")
    Page<Product> findRelatedProducts(
            @Param("categoryId") Long categoryId,
            @Param("productId") Long productId,
            Pageable pageable
    );
}
