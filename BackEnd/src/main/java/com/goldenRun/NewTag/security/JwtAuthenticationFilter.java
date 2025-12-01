package com.goldenRun.NewTag.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // Added Slf4j import
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;


@Slf4j // Added Slf4j annotation
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    private static final List<String> EXCLUDE_URLS = List.of(
            "/auth/**", // Changed from /api/auth/**
            "/health", // Changed from /api/health
            "/test", // Changed from /api/test
            "/encode-password", // Changed from /api/encode-password
            "/v1/login", // Changed from /api/v1/login
            "/login",    // Added for the frontend calling /api/login
            "/v1/signup", // Changed from /api/v1/signup
            "/v1/emailMatch", // Changed from /api/v1/emailMatch
            "/v1/idMatch", // Changed from /api/v1/idMatch
            "/v1/auth/refresh", // Changed from /api/v1/auth/refresh
            "/v1/auth/kakao/callback", // Changed from /api/v1/auth/kakao/callback
            "/v1/auth/google/callback", // Changed from /api/v1/auth/google/callback
            "/v1/auth/naver/callback", // Changed from /api/v1/auth/naver/callback
            "/v1/static/**", // Changed from /api/v1/static/**
            "/static/**",
            "/v1/userprofile/**", // Changed from /api/v1/userprofile/**

            "/v1/categories/**" // Changed from /api/v1/categories/**

            // "/v1/reviews/**" // Changed from /api/v1/reviews/**
            // "/api/v1/favorites/**" -> 필요하다면 추가
    );

    private AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String servletPath = request.getServletPath();
        log.debug("[JWT Filter] Checking path for bypass: {}", servletPath); // Changed to log.debug
        boolean shouldBypass = EXCLUDE_URLS.stream()
                .anyMatch(exclude -> pathMatcher.match(exclude, servletPath));
        if (shouldBypass) {
            log.debug("[JWT Filter] Bypassing for path: {}", servletPath); // Changed to log.debug
        }
        return shouldBypass;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws IOException, ServletException {

        log.debug("[JWT Filter] Request (applying filter): {} {}", request.getMethod(), request.getRequestURI()); // Changed to log.debug


        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = resolveToken(request);

        if (token != null && jwtTokenProvider.validateToken(token) && jwtTokenProvider.isAccessToken(token)) {
            Authentication auth = jwtTokenProvider.getAuthentication(token);
            log.debug("[JWT Filter] Authentication created: {}", (auth != null ? auth.getName() : "null")); // Changed to log.debug
            SecurityContextHolder.getContext().setAuthentication(auth);
        } else {
            log.debug("[JWT Filter] Token validation failed or token is null (applying filter)"); // Changed to log.debug
        }
        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
