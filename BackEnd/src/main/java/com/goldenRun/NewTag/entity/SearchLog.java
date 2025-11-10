package com.goldenRun.NewTag.entity;

import com.goldenRun.NewTag.enums.DeviceType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@Entity
@Table(
    name = "search_log",
    indexes = {
        @Index(name = "idx_search_log_user", columnList = "user_id"),
        @Index(name = "idx_search_log_keyword", columnList = "keyword"),
        @Index(name = "idx_search_log_created_at", columnList = "created_at"),
        @Index(name = "idx_search_log_clicked_product", columnList = "clicked_product_id")
    }
)
public class SearchLog {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String keyword;

    @Column(nullable = false)
    @Builder.Default
    private Integer resultCount = 0;

    @Column
    private LocalDateTime clickedAt;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('PC', 'MOBILE', 'TABLET', 'UNKNOWN')")
    private DeviceType deviceType;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clicked_product_id")
    private Product clickedProduct;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        if (resultCount == null) resultCount = 0;
        if (deviceType == null) deviceType = DeviceType.UNKNOWN;
    }
}
