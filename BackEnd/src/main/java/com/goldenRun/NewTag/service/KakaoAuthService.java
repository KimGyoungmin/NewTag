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
import com.goldenRun.NewTag.dto.KakaoUserInfo;
import com.goldenRun.NewTag.dto.UserDtos;
import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.enums.Provider;
import com.goldenRun.NewTag.enums.Role;
import com.goldenRun.NewTag.security.JwtTokenProvider;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class KakaoAuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Value("${kakao.client-id:}")
    private String kakaoClientId;

    @Value("${kakao.client-secret:}")
    private String kakaoClientSecret;

    @Value("${kakao.redirect-uri:http://localhost:5173/v1/auth/kakao/callback}")
    private String kakaoRedirectUri;

    private static final String KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
    private static final String KAKAO_USER_INFO_URL = "https://kapi.kakao.com/v2/user/me";
    private static final String REFRESH_TOKEN_COOKIE = "refresh_token";

    /**
     * 카카오 인증 코드로 액세스 토큰 받기
     */
    public String getKakaoAccessToken(String code) {
        log.info("=== 카카오 토큰 요청 시작 ===");
        log.info("Client ID: {}", kakaoClientId);
        log.info("Redirect URI: {}", kakaoRedirectUri);
        log.info("Code: {}...", code.substring(0, Math.min(20, code.length())));

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", kakaoClientId);
        params.add("redirect_uri", kakaoRedirectUri);
        params.add("code", code);

        if (kakaoClientSecret != null && !kakaoClientSecret.isEmpty()) {
            params.add("client_secret", kakaoClientSecret);
        }

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(KAKAO_TOKEN_URL, request, Map.class);

            @SuppressWarnings("rawtypes")
            Map body = response.getBody();
            if (body != null && body.get("access_token") != null) {
                log.info("카카오 액세스 토큰 발급 성공");
                return (String) body.get("access_token");
            }
            log.error("응답에 access_token이 없음: {}", body);
        } catch (Exception e) {
            log.error("카카오 액세스 토큰 요청 실패");
            log.error("에러 타입: {}", e.getClass().getName());
            log.error("에러 메시지: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("원인: {}", e.getCause().getMessage());
            }
            throw new RuntimeException("카카오 로그인 중 오류가 발생했습니다: " + e.getMessage());
        }

        throw new RuntimeException("카카오 액세스 토큰을 받아오지 못했습니다.");
    }

    /**
     * 카카오 액세스 토큰으로 사용자 정보 받기
     */
    public KakaoUserInfo getKakaoUserInfo(String accessToken) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<KakaoUserInfo> response = restTemplate.exchange(
                KAKAO_USER_INFO_URL,
                HttpMethod.GET,
                request,
                KakaoUserInfo.class
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("카카오 사용자 정보 요청 실패", e);
            throw new RuntimeException("카카오 사용자 정보를 가져오지 못했습니다.");
        }
    }

    /**
     * 카카오 로그인 처리 (회원가입 또는 로그인)
     */
    public ResponseEntity<Map<String, Object>> processKakaoLogin(String code) {
        try {
            // 1. 인증 코드로 액세스 토큰 받기
            String kakaoAccessToken = getKakaoAccessToken(code);

            // 2. 액세스 토큰으로 사용자 정보 받기
            KakaoUserInfo kakaoUserInfo = getKakaoUserInfo(kakaoAccessToken);

            if (kakaoUserInfo == null || kakaoUserInfo.getId() == null) {
                return errorResponse("카카오 사용자 정보를 가져오지 못했습니다.");
            }

            // 디버깅: 카카오에서 받아온 정보 로그 출력
            log.info("=== 카카오 사용자 정보 ===");
            log.info("ID: {}", kakaoUserInfo.getId());
            log.info("닉네임: {}", kakaoUserInfo.getNickname());
            log.info("이메일: {}", kakaoUserInfo.getEmail());
            log.info("프로필 이미지: {}", kakaoUserInfo.getProfileImageUrl());
            log.info("========================");

            // 3. 기존 회원 확인 또는 신규 회원 가입
            String providerId = String.valueOf(kakaoUserInfo.getId());
            User user = userRepository.findByProviderAndProviderId(Provider.KAKAO, providerId);

            if (user == null) {
                // 신규 회원 가입
                user = createNewKakaoUser(kakaoUserInfo, providerId);
                userRepository.save(user);
                log.info("카카오 신규 회원 가입: {}", user.getNick());
            } else {
                // 기존 회원 로그인
                log.info("카카오 기존 회원 로그인: {}", user.getNick());
            }

            // 4. JWT 토큰 발급
            String accessToken = jwtTokenProvider.createAccessToken(user.getNick());
            String refreshToken = jwtTokenProvider.createRefreshToken(user.getNick());

            // 5. 응답 생성
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "카카오 로그인 성공!");
            response.put("token", accessToken);
            response.put("user", UserDtos.SimpleResponse.from(user));

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.SET_COOKIE,
                            buildRefreshTokenCookie(refreshToken, jwtTokenProvider.getRefreshTokenValidityMs()).toString())
                    .body(response);

        } catch (Exception e) {
            log.error("카카오 로그인 처리 중 오류", e);
            return errorResponse("카카오 로그인 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 새로운 카카오 사용자 생성
     */
    private User createNewKakaoUser(KakaoUserInfo kakaoUserInfo, String providerId) {
        // 닉네임 설정 (중복 시 숫자 추가)
        String baseNick = kakaoUserInfo.getNickname() != null ? kakaoUserInfo.getNickname() : "카카오사용자";
        String uniqueNick = generateUniqueNick(baseNick);

        // 이메일 설정
        String email = kakaoUserInfo.getEmail();
        if (email == null || email.isBlank()) {
            email = "kakao_" + providerId + "@kakao.temp";
        }

        // 프로필 이미지 설정
        String profileImg = kakaoUserInfo.getProfileImageUrl();
        if (profileImg == null || profileImg.isBlank()) {
            profileImg = "default_img.png";
        }

        return User.builder()
                .provider(Provider.KAKAO)
                .providerId(providerId)
                .nick(uniqueNick)
                .name(kakaoUserInfo.getNickname() != null ? kakaoUserInfo.getNickname() : uniqueNick)
                .email(email)
                .password(null)  // 소셜 로그인은 비밀번호 NULL (빈 문자열 아님!)
                .profileImg(profileImg)
                .role(Role.USER)
                .isDelete(false)
                .trust(0.0)  // 기본 신뢰도
                .emailVerified(kakaoUserInfo.getEmail() != null)  // 이메일이 있으면 인증된 것으로 간주
                .phoneVerified(false)  // 카카오에서는 전화번호 정보 제공 안함
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
