package com.goldenRun.NewTag.service;

import com.goldenRun.NewTag.Repository.CategoryRepository;
import com.goldenRun.NewTag.Repository.ProductImageRepository;
import com.goldenRun.NewTag.Repository.ProductRepository;
import com.goldenRun.NewTag.Repository.UserRepository;
import com.goldenRun.NewTag.dto.ProductDtos;
import com.goldenRun.NewTag.dto.ProductDtos.ImageItem;
import com.goldenRun.NewTag.entity.Category;
import com.goldenRun.NewTag.entity.Product;
import com.goldenRun.NewTag.entity.ProductImage;
import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.enums.ProductStatus;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository; 

   
    private String getCurrentUserNick() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new SecurityException("인증된 사용자 정보를 찾을 수 없습니다.");
        }
        return authentication.getName(); 
    }
    
    
    public Product createProduct(ProductDtos.CreateRequest request) {
        String nick = getCurrentUserNick();
        
       
        User seller = userRepository.findByNick(nick)
                .orElseThrow(() -> new NoSuchElementException("판매자 정보를 찾을 수 없습니다."));
        
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new NoSuchElementException("유효하지 않은 카테고리 ID입니다."));
        
       
        Product newProduct = Product.builder()
                .price(request.getPrice())
                .title(request.getTitle())
                .content(request.getContent())
                .location_nm(request.getLocationNm())
                .latitude(request.getLatitude()) //경도
                .longitude(request.getLongitude()) //위도
                .seller(seller)
                .category(category)
                
                .status(ProductStatus.ON_SELL) 
                .view_count(0)
                .is_delete(false)
                .build();

        Product savedProduct = productRepository.save(newProduct); 

        
        processAndSaveImages(savedProduct, request.getImages());
        
        return savedProduct;
    }
    
    
    public Product updateProduct(Integer productId, ProductDtos.UpdateRequest request) {
        String currentNick = getCurrentUserNick();
        
        //  상품 존재 여부 확인
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("ID " + productId + "에 해당하는 상품 정보를 찾을 수 없습니다."));

        //  권한 확인: 글 작성자와 현재 사용자가 동일한지 검사
        if (!product.getSeller().getNick().equals(currentNick)) {
            throw new SecurityException("해당 상품을 수정할 권한이 없습니다.");
        }
        
        //  카테고리 정보 확인
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new NoSuchElementException("카테고리 정보를 찾을 수 없습니다."));

        
        product.setPrice(request.getPrice());
        product.setTitle(request.getTitle());
        product.setContent(request.getContent());
        product.setLocation_nm(request.getLocationNm());
        product.setLatitude(request.getLatitude());
        product.setLongitude(request.getLongitude());
        product.setCategory(category);
        product.setStatus(request.getStatus()); 
        
        
        updateImages(product, request.getImages());
        
        
        return productRepository.save(product);
    }
    
   
    public void deleteProduct(Integer productId) {
        String currentNick = getCurrentUserNick();

        // 상품 존재 여부 확인
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("ID " + productId + "에 해당하는 상품 정보를 찾을 수 없습니다."));

        
        if (!product.getSeller().getNick().equals(currentNick)) {
            throw new SecurityException("해당 상품을 삭제할 권한이 없습니다.");
        }
        
        //  상태변경 
        product.setIs_delete(true); 
        product.setUpdatedAt(LocalDateTime.now());
        
        productRepository.save(product);
        
        
    }

    
    private void processAndSaveImages(Product product, List<ImageItem> imageItems) {
        if (imageItems == null || imageItems.isEmpty()) {
            return;
        }

        
        for (ImageItem item : imageItems) {
            ProductImage imageEntity = ProductImage.builder()
                    .product(product)
                    .path(item.getPath())
                    .is_main(item.getIsMain())
                    
                    .build();
            
            productImageRepository.save(imageEntity);
        }
    }
    
    
    private void updateImages(Product product, List<ImageItem> newImageItems) {
        
        
        
        List<ProductImage> oldImages = productImageRepository.findByProduct(product); 

        if (!oldImages.isEmpty()) {
            
            productImageRepository.deleteAll(oldImages); 
        }
        
        
        if (newImageItems != null && !newImageItems.isEmpty()) {
            processAndSaveImages(product, newImageItems);
        }
    }
}