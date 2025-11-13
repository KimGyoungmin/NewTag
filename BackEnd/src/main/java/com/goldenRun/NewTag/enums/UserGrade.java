package com.goldenRun.NewTag.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserGrade {

    
    BRONZE("Bronze", "일반 사용자. 판매 활동 시작 단계입니다."),
    SILVER("Silver", "판매 실적이 우수한 사용자. 신뢰도가 높습니다."),
    GOLD("Gold", "최우수 판매자. 높은 평점과 거래량을 보유했습니다."),
    VIP("VIP", "최상위 판매자. 플랫폼 내 최고 수준의 신뢰도를 가집니다.");

    private final String displayName; // 등급
    private final String description; // 등급에 대한 설명

    
    public static UserGrade fromDisplayName(String displayName) {
        for (UserGrade grade : UserGrade.values()) {
            if (grade.displayName.equalsIgnoreCase(displayName)) {
                return grade;
            }
        }
        throw new IllegalArgumentException("Invalid UserGrade Display Name: " + displayName);
    }
}