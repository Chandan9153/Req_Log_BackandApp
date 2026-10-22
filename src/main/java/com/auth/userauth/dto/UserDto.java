package com.auth.userauth.dto;

import com.auth.userauth.entity.User;
import java.time.LocalDateTime;

public class UserDto {

    private Long id;
    private String fullName;
    private String username;
    private String email;
    private String mobileNumber;
    private LocalDateTime createdAt;

    public UserDto() {
    }

    public UserDto(Long id, String fullName, String username, String email, String mobileNumber, LocalDateTime createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.username = username;
        this.email = email;
        this.mobileNumber = mobileNumber;
        this.createdAt = createdAt;
    }

    public static UserDto fromEntity(User user) {
        if (user == null) return null;
        return new UserDto(
            user.getId(),
            user.getFullName(),
            user.getUsername(),
            user.getEmail(),
            user.getMobileNumber(),
            user.getCreatedAt()
        );
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
