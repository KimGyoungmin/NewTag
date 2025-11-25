package com.goldenRun.NewTag.dto;

import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.enums.Provider;
import com.goldenRun.NewTag.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class UserDtos {

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimpleResponse {
        private Long id;
        private String name;
        private String nick;
        private String email;
        private String phone;
        private LocalDate birth;
        private Provider provider;
        private String providerId;
        private boolean emailVerified;
        private boolean phoneVerified;
        private Role role;
        private boolean isDelete;
        private Double trust;
        private String profileImg;
        private LocalDateTime lastLoginAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static SimpleResponse from(User user) {
            return SimpleResponse.builder()
                    .id(user.getId())
                    .name(user.getName())
                    .nick(user.getNick())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .birth(user.getBirth())
                    .provider(user.getProvider())
                    .providerId(user.getProviderId())
                    .emailVerified(false)
                    .phoneVerified(false)
                    .role(user.getRole())
                    .isDelete(user.isDelete())
                    .trust(user.getTrust())
                    .profileImg(user.getProfileImg())
                    .lastLoginAt(user.getLastLoginAt())
                    .createdAt(user.getCreatedAt())
                    .updatedAt(user.getUpdatedAt())
                    .build();
        }
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String name;
        private String nick;
        private String email;
        private String phone;
        private LocalDate birth;
        private String profileImg;
    }
}
