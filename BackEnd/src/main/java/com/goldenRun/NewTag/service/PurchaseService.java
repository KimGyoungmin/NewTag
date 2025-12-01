package com.goldenRun.NewTag.service;

import com.goldenRun.NewTag.Repository.TransactionRepository;
import com.goldenRun.NewTag.Repository.UserRepository;
import com.goldenRun.NewTag.dto.PurchaseDtos;
import com.goldenRun.NewTag.entity.Product;
import com.goldenRun.NewTag.entity.ProductImage;
import com.goldenRun.NewTag.entity.Transaction;
import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.enums.ProductStatus;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PurchaseService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public List<PurchaseDtos.HistoryItem> getMyPurchases(
            String currentUserNick,
            ProductStatus productStatus
    ) {
        if (!StringUtils.hasText(currentUserNick)) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }

        User buyer = userRepository.findByNick(currentUserNick);
        if (buyer == null) {
            throw new AccessDeniedException("사용자 정보를 찾을 수 없습니다.");
        }

        List<Transaction> transactions;
        if (productStatus != null) {
            // 과거 호환: 특정 상태만 보고 싶을 때
            transactions = transactionRepository.findByBuyerIdAndProductStatus(buyer.getId(), productStatus);
        } else {
            // 기본: 상태 구분 없이 전체 구매 내역
            transactions = transactionRepository.findByBuyerId(buyer.getId());
        }

        return transactions.stream()
                .map(this::convertToHistoryItem)
                .collect(Collectors.toList());
    }

    private PurchaseDtos.HistoryItem convertToHistoryItem(Transaction transaction) {
        Product product = transaction.getProduct();
        String mainImage = resolveMainImage(product);

        return PurchaseDtos.HistoryItem.builder()
                .transactionId(transaction.getId())
                .productId(product != null ? product.getId() : null)
                .productTitle(product != null ? product.getTitle() : null)
                .price(product != null && product.getPrice() != null
                        ? product.getPrice().doubleValue()
                        : null)
                .productImage(mainImage)
                .transactionAt(transaction.getCreatedAt())
                .productStatus(product != null ? product.getStatus() : null)
                .transactionStatus(transaction.getStatus())
                .sellerId(transaction.getSeller() != null ? transaction.getSeller().getId() : null)
                .sellerNick(transaction.getSeller() != null ? transaction.getSeller().getNick() : null)
                .sellerName(transaction.getSeller() != null ? transaction.getSeller().getName() : null)
                .build();
    }

    private String resolveMainImage(Product product) {
        if (product == null || product.getImages() == null || product.getImages().isEmpty()) {
            return null;
        }

        return product.getImages().stream()
                .filter(img -> Boolean.TRUE.equals(img.getIs_main()))
                .map(ProductImage::getPath)
                .findFirst()
                .orElse(product.getImages().get(0).getPath());
    }
}
