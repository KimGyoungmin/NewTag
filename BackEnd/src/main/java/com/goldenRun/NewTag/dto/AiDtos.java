package com.goldenRun.NewTag.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Builder;

public class AiDtos {

    public record AutoWriteRequest(@NotEmpty List<String> imagePaths) {}

    @Builder
    public record AutoWriteResponse(
            String title,
            String content,
            Integer price,
            Long categoryId,
            String categoryName,
            String sourceImage) {}
}
