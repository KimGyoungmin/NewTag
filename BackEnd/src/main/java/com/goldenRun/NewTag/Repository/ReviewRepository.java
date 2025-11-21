package com.goldenRun.NewTag.Repository;

import com.goldenRun.NewTag.entity.Review;
import com.goldenRun.NewTag.entity.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    /**
     * 특정 사용자가 받은 리뷰 목록 조회 (페이징)
     */
    Page<Review> findByTargetIdOrderByCreatedAtDesc(Long targetId, Pageable pageable);

    /**
     * 특정 사용자가 받은 리뷰 목록 조회 (전체)
     */
    List<Review> findByTargetId(Long targetId);

    /**
     * 특정 사용자가 작성한 리뷰 목록 조회
     */
    Page<Review> findByWriterIdOrderByCreatedAtDesc(Long writerId, Pageable pageable);

    /**
     * 특정 사용자의 평균 평점 계산
     */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.target.id = :targetId")
    Double calculateAverageRating(@Param("targetId") Long targetId);

    /**
     * 특정 사용자가 받은 리뷰 개수
     */
    @Query("SELECT COUNT(r) FROM Review r WHERE r.target.id = :targetId")
    Long countByTargetId(@Param("targetId") Long targetId);

    /**
     * 특정 거래에 대한 리뷰가 이미 존재하는지 확인
     */
    @Query("SELECT COUNT(r) > 0 FROM Review r WHERE r.transaction.id = :transactionId AND r.writer.id = :writerId")
    boolean existsByTransactionIdAndWriterId(@Param("transactionId") Long transactionId, @Param("writerId") Long writerId);

    List<Review> findByTarget(User targetUser);

    Long countByTargetId(User currentUser);

    Long countByTarget(User currentUser);
}
