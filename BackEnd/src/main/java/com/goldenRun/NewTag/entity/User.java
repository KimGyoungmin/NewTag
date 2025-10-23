package com.goldenRun.NewTag.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Table(
	    name = "user",
	    uniqueConstraints = {
	        @UniqueConstraint(columnNames = {"nick"}),
	        @UniqueConstraint(columnNames = {"provider", "provider_id"}),
	        @UniqueConstraint(columnNames = {"email"})
	    }
	)
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class User {
	
	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  

    @Column(length = 20, nullable = false)
    private String name;  

    @Column(length = 50, nullable = false)
    private String nick;  

    @Column(length = 200)
    private String password;  

    @Column(length = 200, nullable = false)
    private String email;  

    @Column(length = 50)
    private String phone;  

    private LocalDate birth;  
    
    
    
    
    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private Provider provider = Provider.LOCAL;

    @Column(name = "provider_id", length = 100)
    private String providerId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private Role role = Role.USER;

    @Builder.Default
    private boolean isDelete = false;

    @Builder.Default
    private Double trust = 0.0;

    @Column(name = "profile_img", length = 500)
    private String profileImg;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
