package com.goldenRun.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;


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
    
    
    private Double trust;
}
