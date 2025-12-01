package com.goldenRun.NewTag.Repository;

import com.goldenRun.NewTag.entity.Category;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findFirstByCategoryNmContainingIgnoreCase(String keyword);
}
