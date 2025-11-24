package com.goldenRun.NewTag.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import com.goldenRun.NewTag.Repository.UserRepository;
import com.goldenRun.NewTag.entity.User;

import jakarta.annotation.PostConstruct;
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

	@Value("${jwt.access-token-validity-ms:900000}")
	private long accessTokenValidityMs;

	@Value("${jwt.refresh-token-validity-ms:604800000}")
	private long refreshTokenValidityMs;

	private SecretKey key;

	@PostConstruct
	protected void init() {
		this.key = Keys.hmacShaKeyFor(secretKey.getBytes());
	}

	public String createAccessToken(String userPk) {
		return createToken(userPk, accessTokenValidityMs, "access");
	}

	public String createRefreshToken(String userPk) {
		return createToken(userPk, refreshTokenValidityMs, "refresh");
	}

	private String createToken(String userPk, long validityMillis, String tokenType) {
		Date now = new Date();
		Date validity = new Date(now.getTime() + validityMillis);

		return Jwts.builder()
				.subject(userPk)
				.issuedAt(now)
				.expiration(validity)
				.claim("tokenType", tokenType)
				.signWith(key)
				.compact();
	}

	public Authentication getAuthentication(String token) {
		String nick = this.getUserPk(token);
		User user = userRepository.findByNick(nick);

		if (user == null) {
			return null;
		}

		List<GrantedAuthority> authorities = new ArrayList<>();
		authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

		// Spring Security의 UserDetails 객체 생성
		UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
				.username(nick)
				.password("") // 비밀번호는 JWT 인증에서 사용하지 않으므로 빈 문자열
				.authorities(authorities)
				.build();

		return new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
	}

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

	public boolean validateToken(String token) {
	    try {
	        Jws<Claims> claims = Jwts.parser()
	                .setSigningKey(key)
	                .build()
	                .parseClaimsJws(token);

	        boolean isValid = !claims.getBody().getExpiration().before(new Date());
	        System.out.println("[JWT] Token validation result: " + isValid);
	        return isValid;
	    } catch (Exception e) {
	        System.out.println("[JWT] Token validation failed: " + e.getMessage());
	        e.printStackTrace();
	        return false;
	    }
	}

	public boolean isAccessToken(String token) {
		return hasTokenType(token, "access");
	}

	public boolean isRefreshToken(String token) {
		return hasTokenType(token, "refresh");
	}

	private boolean hasTokenType(String token, String tokenType) {
		try {
			String value = Jwts.parser()
					.setSigningKey(key)
					.build()
					.parseClaimsJws(token)
					.getBody()
					.get("tokenType", String.class);
			return tokenType.equals(value);
		} catch (Exception e) {
			return false;
		}
	}

	public long getRefreshTokenValidityMs() {
		return refreshTokenValidityMs;
	}
}
