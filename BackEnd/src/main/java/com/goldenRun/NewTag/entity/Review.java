package com.goldenRun.NewTag.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "review", uniqueConstraints = @UniqueConstraint(name = "unique_transaction_writer", columnNames = {
        "transaction_id", "writer_id" }), indexes = {
                @Index(name = "idx_review_writer", columnList = "writer_id"),
                @Index(name = "idx_review_target", columnList = "target_id")
        })

public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private Integer rating; // 1~5
    @Lob
    private String content;

    @Column(nullable = false)
    private LocalDateTime created_at;
    @Column(nullable = false)
    private LocalDateTime updated_at;

    @Column(name = "transaction_id", nullable = false)
    private Integer transactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "writer_id", nullable = false)
    private User writer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id", nullable = false)
    private User target;

    @PrePersist
    void prePersist() {
        created_at = updated_at = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updated_at = LocalDateTime.now();
    }
}
