package com.goldenRun.NewTag.service;

import com.goldenRun.NewTag.Repository.CategoryRepository;
import com.goldenRun.NewTag.dto.CategoryDto;
import com.goldenRun.NewTag.entity.Category;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    /**
     * 모든 카테고리 조회
     */
    public List<CategoryDto.Response> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        return categories.stream()
                .map(CategoryDto.Response::from)
                .collect(Collectors.toList());
    }

    /**
     * 카테고리 ID로 조회
     */
    public CategoryDto.Response getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다."));
        return CategoryDto.Response.from(category);
    }
}
