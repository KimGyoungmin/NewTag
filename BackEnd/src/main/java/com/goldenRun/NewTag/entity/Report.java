package com.goldenRun.NewTag.entity;

import com.goldenRun.NewTag.enums.ReportTargetType; // 신고 대상 타입 Enum이 필요합니다.

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "report")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // --- 신고한 사용자 (나) ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_user_id", nullable = false)
    private User reporterUser;

    // --- 신고 대상 사용자 ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id") 
    private User targetUser; 
    
    //  신고 대상 타입 
    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private ReportTargetType targetType;

    //  신고 대상 ID
    @Column(name = "target_id")
    private Long targetId; 

    @Column(columnDefinition = "TEXT", nullable = false)
    private String reason; // 신고 사유 상세

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}