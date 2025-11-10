package com.goldenRun.NewTag.Repository;

import com.goldenRun.NewTag.entity.SearchLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SearchLogRepository extends JpaRepository<SearchLog, Long> {

    // 사용자별 검색 로그 조회
    @Query("SELECT s FROM SearchLog s WHERE s.user.id = :userId ORDER BY s.createdAt DESC")
    List<SearchLog> findByUserOrderByCreatedAtDesc(@Param("userId") Long userId);

    // 인기 검색어 조회 (특정 기간 내)
    @Query("SELECT s.keyword, COUNT(s) as cnt FROM SearchLog s " +
           "WHERE s.createdAt >= :startDate " +
           "GROUP BY s.keyword " +
           "ORDER BY cnt DESC")
    List<Object[]> findPopularKeywords(@Param("startDate") LocalDateTime startDate);

    // 사용자별 최근 검색어 조회 (중복 제거)
    @Query("SELECT DISTINCT s.keyword FROM SearchLog s " +
           "WHERE s.user.id = :userId " +
           "ORDER BY s.createdAt DESC")
    List<String> findRecentKeywordsByUser(@Param("userId") Long userId);
}
