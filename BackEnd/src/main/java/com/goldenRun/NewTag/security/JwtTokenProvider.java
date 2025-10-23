package com.goldenRun.NewTag.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import com.goldenRun.NewTag.Repository.UserRepository;
import com.goldenRun.NewTag.entity.User;

import jakarta.annotation.PostConstruct;
import java.security.Key;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.crypto.SecretKey;

@Component
public class JwtTokenProvider {

	@Autowired
	private UserRepository userRepository;

	@Value("${jwt.secret-key}")
	private String secretKey;

	private SecretKey key;

	@PostConstruct
	protected void init() {
		this.key = Keys.hmacShaKeyFor(secretKey.getBytes());
	}

	// 토큰 생성
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
		String nick = this.getUserPk(token);
		User user = userRepository.findByNick(nick);

		if (user == null) {
			return null;
		}

		// 사용자 권한 설정
		List<GrantedAuthority> authorities = new ArrayList<>();
		authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

		return new UsernamePasswordAuthenticationToken(nick, null, authorities);
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