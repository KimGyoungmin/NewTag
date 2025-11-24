package com.goldenRun.NewTag.controller;

import com.goldenRun.NewTag.dto.AddressDto;
import com.goldenRun.NewTag.service.AddressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    /**
     * 내 주소 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<AddressDto.Response>> getMyAddresses(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        // SecurityContext 상태 확인
        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

        log.info("[AddressController] SecurityContext Authentication: " + auth);
        log.info("[AddressController] @AuthenticationPrincipal userDetails: " + userDetails);

        if (auth != null) {
            log.info("[AddressController] Authentication.isAuthenticated(): " + auth.isAuthenticated());
            log.info("[AddressController] Authentication.getPrincipal(): " + auth.getPrincipal());
        }

        if (userDetails == null) {
            log.warn("Unauthorized access attempt to get addresses - userDetails is null");
            return ResponseEntity.status(401).build();
        }

        String username = userDetails.getUsername();
        log.info("[AddressController] Processing request for user: " + username);
        List<AddressDto.Response> addresses = addressService.getUserAddresses(username);
        return ResponseEntity.ok(addresses);
    }

    /**
     * 새 주소 추가
     */
    @PostMapping
    public ResponseEntity<AddressDto.Response> addAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody AddressDto.Request request
    ) {
        if (userDetails == null) {
            log.warn("Unauthorized access attempt to add address");
            return ResponseEntity.status(401).build();
        }

        String username = userDetails.getUsername();
        AddressDto.Response response = addressService.addAddress(username, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 주소 수정
     */
    @PutMapping("/{addressId}")
    public ResponseEntity<AddressDto.Response> updateAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long addressId,
            @RequestBody AddressDto.Request request
    ) {
        if (userDetails == null) {
            log.warn("Unauthorized access attempt to update address");
            return ResponseEntity.status(401).build();
        }

        String username = userDetails.getUsername();
        AddressDto.Response response = addressService.updateAddress(username, addressId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 주소 삭제
     */
    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> deleteAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long addressId
    ) {
        if (userDetails == null) {
            log.warn("Unauthorized access attempt to delete address");
            return ResponseEntity.status(401).build();
        }

        String username = userDetails.getUsername();
        addressService.deleteAddress(username, addressId);
        return ResponseEntity.ok().build();
    }

    /**
     * 기본 주소 조회
     */
    @GetMapping("/default")
    public ResponseEntity<AddressDto.Response> getDefaultAddress(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            log.warn("Unauthorized access attempt to get default address");
            return ResponseEntity.status(401).build();
        }

        String username = userDetails.getUsername();
        AddressDto.Response defaultAddress = addressService.getDefaultAddress(username);

        if (defaultAddress == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(defaultAddress);
    }

    /**
     * 기본 주소 설정
     */
    @PutMapping("/{addressId}/default")
    public ResponseEntity<AddressDto.Response> setDefaultAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long addressId
    ) {
        if (userDetails == null) {
            log.warn("Unauthorized access attempt to set default address");
            return ResponseEntity.status(401).build();
        }

        String username = userDetails.getUsername();
        AddressDto.Response response = addressService.setDefaultAddress(username, addressId);
        return ResponseEntity.ok(response);
    }
}
