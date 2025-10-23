package com.goldenRun.NewTag.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.goldenRun.NewTag.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long>{
	User findByNick(String nick);
	Boolean existsByNick(String nick);
	Boolean existsByEmail(String email);
}
