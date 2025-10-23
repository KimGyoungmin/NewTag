package com.goldenRun.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Builder;
import lombok.Data;


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
}
