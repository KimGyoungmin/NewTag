package com.goldenRun.NewTag.controller;

import com.goldenRun.NewTag.dto.PurchaseDtos;
import com.goldenRun.NewTag.enums.ProductStatus;
import com.goldenRun.NewTag.service.PurchaseService;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/purchase")
@RequiredArgsConstructor
public class PurchaseController {

    private final PurchaseService purchaseService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getPurchaseHistory(
            @RequestParam(name = "status", required = false) ProductStatus status,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "인증 정보가 없습니다."));
        }

        List<PurchaseDtos.HistoryItem> purchases = purchaseService.getMyPurchases(
                userDetails.getUsername(),
                status
        );

        Map<String, Object> response = new HashMap<>();
        response.put("purchases", purchases);
        response.put("count", purchases.size());
        response.put("status", status);

        return ResponseEntity.ok(response);
    }
}
