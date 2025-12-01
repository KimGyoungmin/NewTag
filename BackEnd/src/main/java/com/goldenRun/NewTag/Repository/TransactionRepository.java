package com.goldenRun.NewTag.Repository;

import com.goldenRun.NewTag.entity.Transaction;
import com.goldenRun.NewTag.enums.ProductStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByProductId(Long productId);

    @Query("SELECT t FROM Transaction t " +
           "JOIN FETCH t.product p " +
           "JOIN FETCH t.seller s " +
           "WHERE t.buyer.id = :buyerId " +
           "AND p.is_delete = false " +
           "ORDER BY t.createdAt DESC")
    List<Transaction> findByBuyerId(@Param("buyerId") Long buyerId);

    @Query("SELECT t FROM Transaction t " +
           "JOIN FETCH t.product p " +
           "JOIN FETCH t.seller s " +
           "WHERE t.buyer.id = :buyerId " +
           "AND p.status = :status " +
           "AND p.is_delete = false " +
           "ORDER BY t.createdAt DESC")
    List<Transaction> findByBuyerIdAndProductStatus(
            @Param("buyerId") Long buyerId,
            @Param("status") ProductStatus status
    );
}
