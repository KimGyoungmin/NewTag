package com.goldenRun.NewTag.security;

import lombok.RequiredArgsConstructor;

import java.util.Arrays;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource; 
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;





@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    
    
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. HTTP Basic, CSRF, 세션 관리 설정
            .httpBasic(basic -> basic.disable()) // httpBasic().disable()
            .csrf(csrf -> csrf.disable())       // csrf().disable()
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            //  CORS 설정 추가
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            
            
            
            .authorizeHttpRequests(auth -> auth
                
                .requestMatchers("/api/v1/**").permitAll()
                
                .anyRequest().authenticated()
            )
            
            // 3. JWT 필터 추가
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
            
        return http.build();
    }
    @Bean
    public PasswordEncoder passwordEncoder() {
        
        return new BCryptPasswordEncoder();
    }
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        //  프론트엔드가 실행되는 포트(예: http://localhost:3000)를 허용
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5174", "http://127.0.0.1:5174")); 
        
        // JWT 인증에 필요한 Header와 Method 허용
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type"));
        configuration.setAllowCredentials(true); // 쿠키/인증 정보 허용 (JWT 사용 시 필요)

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // 모든 경로에 적용
        
        return source;
    }

  
    
}