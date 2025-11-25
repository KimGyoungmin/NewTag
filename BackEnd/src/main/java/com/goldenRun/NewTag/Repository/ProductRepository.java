package com.goldenRun.NewTag.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.goldenRun.NewTag.dto.ProductDtos;
import com.goldenRun.NewTag.entity.Product;
import com.goldenRun.NewTag.enums.ProductStatus;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // 삭제되지 않은 상품 조회
    @Query("SELECT p FROM Product p WHERE p.is_delete = false")
    List<Product> findAllNotDeleted();

    // 삭제되지 않은 상품을 페이징하여 조회
    @Query("SELECT p FROM Product p WHERE p.is_delete = false")
    Page<Product> findAllNotDeleted(Pageable pageable);

    // 삭제되지 않은 상품을 Fetch Join으로 조회 (N+1 최적화)
    @Query("SELECT DISTINCT p FROM Product p " +
           "LEFT JOIN FETCH p.seller " +
           "LEFT JOIN FETCH p.category " +
           "LEFT JOIN FETCH p.images " +
           "WHERE p.is_delete = false")
    List<Product> findAllNotDeletedWithFetchJoin();

    // ID로 상품 조회 (Fetch Join)
    @Query("SELECT p FROM Product p " +
           "LEFT JOIN FETCH p.seller " +
           "LEFT JOIN FETCH p.category " +
           "LEFT JOIN FETCH p.images " +
           "WHERE p.id = :id AND p.is_delete = false")
    Product findByIdWithFetchJoin(@Param("id") Long id);

    // 카테고리별 상품 조회
    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.is_delete = false")
    Page<Product> findByCategoryNotDeleted(@Param("categoryId") Long categoryId, Pageable pageable);

    // 카테고리별 상품 조회 (Fetch Join)
    @Query("SELECT DISTINCT p FROM Product p " +
           "LEFT JOIN FETCH p.seller " +
           "LEFT JOIN FETCH p.category " +
           "LEFT JOIN FETCH p.images " +
           "WHERE p.category.id = :categoryId AND p.is_delete = false")
    List<Product> findByCategoryNotDeletedWithFetchJoin(@Param("categoryId") Long categoryId);

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

    // 판매자의 다른 상품 조회 (현재 상품 제외)
    @Query("SELECT p FROM Product p " +
            "WHERE p.seller.id = :sellerId " +
            "AND p.id <> :productId " +
            "AND p.is_delete = false " +
            "ORDER BY p.createdAt DESC")
    Page<Product> findOtherProductsBySeller(
            @Param("sellerId") Long sellerId,
            @Param("productId") Long productId,
            Pageable pageable
    );

    // 90일 이상 소프트 삭제된 상품 조회 (자동 정리용)
    @Query("SELECT p FROM Product p " +
            "WHERE p.is_delete = true " +
            "AND p.updatedAt < :cutoffDate")
    List<Product> findByIsDeleteTrueAndUpdatedAtBefore(
            @Param("cutoffDate") LocalDateTime cutoffDate
    );

    // DTO Projection 조회 (N+1 최적화 - 최고 성능)
    @Query("SELECT p.id as id, " +
           "p.title as title, " +
           "p.price as price, " +
           "p.location_nm as locationNm, " +
           "p.latitude as latitude, " +
           "p.longitude as longitude, " +
           "p.createdAt as createdAt, " +
           "p.view_count as viewCount, " +
           "p.isResell as isResell, " +
           "p.seller.id as sellerId, " +
           "p.seller.nick as sellerNick, " +
           "p.seller.name as sellerName, " +
           "p.category.id as categoryId, " +
           "p.category.categoryNm as categoryName, " +
           "(SELECT pi.path FROM ProductImage pi WHERE pi.product.id = p.id AND pi.is_main = true) as mainImagePath " +
           "FROM Product p " +
           "WHERE p.is_delete = false")
    Page<ProductDtos.ProductListProjection> findAllNotDeletedWithProjection(Pageable pageable);

    @Query("SELECT p.id as id, " +
           "p.title as title, " +
           "p.price as price, " +
           "p.location_nm as locationNm, " +
           "p.latitude as latitude, " +
           "p.longitude as longitude, " +
           "p.createdAt as createdAt, " +
           "p.view_count as viewCount, " +
           "p.isResell as isResell, " +
           "p.seller.id as sellerId, " +
           "p.seller.nick as sellerNick, " +
           "p.seller.name as sellerName, " +
           "p.category.id as categoryId, " +
           "p.category.categoryNm as categoryName, " +
           "(SELECT pi.path FROM ProductImage pi WHERE pi.product.id = p.id AND pi.is_main = true) as mainImagePath " +
           "FROM Product p " +
           "WHERE p.category.id = :categoryId AND p.is_delete = false")
    Page<ProductDtos.ProductListProjection> findByCategoryNotDeletedWithProjection(@Param("categoryId") Long categoryId, Pageable pageable);
}
