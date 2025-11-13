package com.goldenRun.NewTag.service;

import com.goldenRun.NewTag.Repository.UserRepository;
import com.goldenRun.NewTag.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;

@Service 
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        
        User user = userRepository.findByNick(username) 
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username));
        
        
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getNick()) 
                .password(user.getPassword())
                .roles(user.getRole().name()) 
                .build();
    }
}