package com.goldenRun.NewTag.controller;

import com.goldenRun.NewTag.dto.PostDtos;
import com.goldenRun.NewTag.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/products")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowCredentials = "true")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    /**
     * 게시글(상품) 작성
     */
    @PostMapping
    public ResponseEntity<PostDtos.SimpleResponse> createPost(
            @RequestBody PostDtos.CreateRequest request,
            @AuthenticationPrincipal String currentUserNick
    ) {
        PostDtos.SimpleResponse response = postService.createPost(request, currentUserNick);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 게시글 삭제 (소프트 삭제)
     */
    @DeleteMapping("/{postId}")
    public ResponseEntity<Map<String, Object>> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal String currentUserNick
    ) {
        postService.deletePost(postId, currentUserNick);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "게시글이 삭제되었습니다."
        ));
    }
}
