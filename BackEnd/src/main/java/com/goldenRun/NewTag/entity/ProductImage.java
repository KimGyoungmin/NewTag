package com.goldenRun.NewTag.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@Entity @Table(name="p_img")

public class ProductImage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="p_img", nullable=false, length=100)
    private String path; // 파일명 또는 URL

    @Column(nullable=false) private Boolean is_main;

    @Column(nullable=false) private LocalDateTime createdAt;
    @Column(nullable=false) private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="product_id", nullable=false)
    private Product product;

    @PrePersist void prePersist(){ createdAt = updatedAt = LocalDateTime.now(); if (is_main==null) is_main=false; }
    @PreUpdate void preUpdate(){ updatedAt = LocalDateTime.now(); }
}