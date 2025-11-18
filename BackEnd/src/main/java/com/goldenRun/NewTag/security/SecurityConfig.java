package com.goldenRun.NewTag.security;

import lombok.RequiredArgsConstructor;
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

import java.util.Arrays;



@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {



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
                .requestMatchers("/api/v1/uploads/images/**").permitAll()
                .requestMatchers("/api/v1/static/**").permitAll()
                .requestMatchers("/static/**").permitAll()
                // 공개 엔드포인트
                .requestMatchers("/api/auth/**", "/api/health", "/api/test", "/api/encode-password", "/api/v1/login", "/api/v1/signup", "/api/v1/emailMatch", "/api/v1/idMatch", "/api/v1/auth/refresh").permitAll()
                // 상품 관련 공개 API (로그인 없이 조회 가능)
                .requestMatchers(HttpMethod.GET, "/api/v1/products", "/api/v1/products/**").permitAll()
                // 리뷰 조회 공개 API (로그인 없이 조회 가능)
                .requestMatchers(HttpMethod.GET, "/api/v1/reviews/**").permitAll()
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
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*",
            "http://127.0.0.1:*"
        ));

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
        configuration.setAllowCredentials(true);

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