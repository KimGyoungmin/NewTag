package com.goldenRun.NewTag.dto;

import com.goldenRun.NewTag.enums.ProductStatus;
import com.goldenRun.NewTag.enums.TransactionStatus;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class PurchaseDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HistoryItem {
        private Long transactionId;
        private Long productId;
        private String productTitle;
        private Double price;
        private String productImage;
        private LocalDateTime transactionAt;
        private ProductStatus productStatus;
        private TransactionStatus transactionStatus;
        private Long sellerId;
        private String sellerNick;
        private String sellerName;
    }
}
