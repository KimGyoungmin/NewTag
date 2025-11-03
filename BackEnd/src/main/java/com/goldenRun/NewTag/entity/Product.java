package com.goldenRun.NewTag.entity;

import com.goldenRun.NewTag.enums.ProductStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor


@Entity
@Table(
    name = "product",
    indexes = {
        @Index(name = "idx_product_seller", columnList = "seller_id"),
        @Index(name = "idx_product_status", columnList = "status"),
        @Index(name = "idx_product_location", columnList = "latitude,longitude")
    }
)

public class Product {
     @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false) private Double price;
    @Column(nullable=false, length=100) private String title;
    @Lob @Column(nullable=false, columnDefinition = "TEXT") private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false, columnDefinition = "ENUM('ON_SELL','SOLD_OUT','RESERVED') default 'ON_SELL'")
    private ProductStatus status;

    @Column(nullable=false, length=100) private String location_nm;
    @Column(nullable=false, precision = 10, scale = 7) private BigDecimal latitude;
    @Column(nullable=false, precision = 10, scale = 7) private BigDecimal longitude;

    @Column(nullable=false) private Integer view_count;
    @Column(nullable=false) private Boolean is_delete;

    @Column(nullable=false) private LocalDateTime createdAt;
    @Column(nullable=false) private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="seller_id", nullable=false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="category_id", nullable=false)
    private Category category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    public void increaseView(){ this.view_count = (this.view_count == null ? 1 : this.view_count + 1); }

    @PrePersist void prePersist(){
        createdAt = updatedAt = LocalDateTime.now();
        if (status == null) status = ProductStatus.ON_SELL;
        if (view_count == null) view_count = 0;
        if (is_delete == null) is_delete = false;
    }
    @PreUpdate void preUpdate(){ updatedAt = LocalDateTime.now(); }
}
