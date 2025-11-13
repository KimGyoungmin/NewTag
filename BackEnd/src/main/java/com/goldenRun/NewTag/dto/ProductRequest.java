package com.goldenRun.NewTag.dto;

import com.goldenRun.NewTag.entity.Category;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

// 참고: 실제 구현에서는 List<MultipartFile> images 필드를 추가하여 파일 업로드도 처리해야 합니다.
@Getter @Setter
public class ProductRequest {
    
    // 수정 시에는 id가 필요합니다.
    private Integer id; 

    @NotNull(message = "가격은 필수 입력 항목입니다.")
    @Positive(message = "가격은 0보다 커야 합니다.")
    private Double price;

    @NotBlank(message = "제목은 필수 입력 항목입니다.")
    private String title;

    @NotBlank(message = "내용은 필수 입력 항목입니다.")
    private String content;

    @NotNull(message = "카테고리 ID는 필수입니다.")
    private Integer categoryId; // Category 엔티티 대신 ID만 받습니다.

    @NotBlank(message = "거래 위치명은 필수입니다.")
    private String location_nm;
    
   
    
    
}