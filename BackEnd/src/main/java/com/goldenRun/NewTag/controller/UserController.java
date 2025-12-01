package com.goldenRun.NewTag.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import com.goldenRun.NewTag.dto.UserDtos;
import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.service.ProductService;
import com.goldenRun.NewTag.service.ReviewService;
import com.goldenRun.NewTag.service.GoogleAuthService;
import com.goldenRun.NewTag.service.KakaoAuthService;
import com.goldenRun.NewTag.service.NaverAuthService;
import com.goldenRun.NewTag.service.UserService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/v1")
public class UserController {

	@Autowired
	private UserService service;

	@Autowired
	private KakaoAuthService kakaoAuthService;

	@Autowired
	private GoogleAuthService googleAuthService;

	@Autowired
	private NaverAuthService naverAuthService;

	@Autowired
	private ReviewService reviewService;

	@Autowired
	private ProductService productService;

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

	@PutMapping("/update")
	public ResponseEntity<?> updateUser(
			@AuthenticationPrincipal UserDetails userDetails,
			@RequestBody UserDtos.UpdateRequest request
	){
		if (userDetails == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("success", false, "message", "인증 정보가 없습니다."));
		}
		return service.updateUser(request, userDetails.getUsername());
	}

	/**
	 * 카카오 로그인 콜백 처리
	 */
	@GetMapping("/auth/kakao/callback")
	public ResponseEntity<Map<String, Object>> kakaoCallback(@RequestParam String code) {
		return kakaoAuthService.processKakaoLogin(code);
	}

	/**
	 * 구글 로그인 콜백 처리
	 */
	@GetMapping("/auth/google/callback")
	public ResponseEntity<Map<String, Object>> googleCallback(@RequestParam String code) {
		return googleAuthService.processGoogleLogin(code);
	}

	/**
	 * 네이버 로그인 콜백 처리
	 */
	@GetMapping("/auth/naver/callback")
	public ResponseEntity<Map<String, Object>> naverCallback(
			@RequestParam String code,
			@RequestParam String state) {
		return naverAuthService.processNaverLogin(code, state);
	}

	@GetMapping("/sellers/{sellerId}")
	public ResponseEntity<Map<String, Object>> getSellerProfile(
			@PathVariable Long sellerId,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "12") int size
	) {
		User seller = service.findById(sellerId);
		if (seller == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body(Map.of("success", false, "message", "판매자를 찾을 수 없습니다."));
		}

		var ratingSummary = reviewService.getRatingSummary(sellerId);
		var productPage = productService.getProductsBySeller(sellerId, page, size);
		long totalProducts = productService.countActiveProductsBySeller(sellerId);

		UserDtos.SellerProfileResponse profile = UserDtos.SellerProfileResponse.builder()
				.seller(UserDtos.SimpleResponse.from(seller))
				.reviewSummary(UserDtos.ReviewSummary.builder()
						.averageRating(ratingSummary.getAverageRating())
						.totalCount(ratingSummary.getTotalCount())
						.rating1Count(ratingSummary.getRating1Count())
						.rating2Count(ratingSummary.getRating2Count())
						.rating3Count(ratingSummary.getRating3Count())
						.rating4Count(ratingSummary.getRating4Count())
						.rating5Count(ratingSummary.getRating5Count())
						.build())
				.products(productPage.getContent())
				.totalProducts(totalProducts)
				.build();

		return ResponseEntity.ok(Map.of(
				"success", true,
				"data", profile,
				"currentPage", productPage.getNumber(),
				"totalPages", productPage.getTotalPages(),
				"totalElements", productPage.getTotalElements(),
				"pageSize", productPage.getSize()
		));
	}
}
