package com.goldenRun.NewTag.Repository;

import com.goldenRun.NewTag.entity.Transaction;
import com.goldenRun.NewTag.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface TransactionRepository extends JpaRepository<Transaction, Integer> {

    
    List<Transaction> findByBuyerOrSeller(User buyer, User seller);
}