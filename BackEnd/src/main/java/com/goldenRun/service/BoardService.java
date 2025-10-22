package com.goldenRun.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.goldenRun.security.JwtTokenProvider;
import com.goldenRun.Repository.BoardRepository;
import com.goldenRun.entity.User;

@Service
public class BoardService {
	
	@Autowired
	private BoardRepository repository;
	
	@Autowired
	private PasswordEncoder encoder;
	
	@Autowired
	private JwtTokenProvider jwtTokenProvider;

	public ResponseEntity<Map<String, Object>> login(User loginUser) {

	 	User user = repository.findByNick(loginUser.getNick());
		
	 	
		
		if (user.getNick() != null && encoder.matches(loginUser.getPassword(), user.getPassword())) {
		
            
			// 3. 인증 성공 시, 주입받은 인스턴스를 사용하여 토큰을 생성합니다.
            String token = jwtTokenProvider.createToken(user.getNick());

            // 4. 성공 응답에 토큰을 담아 반환합니다.
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "로그인 성공!");
            response.put("token", token);
            return ResponseEntity.ok(response);
        } else {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "아이디 또는 비밀번호가 올바르지 않습니다.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
		
	}
	
	

	public ResponseEntity<?> idMatch(String nick) {
		// 아이디 존재 여부 확인
	    Boolean isNickExist = repository.existsByNick(nick);
	    Map<String, Object> response = new HashMap<>();
	    if (isNickExist) {
	    	response.put("success", false);
	        response.put("message", "사용중인 아이디입니다.");
	        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
	    }else {
	    	response.put("success", true);
	        response.put("message", "사용가능한 아이디입니다.");
	        response.put("message", "사용가능한 이메일입니다.");
	        return ResponseEntity.ok(response);
	    }
		 
		 
		
	}
	
	public ResponseEntity<?> emailMatch(String email) {
		// 이메일 존재 여부 확인
		Boolean isEmailExist = repository.existsByEmail(email);
		 Map<String, Object> response = new HashMap<>();
	    if (isEmailExist) {
	    	response.put("success", false);
	        response.put("message", "사용중인 이메일입니다.");
	        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
	    }else {
	    	response.put("success", true);
	        response.put("message", "사용가능한 이메일입니다.");
	        return ResponseEntity.ok(response); // 200 OK 반환
	    }
	    
		
		 
		
	}

	public ResponseEntity<?> signup(User request) {
		try {
	        // 비번 암호화
	        String rawPassword = request.getPassword();
	        String encodedPassword = encoder.encode(rawPassword);
	        request.setPassword(encodedPassword);

	        //DB저장
	        repository.save(request);

	        // 회원가입성공시
	        Map<String, Object> response = new HashMap<>();
	        response.put("success", true);
	        response.put("message", "회원가입이 완료되었습니다.");

	        return ResponseEntity
	                .status(HttpStatus.CREATED)
	                .body(response);

	    } catch (Exception e) {
	        // 회원가입 실패시
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                             .body(Map.of("success", false, "message", "서버 오류가 발생했습니다."));
	    }
	}

}
