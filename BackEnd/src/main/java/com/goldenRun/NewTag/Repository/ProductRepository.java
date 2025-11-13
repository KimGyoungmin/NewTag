package com.goldenRun.NewTag.Repository;

import com.goldenRun.NewTag.entity.Product;
import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.enums.ProductStatus;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

// Product 엔티티와 기본 키 타입(Integer)을 지정
public interface ProductRepository extends JpaRepository<Product, Integer> {

	Long sumRevenueBySeller(User currentUser);

	Double findAvgViewsBySeller(User currentUser);

	List<Product> findBySellerAndIsDeleteFalse(User seller);

	Long countBySellerAndStatus(User currentUser, ProductStatus soldOut);
    
	
}
