package com.goldenRun.NewTag.Repository;

import com.goldenRun.NewTag.entity.Block;
import com.goldenRun.NewTag.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface BlockRepository extends JpaRepository<Block, Integer> {

    
    List<Block> findByBlockerUser(User blockerUser);
}