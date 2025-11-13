package com.goldenRun.NewTag.Repository;

import com.goldenRun.NewTag.entity.Product;
import com.goldenRun.NewTag.entity.ProductImage;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductImageRepository extends JpaRepository<ProductImage, Integer> {
	
    
    // 상품 삭제 시 이미지 전체 삭제
     void deleteByProduct(Product product);

	List<ProductImage> findByProduct(Product product);
  
}