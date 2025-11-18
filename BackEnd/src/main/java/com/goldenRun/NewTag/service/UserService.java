package com.goldenRun.NewTag.service;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie.ResponseCookieBuilder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.goldenRun.NewTag.Repository.UserRepository;
import com.goldenRun.NewTag.dto.UserDtos;
import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.security.JwtTokenProvider;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

@Service
public class UserService {

	private static final String REFRESH_TOKEN_COOKIE = "refresh_token";

	@Autowired
	private UserRepository repository;

	@Autowired
	private PasswordEncoder encoder;

	@Autowired
	private JwtTokenProvider jwtTokenProvider;

	@Value("${jwt.refresh-token-cookie-domain:}")
	private String refreshCookieDomain;

	@Value("${jwt.refresh-token-cookie-secure:true}")
	private boolean refreshCookieSecure;

	@Value("${jwt.refresh-token-cookie-same-site:None}")
	private String refreshCookieSameSite;

	public ResponseEntity<Map<String, Object>> login(User loginUser) {
		User user = repository.findByNick(loginUser.getNick());

		if (user != null && encoder.matches(loginUser.getPassword(), user.getPassword())) {
			String accessToken = jwtTokenProvider.createAccessToken(user.getNick());
			String refreshToken = jwtTokenProvider.createRefreshToken(user.getNick());

			Map<String, Object> response = new HashMap<>();
			response.put("success", true);
			response.put("message", "로그인 성공!");
			response.put("token", accessToken);
			response.put("user", UserDtos.SimpleResponse.from(user));

			return ResponseEntity.ok()
					.header(HttpHeaders.SET_COOKIE, buildRefreshTokenCookie(refreshToken, jwtTokenProvider.getRefreshTokenValidityMs()).toString())
					.body(response);
		}

		Map<String, Object> response = new HashMap<>();
		response.put("success", false);
		response.put("message", "아이디 또는 비밀번호가 올바르지 않습니다.");
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
	}

	public ResponseEntity<Map<String, Object>> refreshAccessToken(HttpServletRequest request) {
		String refreshToken = extractRefreshToken(request);
		if (refreshToken == null || !jwtTokenProvider.validateToken(refreshToken) || !jwtTokenProvider.isRefreshToken(refreshToken)) {
			return unauthorizedResponse();
		}

		String nick = jwtTokenProvider.getUserPk(refreshToken);
		if (nick == null) {
			return unauthorizedResponse();
		}

		User user = repository.findByNick(nick);
		if (user == null) {
			return unauthorizedResponse();
		}

		String newAccessToken = jwtTokenProvider.createAccessToken(nick);
		String newRefreshToken = jwtTokenProvider.createRefreshToken(nick);

		Map<String, Object> response = new HashMap<>();
		response.put("success", true);
		response.put("token", newAccessToken);
		response.put("user", UserDtos.SimpleResponse.from(user));

		return ResponseEntity.ok()
				.header(HttpHeaders.SET_COOKIE, buildRefreshTokenCookie(newRefreshToken, jwtTokenProvider.getRefreshTokenValidityMs()).toString())
				.body(response);
	}

	public ResponseEntity<Map<String, Object>> logout() {
		Map<String, Object> response = new HashMap<>();
		response.put("success", true);
		response.put("message", "로그아웃 되었습니다.");

		return ResponseEntity.ok()
				.header(HttpHeaders.SET_COOKIE, buildRefreshTokenCookie("", 0).toString())
				.body(response);
	}


	public ResponseEntity<?> idMatch(String nick) {
	    Boolean isNickExist = repository.existsByNick(nick);
	    Map<String, Object> response = new HashMap<>();
	    if (isNickExist) {
	    	response.put("success", false);
	        response.put("message", "이미 사용중인 닉네임입니다.");
	        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
	    } else {
	    	response.put("success", true);
	        response.put("message", "사용 가능한 닉네임입니다.");
	        return ResponseEntity.ok(response);
	    }
	}

	public ResponseEntity<?> emailMatch(String email) {
		Boolean isEmailExist = repository.existsByEmail(email);
		 Map<String, Object> response = new HashMap<>();
	    if (isEmailExist) {
	    	response.put("success", false);
	        response.put("message", "이미 사용중인 이메일입니다.");
	        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
	    } else {
	    	response.put("success", true);
	        response.put("message", "사용 가능한 이메일입니다.");
	        return ResponseEntity.ok(response);
	    }
	}

	public ResponseEntity<?> signup(User request) {
		try {
	        String rawPassword = request.getPassword();
	        String encodedPassword = encoder.encode(rawPassword);
	        request.setPassword(encodedPassword);

	        repository.save(request);

	        Map<String, Object> response = new HashMap<>();
	        response.put("success", true);
	        response.put("message", "회원가입이 완료되었습니다.");

	        return ResponseEntity
	                .status(HttpStatus.CREATED)
	                .body(response);

	    } catch (Exception e) {
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                             .body(Map.of("success", false, "message", "서버 오류가 발생했습니다."));
	    }
	}

	private ResponseCookie buildRefreshTokenCookie(String value, long maxAgeMillis) {
		// ResponseCookie.Builder builder = ResponseCookie.from(REFRESH_TOKEN_COOKIE, value)
		ResponseCookieBuilder builder = ResponseCookie.from(REFRESH_TOKEN_COOKIE, value)
		 		.httpOnly(true)
		 		.secure(refreshCookieSecure)
		 		.path("/")
		 		.sameSite(refreshCookieSameSite);
		if (maxAgeMillis <= 0) {
			builder.maxAge(Duration.ZERO);
		} else {
			builder.maxAge(Duration.ofMillis(maxAgeMillis));
		}

		if (StringUtils.hasText(refreshCookieDomain)) {
			builder.domain(refreshCookieDomain);
		}

		return builder.build();
	}

	private String extractRefreshToken(HttpServletRequest request) {
		if (request.getCookies() == null) {
			return null;
		}

		for (Cookie cookie : request.getCookies()) {
			if (REFRESH_TOKEN_COOKIE.equals(cookie.getName())) {
				return cookie.getValue();
			}
		}
		return null;
	}

	private ResponseEntity<Map<String, Object>> unauthorizedResponse() {
		Map<String, Object> response = new HashMap<>();
		response.put("success", false);
		response.put("message", "인증 정보가 유효하지 않습니다.");
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.header(HttpHeaders.SET_COOKIE, buildRefreshTokenCookie("", 0).toString())
				.body(response);
	}
}
