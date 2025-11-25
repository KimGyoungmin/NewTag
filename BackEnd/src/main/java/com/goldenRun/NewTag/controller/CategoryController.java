package com.goldenRun.NewTag.controller;

import com.goldenRun.NewTag.dto.CategoryDto;
import com.goldenRun.NewTag.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowCredentials = "true")
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
