package com.goldenRun.NewTag.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@Entity @Table(name="category")

public class Category {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, length=40)
    private String categoryNm;

    @Column(nullable=false)
    private LocalDateTime createdAt;

    @Column(nullable=false)
    private LocalDateTime updatedAt;

    @PrePersist void prePersist(){ createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate void preUpdate(){ updatedAt = LocalDateTime.now(); }
}
