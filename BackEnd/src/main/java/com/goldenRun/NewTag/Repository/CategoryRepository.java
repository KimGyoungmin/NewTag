package com.goldenRun.NewTag.Repository;

import com.goldenRun.NewTag.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;


public interface CategoryRepository extends JpaRepository<Category, Integer> {
    
  
}