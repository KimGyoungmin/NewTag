package com.goldenRun.NewTag.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import com.goldenRun.NewTag.Repository.UserRepository;
import com.goldenRun.NewTag.dto.NaverUserInfo;
import com.goldenRun.NewTag.dto.UserDtos;
import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.enums.Provider;
import com.goldenRun.NewTag.enums.Role;
import com.goldenRun.NewTag.security.JwtTokenProvider;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class NaverAuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Value("${naver.client-id:}")
    private String naverClientId;

    @Value("${naver.client-secret:}")
    private String naverClientSecret;

    @Value("${naver.redirect-uri:http://localhost:5173/auth/naver/callback}")
    private String naverRedirectUri;

    private static final String NAVER_TOKEN_URL = "https://nid.naver.com/oauth2.0/token";
    private static final String NAVER_USER_INFO_URL = "https://openapi.naver.com/v1/nid/me";
    private static final String REFRESH_TOKEN_COOKIE = "refresh_token";

    /**
     * 네이버 인증 코드로 액세스 토큰 받기
     */
    public String getNaverAccessToken(String code, String state) {
        log.info("=== 네이버 토큰 요청 시작 ===");
        log.info("Client ID: {}", naverClientId);
        log.info("Redirect URI: {}", naverRedirectUri);
        log.info("Code: {}...", code.substring(0, Math.min(20, code.length())));
        log.info("State: {}", state);

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", naverClientId);
        params.add("client_secret", naverClientSecret);
        params.add("code", code);
        params.add("state", state);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(NAVER_TOKEN_URL, request, Map.class);

            @SuppressWarnings("rawtypes")
            Map body = response.getBody();
            if (body != null && body.get("access_token") != null) {
                log.info("네이버 액세스 토큰 발급 성공");
                return (String) body.get("access_token");
            }
            log.error("응답에 access_token이 없음: {}", body);
        } catch (Exception e) {
            log.error("네이버 액세스 토큰 요청 실패");
            log.error("에러 타입: {}", e.getClass().getName());
            log.error("에러 메시지: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("원인: {}", e.getCause().getMessage());
            }
            throw new RuntimeException("네이버 로그인 중 오류가 발생했습니다: " + e.getMessage());
        }

        throw new RuntimeException("네이버 액세스 토큰을 받아오지 못했습니다.");
    }

    /**
     * 네이버 액세스 토큰으로 사용자 정보 받기
     */
    public NaverUserInfo getNaverUserInfo(String accessToken) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<NaverUserInfo> response = restTemplate.exchange(
                NAVER_USER_INFO_URL,
                HttpMethod.GET,
                request,
                NaverUserInfo.class
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("네이버 사용자 정보 요청 실패", e);
            throw new RuntimeException("네이버 사용자 정보를 가져오지 못했습니다.");
        }
    }

    /**
     * 네이버 로그인 처리 (회원가입 또는 로그인)
     */
    public ResponseEntity<Map<String, Object>> processNaverLogin(String code, String state) {
        try {
            // 1. 인증 코드로 액세스 토큰 받기
            String naverAccessToken = getNaverAccessToken(code, state);

            // 2. 액세스 토큰으로 사용자 정보 받기
            NaverUserInfo naverUserInfo = getNaverUserInfo(naverAccessToken);

            if (naverUserInfo == null || naverUserInfo.getId() == null) {
                return errorResponse("네이버 사용자 정보를 가져오지 못했습니다.");
            }

            // 디버깅: 네이버에서 받아온 정보 로그 출력
            log.info("=== 네이버 사용자 정보 ===");
            log.info("ID: {}", naverUserInfo.getId());
            log.info("닉네임: {}", naverUserInfo.getNickname());
            log.info("이름: {}", naverUserInfo.getName());
            log.info("이메일: {}", naverUserInfo.getEmail());
            log.info("프로필 이미지: {}", naverUserInfo.getProfileImageUrl());
            log.info("전화번호: {}", naverUserInfo.getMobile());
            log.info("========================");

            // 3. 기존 회원 확인 또는 신규 회원 가입
            String providerId = naverUserInfo.getId();
            User user = userRepository.findByProviderAndProviderId(Provider.NAVER, providerId);

            if (user == null) {
                // 신규 회원 가입
                user = createNewNaverUser(naverUserInfo, providerId);
                userRepository.save(user);
                log.info("네이버 신규 회원 가입: {}", user.getNick());
            } else {
                // 기존 회원 로그인
                log.info("네이버 기존 회원 로그인: {}", user.getNick());
            }

            // 4. JWT 토큰 발급
            String accessToken = jwtTokenProvider.createAccessToken(user.getNick());
            String refreshToken = jwtTokenProvider.createRefreshToken(user.getNick());

            // 5. 응답 생성
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "네이버 로그인 성공!");
            response.put("token", accessToken);
            response.put("user", UserDtos.SimpleResponse.from(user));

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.SET_COOKIE,
                            buildRefreshTokenCookie(refreshToken, jwtTokenProvider.getRefreshTokenValidityMs()).toString())
                    .body(response);

        } catch (Exception e) {
            log.error("네이버 로그인 처리 중 오류", e);
            return errorResponse("네이버 로그인 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 새로운 네이버 사용자 생성
     */
    private User createNewNaverUser(NaverUserInfo naverUserInfo, String providerId) {
        // 닉네임 설정 (중복 시 숫자 추가)
        String baseNick = naverUserInfo.getNickname() != null ? naverUserInfo.getNickname() : "네이버사용자";
        String uniqueNick = generateUniqueNick(baseNick);

        // 이메일 설정
        String email = naverUserInfo.getEmail();
        if (email == null || email.isBlank()) {
            email = "naver_" + providerId + "@naver.temp";
        }

        // 프로필 이미지 설정
        String profileImg = naverUserInfo.getProfileImageUrl();
        if (profileImg == null || profileImg.isBlank()) {
            profileImg = "default_img.png";
        }

        // 전화번호 정보 (네이버는 제공)
        boolean phoneVerified = naverUserInfo.getMobile() != null && !naverUserInfo.getMobile().isBlank();

        return User.builder()
                .provider(Provider.NAVER)
                .providerId(providerId)
                .nick(uniqueNick)
                .name(naverUserInfo.getName() != null ? naverUserInfo.getName() : uniqueNick)
                .email(email)
                .password(null)  // 소셜 로그인은 비밀번호 NULL
                .profileImg(profileImg)
                .role(Role.USER)
                .isDelete(false)
                .trust(0.0)  // 기본 신뢰도
                .emailVerified(naverUserInfo.getEmail() != null)
                .phoneVerified(phoneVerified)
                .build();
    }

    /**
     * 중복되지 않는 고유한 닉네임 생성
     */
    private String generateUniqueNick(String baseNick) {
        String nick = baseNick;
        int counter = 1;

        while (userRepository.existsByNick(nick)) {
            nick = baseNick + counter;
            counter++;
        }

        return nick;
    }

    /**
     * Refresh Token 쿠키 생성
     */
    private ResponseCookie buildRefreshTokenCookie(String value, long maxAgeMillis) {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE, value)
                .httpOnly(true)
                .secure(false) // 개발 환경에서는 false, 프로덕션에서는 true
                .path("/")
                .sameSite("Lax")
                .maxAge(java.time.Duration.ofMillis(maxAgeMillis))
                .build();
    }

    /**
     * 에러 응답 생성
     */
    private ResponseEntity<Map<String, Object>> errorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}
