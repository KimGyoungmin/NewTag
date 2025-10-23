package com.goldenRun.NewTag.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.service.UserService;

@RestController
public class UserController {

	@Autowired
	private UserService service;

	@PostMapping("/login")
	public ResponseEntity<Map<String, Object>> login(@RequestBody User loginUser) {

	    return service.login(loginUser);
	}
	@PostMapping("/signup")
	public ResponseEntity<?> signup(@RequestBody User request){
		return service.signup(request);
	}
	@GetMapping("/emailMatch")
	public ResponseEntity<?> emailMatch(@RequestBody String email){
		return service.emailMatch(email);
	}
	@GetMapping("/idMatch")
	public ResponseEntity<?> idMatch(@RequestBody String nick){
		return service.idMatch(nick);
	}
}
