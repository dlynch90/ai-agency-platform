package com.enterprise.infrastructure.entity;

import com.enterprise.core.entity.BaseEntity;
import com.enterprise.core.domain.UserStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * JPA Entity for User - maps to database table
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_username", columnList = "username", unique = true),
    @Index(name = "idx_users_email", columnList = "email", unique = true),
    @Index(name = "idx_users_status", columnList = "status"),
    @Index(name = "idx_users_created_at", columnList = "created_at")
})
public class UserEntity extends BaseEntity {

    @NotBlank
    @Size(min = 3, max = 50)
    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @NotBlank
    @Email
    @Size(max = 255)
    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @NotBlank
    @Size(max = 100)
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @NotBlank
    @Size(max = 100)
    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private UserStatus status;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Size(max = 255)
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Size(max = 64)
    @Column(name = "salt", length = 64)
    private String salt;

    // Constructors
    public UserEntity() {
        super();
        this.status = UserStatus.ACTIVE;
    }

    // Getters and setters
    public String getUsername() {
        return username;
    }

    public UserEntity setUsername(String username) {
        this.username = username;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    public String getEmail() {
        return email;
    }

    public UserEntity setEmail(String email) {
        this.email = email;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    public String getFirstName() {
        return firstName;
    }

    public UserEntity setFirstName(String firstName) {
        this.firstName = firstName;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    public String getLastName() {
        return lastName;
    }

    public UserEntity setLastName(String lastName) {
        this.lastName = lastName;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    public UserStatus getStatus() {
        return status;
    }

    public UserEntity setStatus(UserStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    public LocalDateTime getLastLoginAt() {
        return lastLoginAt;
    }

    public UserEntity setLastLoginAt(LocalDateTime lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
        return this;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public UserEntity setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    public String getSalt() {
        return salt;
    }

    public UserEntity setSalt(String salt) {
        this.salt = salt;
        return this;
    }

    // Business methods
    public String getFullName() {
        return firstName + " " + lastName;
    }

    public boolean isActive() {
        return status == UserStatus.ACTIVE && !deleted;
    }

    public void activate() {
        this.status = UserStatus.ACTIVE;
        this.updatedAt = LocalDateTime.now();
    }

    public void deactivate() {
        this.status = UserStatus.INACTIVE;
        this.updatedAt = LocalDateTime.now();
    }

    public void recordLogin() {
        this.lastLoginAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}