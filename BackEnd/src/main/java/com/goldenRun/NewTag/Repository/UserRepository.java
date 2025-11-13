package com.goldenRun.NewTag.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.goldenRun.NewTag.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long>{
	
	Boolean existsByNick(String nick);
	Boolean existsByEmail(String email);
    Optional<User> findByNick(String nick);
	Optional<User> findByEmail(String email);
    
    
}
