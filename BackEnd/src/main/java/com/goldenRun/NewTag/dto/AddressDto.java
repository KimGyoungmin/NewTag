package com.goldenRun.NewTag.dto;

import com.goldenRun.NewTag.entity.Address;
import lombok.*;

import java.math.BigDecimal;

public class AddressDto {

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String locationNm;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private Boolean isDefault;

        public static Response from(Address address) {
            return Response.builder()
                    .id(address.getId())
                    .locationNm(address.getLocationNm())
                    .latitude(address.getLatitude())
                    .longitude(address.getLongitude())
                    .isDefault(address.getIsDefault())
                    .build();
        }
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private String locationNm;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private Boolean isDefault; // 기본 주소로 설정 여부
    }
}
