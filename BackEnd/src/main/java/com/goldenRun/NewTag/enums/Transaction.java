package com.goldenRun.NewTag.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Transaction {

    SOLD("SOLD", "판매 완료"),
    BOUGHT("BOUGHT", "구매 완료"),
    CANCELED("CANCELED", "거래 취소"),
    IN_PROGRESS("IN_PROGRESS", "거래 진행 중");
    
    private final String code;
    private final String description;
}