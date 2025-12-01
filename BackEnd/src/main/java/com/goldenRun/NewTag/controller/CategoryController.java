package com.goldenRun.NewTag.controller;

import com.goldenRun.NewTag.dto.CategoryDto;
import com.goldenRun.NewTag.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * 모든 카테고리 조회
     * GET /api/v1/categories
     */
    @GetMapping
    public ResponseEntity<List<CategoryDto.Response>> getAllCategories() {
        List<CategoryDto.Response> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    /**
     * 카테고리 ID로 조회
     * GET /api/v1/categories/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<CategoryDto.Response> getCategoryById(@PathVariable Long id) {
        CategoryDto.Response category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(category);
    }
}
