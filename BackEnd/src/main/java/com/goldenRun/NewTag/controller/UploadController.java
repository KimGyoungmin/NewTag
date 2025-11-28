package com.goldenRun.NewTag.controller;

import com.goldenRun.NewTag.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import com.goldenRun.NewTag.Repository.UserRepository;
import com.goldenRun.NewTag.entity.User;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;

    @PostMapping("/images")
    public ResponseEntity<Map<String, Object>> uploadImage(@RequestParam("file") MultipartFile file) {
        String path = fileStorageService.store(file);
        String url = "/api/v1/static/" + path;

        return ResponseEntity.ok(Map.of(
                "success", true,
                "path", path,
                "url", url
        ));
    }

    @PostMapping("/profile")
    public ResponseEntity<Map<String, Object>> uploadProfileImage(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "인증 정보가 없습니다."));
        }

        User user = userRepository.findByNick(userDetails.getUsername());
        String folder = (user != null && user.getId() != null) ? user.getId().toString() : userDetails.getUsername();

        String path = fileStorageService.storeProfileImage(file, folder);
        String url = "/api/v1/" + path;

        return ResponseEntity.ok(Map.of(
                "success", true,
                "path", path,
                "url", url
        ));
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> uploadChatImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "chatRoomId", required = false) String chatRoomId
    ) {
        String folder = chatRoomId != null ? "chat/" + chatRoomId : "chat/temp";
        String path = fileStorageService.storeChatImage(file, folder);
        String url = "/api/v1/static/" + path;

        return ResponseEntity.ok(Map.of(
                "success", true,
                "path", path,
                "url", url
        ));
    }
}
