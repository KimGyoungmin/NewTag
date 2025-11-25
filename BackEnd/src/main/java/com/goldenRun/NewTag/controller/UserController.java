package com.goldenRun.NewTag.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.service.KakaoAuthService;
import com.goldenRun.NewTag.service.UserService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowCredentials = "true")
public class UserController {

	@Autowired
	private UserService service;

	@Autowired
	private KakaoAuthService kakaoAuthService;

	@PostMapping("/login")
	public ResponseEntity<Map<String, Object>> login(@RequestBody User loginUser) {

	    return service.login(loginUser);
	}

	@PostMapping("/auth/refresh")
	public ResponseEntity<Map<String, Object>> refresh(HttpServletRequest request) {
		return service.refreshAccessToken(request);
	}

	@PostMapping("/logout")
	public ResponseEntity<Map<String, Object>> logout() {
		return service.logout();
	}
	@PostMapping("/signup")
	public ResponseEntity<?> signup(@RequestBody User request){
		return service.signup(request);
	}
	@GetMapping("/emailMatch")
	public ResponseEntity<?> emailMatch(@RequestParam String email){
		return service.emailMatch(email);
	}
	@GetMapping("/idMatch")
	public ResponseEntity<?> idMatch(@RequestParam String nick){
		return service.idMatch(nick);
	}

	/**
	 * 카카오 로그인 콜백 처리
	 */
	@GetMapping("/auth/kakao/callback")
	public ResponseEntity<Map<String, Object>> kakaoCallback(@RequestParam String code) {
		return kakaoAuthService.processKakaoLogin(code);
	}
}
