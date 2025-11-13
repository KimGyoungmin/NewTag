package com.goldenRun.NewTag.security;


import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.GenericFilterBean;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends GenericFilterBean {

	
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        // HTTP 요청 헤더에서 토큰을 추출
        String token = resolveToken((HttpServletRequest) request);

        // 토큰 유효성 검증
        if (token != null && jwtTokenProvider.validateToken(token)) {
            // 토큰이 유효하면 인증 객체를 생성
            Authentication auth = jwtTokenProvider.getAuthentication(token);
            // SecurityContextHolder에 인증 객체를 설정하여 인증 상태로 만듬
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        chain.doFilter(request, response);
    }

    // HTTP 헤더에서 "Authorization: Bearer <token>" 형식으로 토큰 추출
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}