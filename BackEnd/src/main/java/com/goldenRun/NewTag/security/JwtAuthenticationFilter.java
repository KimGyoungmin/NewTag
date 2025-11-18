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

        HttpServletRequest httpRequest = (HttpServletRequest) request;

        System.out.println("[JWT Filter] Request: " + httpRequest.getMethod() + " " + httpRequest.getRequestURI());

        // 모든 헤더 출력 (디버깅용)
        System.out.println("[JWT Filter] All Headers:");
        java.util.Enumeration<String> headerNames = httpRequest.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            System.out.println("  " + headerName + ": " + httpRequest.getHeader(headerName));
        }

        // CORS preflight 요청(OPTIONS)은 토큰 검증 없이 통과
        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        // HTTP 요청 헤더에서 토큰을 추출
        String token = resolveToken(httpRequest);
        System.out.println("[JWT Filter] Token extracted: " + (token != null ? token.substring(0, Math.min(20, token.length())) + "..." : "null"));

        // 토큰 유효성 검증
        if (token != null && jwtTokenProvider.validateToken(token) && jwtTokenProvider.isAccessToken(token)) {
            // 토큰이 유효하면 인증 객체를 생성
            Authentication auth = jwtTokenProvider.getAuthentication(token);
            System.out.println("[JWT Filter] Authentication created: " + (auth != null ? auth.getName() : "null"));
            // SecurityContextHolder에 인증 객체를 설정하여 인증 상태로 만듬
            SecurityContextHolder.getContext().setAuthentication(auth);
        } else {
            System.out.println("[JWT Filter] Token validation failed or token is null");
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
