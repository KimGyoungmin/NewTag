package com.goldenRun.NewTag.Repository;

import com.goldenRun.NewTag.entity.Transaction;
import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.enums.TransactionStatus;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByProductId(Long productId);

    List<Transaction> findByBuyerAndStatus(User buyer, TransactionStatus completed);
}
