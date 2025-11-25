package com.goldenRun.NewTag.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class GoogleUserInfo {

    @JsonProperty("sub")
    private String sub;  // Google User ID

    @JsonProperty("name")
    private String name;

    @JsonProperty("given_name")
    private String givenName;

    @JsonProperty("family_name")
    private String familyName;

    @JsonProperty("picture")
    private String picture;

    @JsonProperty("email")
    private String email;

    @JsonProperty("email_verified")
    private Boolean emailVerified;

    @JsonProperty("locale")
    private String locale;

    // Convenience methods
    public String getId() {
        return sub;
    }

    public String getNickname() {
        if (name != null && !name.isBlank()) {
            return name;
        }
        if (email != null && email.contains("@")) {
            return email.substring(0, email.indexOf("@"));
        }
        return "구글사용자";
    }

    public String getProfileImageUrl() {
        return picture;
    }

    public Boolean isEmailVerified() {
        return emailVerified != null && emailVerified;
    }
}
