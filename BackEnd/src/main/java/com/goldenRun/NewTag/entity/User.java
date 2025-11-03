package com.goldenRun.NewTag.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.goldenRun.NewTag.enums.Provider;
import com.goldenRun.NewTag.enums.Role;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.AssertTrue;
import jakarta.persistence.Index;
import jakarta.persistence.CascadeType;
import java.util.List;
import lombok.*;


@Table(
    name = "`user`",
    uniqueConstraints = {
        @UniqueConstraint(name = "unique_nick", columnNames = "nick"),
        @UniqueConstraint(name = "unique_provider_account", columnNames = {"provider", "provider_id"}),
        @UniqueConstraint(name = "unique_email", columnNames = "email")
    },
    indexes = {
        @Index(name = "idx_user_email", columnList = "email"),
        @Index(name = "idx_user_provider", columnList = "provider,provider_id"),
        @Index(name = "idx_user_is_delete", columnList = "is_delete"),
        @Index(name = "idx_user_created_at", columnList = "created_at")
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
    
     @Column(name = "email_verified", nullable = false)
     @Builder.Default
    private boolean emailVerified = false;

    @Column(name = "phone_verified", nullable = false)
    @Builder.Default
    private boolean phoneVerified = false;



    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private Role role = Role.USER;

    @Builder.Default
    private boolean isDelete = false;

    @Builder.Default
    private Double trust = 0.0;

    @Column(name = "profile_img", length = 500)
    @Builder.Default
    private String profileImg = "default_img.png";

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;


     @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
     @Builder.Default
    private List<Address> addresses = new ArrayList<>();

      @AssertTrue(message = "Invalid auth combination for provider/password/providerId")
    public boolean isAuthCombinationValid() {
        if (provider == Provider.LOCAL) {
            return password != null && !password.isBlank() && providerId == null;
        } else {
            return providerId != null && !providerId.isBlank() && (password == null || password.isBlank());
        }
    }

}
