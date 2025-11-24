package com.goldenRun.NewTag.Repository;

import com.goldenRun.NewTag.entity.Address;
import com.goldenRun.NewTag.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    /**
     * 특정 사용자의 모든 주소 조회
     */
    List<Address> findByUser(User user);

    /**
     * 특정 사용자의 주소 개수 조회
     */
    long countByUser(User user);

    /**
     * 특정 사용자의 특정 주소 삭제
     */
    void deleteByIdAndUser(Long id, User user);

    /**
     * 특정 사용자의 기본 주소 조회
     */
    Optional<Address> findByUserAndIsDefaultTrue(User user);
}
