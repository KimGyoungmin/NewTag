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
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/purchase")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowCredentials = "true")
public class PurchaseController {

    private final PurchaseService purchaseService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getPurchaseHistory(
            @RequestParam(name = "status", required = false) ProductStatus status,
            @AuthenticationPrincipal String currentUserNick
    ) {
        List<PurchaseDtos.HistoryItem> purchases = purchaseService.getMyPurchases(
                currentUserNick,
                status
        );

        Map<String, Object> response = new HashMap<>();
        response.put("purchases", purchases);
        response.put("count", purchases.size());
        response.put("status", status);

        return ResponseEntity.ok(response);
    }
}
