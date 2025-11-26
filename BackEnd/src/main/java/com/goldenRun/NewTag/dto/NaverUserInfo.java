package com.goldenRun.NewTag.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class NaverUserInfo {

    @JsonProperty("resultcode")
    private String resultCode;

    @JsonProperty("message")
    private String message;

    @JsonProperty("response")
    private NaverAccount response;

    @Data
    public static class NaverAccount {
        @JsonProperty("id")
        private String id;

        @JsonProperty("nickname")
        private String nickname;

        @JsonProperty("name")
        private String name;

        @JsonProperty("email")
        private String email;

        @JsonProperty("gender")
        private String gender;

        @JsonProperty("age")
        private String age;

        @JsonProperty("birthday")
        private String birthday;

        @JsonProperty("profile_image")
        private String profileImage;

        @JsonProperty("birthyear")
        private String birthyear;

        @JsonProperty("mobile")
        private String mobile;
    }

    // Convenience methods
    public String getId() {
        return response != null ? response.getId() : null;
    }

    public String getNickname() {
        return response != null ? response.getNickname() : null;
    }

    public String getName() {
        return response != null ? response.getName() : null;
    }

    public String getEmail() {
        return response != null ? response.getEmail() : null;
    }

    public String getProfileImageUrl() {
        return response != null ? response.getProfileImage() : null;
    }

    public String getMobile() {
        return response != null ? response.getMobile() : null;
    }
}
