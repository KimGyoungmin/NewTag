package com.goldenRun.NewTag.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.security.Key;
import java.util.Date;

import javax.crypto.SecretKey;
// import java.util.List; // roles를 사용하지 않으므로 필요 없습니다.

@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

	private final UserDetailsService userDetailsService;

	@Value("${jwt.secret-key}")
	private String secretKey;

	private SecretKey key;

	@PostConstruct
	protected void init() {
		this.key = Keys.hmacShaKeyFor(secretKey.getBytes());
	}

	// 토큰 생성 (역할 정보 제외)
	public String createToken(String userPk) {
		Date now = new Date();
		long tokenValidTime = 30 * 60 * 1000L;
		Date validity = new Date(now.getTime() + tokenValidTime);

		return Jwts.builder().subject(userPk)
				.issuedAt(now) 
				.expiration(validity) 
				.signWith(key) 
				.compact();
	}

	// 토큰에서 인증 정보 조회
	public Authentication getAuthentication(String token) {
		UserDetails userDetails = userDetailsService.loadUserByUsername(this.getUserPk(token));
		return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
	}

	// 토큰에서 회원 정보 추출
	public String getUserPk(String token) {
	    try {
	        return Jwts.parser() 
	                .setSigningKey(key) 
	                .build()
	                .parseClaimsJws(token) 
	                .getBody()
	                .getSubject();
	    } catch (Exception e) {
	        return null;
	    }
	}

	// 토큰 유효성 검증
	public boolean validateToken(String token) {
	    try {
	        Jws<Claims> claims = Jwts.parser() 
	                .setSigningKey(key)
	                .build()
	                .parseClaimsJws(token);

	        return !claims.getBody().getExpiration().before(new Date());
	    } catch (Exception e) {
	        return false;
	    }
	}
}