package com.goldenRun.NewTag.service;

import com.goldenRun.NewTag.Repository.AddressRepository;
import com.goldenRun.NewTag.Repository.UserRepository;
import com.goldenRun.NewTag.dto.AddressDto;
import com.goldenRun.NewTag.entity.Address;
import com.goldenRun.NewTag.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    private static final int MAX_ADDRESS_COUNT = 3;

    /**
     * 사용자의 모든 주소 조회
     */
    @Transactional(readOnly = true)
    public List<AddressDto.Response> getUserAddresses(String username) {
        User user = userRepository.findByNick(username);
        if (user == null) {
            throw new RuntimeException("사용자를 찾을 수 없습니다.");
        }

        List<Address> addresses = addressRepository.findByUser(user);

        return addresses.stream()
                .map(AddressDto.Response::from)
                .collect(Collectors.toList());
    }

    /**
     * 새 주소 추가 (최대 3개까지)
     */
    @Transactional
    public AddressDto.Response addAddress(String username, AddressDto.Request request) {
        User user = userRepository.findByNick(username);
        if (user == null) {
            throw new RuntimeException("사용자를 찾을 수 없습니다.");
        }

        // 최대 3개까지만 저장
        long currentCount = addressRepository.countByUser(user);
        if (currentCount >= MAX_ADDRESS_COUNT) {
            throw new RuntimeException("최대 3개의 위치만 저장할 수 있습니다. 기존 위치를 삭제하거나 수정해주세요.");
        }

        // 기본 주소로 설정하려는 경우, 기존 기본 주소를 해제
        boolean isDefault = Boolean.TRUE.equals(request.getIsDefault());
        if (isDefault) {
            clearDefaultAddress(user);
        }

        // 주소가 하나도 없으면 자동으로 기본 주소로 설정
        if (currentCount == 0) {
            isDefault = true;
        }

        // 주소 생성
        Address address = Address.builder()
                .locationNm(request.getLocationNm())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .isDefault(isDefault)
                .user(user)
                .build();

        Address savedAddress = addressRepository.save(address);

        log.info("새 주소 추가: {} - {} (기본: {})", username, request.getLocationNm(), isDefault);

        return AddressDto.Response.from(savedAddress);
    }

    /**
     * 주소 삭제
     */
    @Transactional
    public void deleteAddress(String username, Long addressId) {
        User user = userRepository.findByNick(username);
        if (user == null) {
            throw new RuntimeException("사용자를 찾을 수 없습니다.");
        }

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("주소를 찾을 수 없습니다."));

        // 본인의 주소인지 확인
        if (!address.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("본인의 주소만 삭제할 수 있습니다.");
        }

        addressRepository.delete(address);

        log.info("주소 삭제: {} - ID: {}", username, addressId);
    }

    /**
     * 주소 수정 (3개 모두 저장된 경우 개별 위치 변경용)
     */
    @Transactional
    public AddressDto.Response updateAddress(String username, Long addressId, AddressDto.Request request) {
        User user = userRepository.findByNick(username);
        if (user == null) {
            throw new RuntimeException("사용자를 찾을 수 없습니다.");
        }

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("주소를 찾을 수 없습니다."));

        // 본인의 주소인지 확인
        if (!address.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("본인의 주소만 수정할 수 있습니다.");
        }

        // 기본 주소로 설정하려는 경우, 기존 기본 주소를 해제
        if (Boolean.TRUE.equals(request.getIsDefault()) && !Boolean.TRUE.equals(address.getIsDefault())) {
            clearDefaultAddress(user);
            address.setIsDefault(true);
        } else if (Boolean.FALSE.equals(request.getIsDefault()) && Boolean.TRUE.equals(address.getIsDefault())) {
            address.setIsDefault(false);
        }

        // 주소 정보 업데이트
        address.setLocationNm(request.getLocationNm());
        address.setLatitude(request.getLatitude());
        address.setLongitude(request.getLongitude());

        Address updatedAddress = addressRepository.save(address);

        log.info("주소 수정: {} - ID: {} -> {}", username, addressId, request.getLocationNm());

        return AddressDto.Response.from(updatedAddress);
    }

    /**
     * 기본 주소 조회
     */
    @Transactional(readOnly = true)
    public AddressDto.Response getDefaultAddress(String username) {
        User user = userRepository.findByNick(username);
        if (user == null) {
            throw new RuntimeException("사용자를 찾을 수 없습니다.");
        }

        return addressRepository.findByUserAndIsDefaultTrue(user)
                .map(AddressDto.Response::from)
                .orElse(null);
    }

    /**
     * 기본 주소 설정 (기존 기본 주소 해제)
     */
    @Transactional
    public AddressDto.Response setDefaultAddress(String username, Long addressId) {
        User user = userRepository.findByNick(username);
        if (user == null) {
            throw new RuntimeException("사용자를 찾을 수 없습니다.");
        }

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("주소를 찾을 수 없습니다."));

        // 본인의 주소인지 확인
        if (!address.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("본인의 주소만 수정할 수 있습니다.");
        }

        // 기존 기본 주소 해제
        clearDefaultAddress(user);

        // 새로운 기본 주소 설정
        address.setIsDefault(true);
        Address updatedAddress = addressRepository.save(address);

        log.info("기본 주소 변경: {} - ID: {} ({})", username, addressId, address.getLocationNm());

        return AddressDto.Response.from(updatedAddress);
    }

    /**
     * 사용자의 기존 기본 주소를 해제 (내부 헬퍼 메서드)
     */
    private void clearDefaultAddress(User user) {
        addressRepository.findByUserAndIsDefaultTrue(user)
                .ifPresent(address -> {
                    address.setIsDefault(false);
                    addressRepository.save(address);
                    log.info("기존 기본 주소 해제: {} - ID: {}", user.getNick(), address.getId());
                });
    }
}
