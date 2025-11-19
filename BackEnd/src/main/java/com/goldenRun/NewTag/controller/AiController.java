package com.goldenRun.NewTag.controller;

import com.goldenRun.NewTag.dto.AiDtos.AutoWriteRequest;
import com.goldenRun.NewTag.dto.AiDtos.AutoWriteResponse;
import com.goldenRun.NewTag.service.AiListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowCredentials = "true")
@RequiredArgsConstructor
public class AiController {

    private final AiListingService aiListingService;

    @PostMapping("/auto-listing")
    public ResponseEntity<AutoWriteResponse> autoListing(@Valid @RequestBody AutoWriteRequest request) {
        return ResponseEntity.ok(aiListingService.generateListing(request));
    }
}
