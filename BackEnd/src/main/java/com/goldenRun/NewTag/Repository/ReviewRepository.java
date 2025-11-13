package com.goldenRun.NewTag.Repository;

import com.goldenRun.NewTag.entity.Review;
import com.goldenRun.NewTag.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface ReviewRepository extends JpaRepository<Review, Integer> {
    
    
    List<Review> findByTargetUser(User targetUser);
    
   
}