package com.goldenRun.NewTag.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReportTargetType {

    USER("USER", "사용자 신고"),
    PRODUCT("PRODUCT", "상품 신고"),
    REVIEW("REVIEW", "거래 후기 신고");

    private final String code;
    private final String description;
}