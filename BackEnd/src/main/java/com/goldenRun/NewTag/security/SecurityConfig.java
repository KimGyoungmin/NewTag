package com.goldenRun.NewTag.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // Added Slf4j import
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.beans.factory.annotation.Value;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;


@Slf4j // Added Slf4j annotation
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Value("${app.cors.allowed-origins:http://localhost,https://localhost,http://localhost:*,http://127.0.0.1:*}")
    private String allowedOriginPatterns;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. CORS 설정을 가장 먼저 적용
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // 2. HTTP Basic, CSRF, 세션 관리 설정
            .httpBasic(basic -> basic.disable())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // 3. 인증/인가 설정
            .authorizeHttpRequests(auth -> auth
                // CORS preflight 요청 (OPTIONS) 모두 허용
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // 정적 리소스 (이미지 등) 접근 허용
                .requestMatchers("/v1/static/**").permitAll()
                .requestMatchers("/static/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/v1/userprofile/**").permitAll()
                // 이미지 업로드 (모든 메서드 임시 허용 - 개발용)
                .requestMatchers("/v1/uploads/**").permitAll()
                // 공개 카테고리 조회
                .requestMatchers(HttpMethod.GET, "/v1/categories/**").permitAll()
                // 데모용 찜 API 공개
                .requestMatchers("/v1/favorites/**").permitAll()
                // 공개 엔드포인트
                .requestMatchers("/auth/**", "/health", "/test", "/encode-password", "/v1/login", "/login","/v1/signup", "/v1/emailMatch", "/v1/idMatch", "/v1/auth/refresh", "/v1/auth/kakao/callback", "/v1/auth/google/callback", "/v1/auth/naver/callback").permitAll()
                // 상품 관련 공개 API (로그인 없이 조회 가능)
                .requestMatchers(HttpMethod.GET, "/v1/products", "/v1/products/**").permitAll()
                // 리뷰 조회 공개 API (로그인 없이 조회 가능)
                .requestMatchers(HttpMethod.GET, "/v1/reviews/**").permitAll()
                // 찜하기 API 임시 공개 (개발용 - 나중에 인증 필요로 변경)
                // .requestMatchers("/api/v1/favorites/**").permitAll()
                // 나머지는 인증 필요
                .anyRequest().authenticated()
            )

            // 4. JWT 필터 추가
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 허용할 Origin 명시적 지정 (allowCredentials 사용 시 필수)        
        List<String> origins = Arrays.stream(allowedOriginPatterns.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        log.debug("Configured allowed origins: {}", origins); // Debug log

        configuration.setAllowedOriginPatterns(origins);

        // 허용할 HTTP 메서드
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));

        // 허용할 헤더
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));

        // 인증 정보 포함 허용 (쿠키, Authorization 헤더 등)
        configuration.setAllowCredentials(true); // Reverted to true

        // preflight 요청 캐시 시간 (초)
        configuration.setMaxAge(3600L);

        // 노출할 헤더 (프론트엔드에서 접근 가능한 헤더)
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Content-Disposition"
        ));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
    @Bean
    public PasswordEncoder passwordEncoder() {
        
        return new BCryptPasswordEncoder();
    }
    
    
}