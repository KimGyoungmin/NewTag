package com.goldenRun.NewTag.controller;

import com.goldenRun.NewTag.Repository.UserRepository;
import com.goldenRun.NewTag.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;

    /**
     * 현재 로그인한 사용자 정보를 반환한다.
     * JWT 필터가 Authentication 객체에 nick을 principal 로 넣어두므로
     * nick 으로 DB 조회 뒤 필요한 최소 정보만 내려준다.
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMe(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "인증 정보가 없습니다."));
        }

        String nick = authentication.getName();
        User user = userRepository.findByNick(nick);
        
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "사용자를 찾을 수 없습니다."));
        }

        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId());
        data.put("nick", user.getNick());
        data.put("name", user.getName());
        data.put("email", user.getEmail());
        data.put("profileImg", user.getProfileImg());
        data.put("role", user.getRole());
        data.put("provider", user.getProvider());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);

        return ResponseEntity.ok(response);
    }
}
