package com.enterprise.core.entity;

import com.enterprise.core.domain.UserStatus;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * User entity representing a system user
 */
public class User extends BaseEntity {

    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private UserStatus status;
    private LocalDateTime lastLoginAt;
    private String passwordHash;
    private String salt;

    // Constructors
    public User() {
        super();
    }

    public User(String username, String email, String firstName, String lastName) {
        super();
        this.username = username;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.status = UserStatus.ACTIVE;
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

    // Getters and setters
    public String getUsername() {
        return username;
    }

    public User setUsername(String username) {
        this.username = username;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    public String getEmail() {
        return email;
    }

    public User setEmail(String email) {
        this.email = email;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    public String getFirstName() {
        return firstName;
    }

    public User setFirstName(String firstName) {
        this.firstName = firstName;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    public String getLastName() {
        return lastName;
    }

    public User setLastName(String lastName) {
        this.lastName = lastName;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    public UserStatus getStatus() {
        return status;
    }

    public User setStatus(UserStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    public LocalDateTime getLastLoginAt() {
        return lastLoginAt;
    }

    public User setLastLoginAt(LocalDateTime lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
        return this;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public User setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    public String getSalt() {
        return salt;
    }

    public User setSalt(String salt) {
        this.salt = salt;
        return this;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User)) return false;
        if (!super.equals(o)) return false;
        User user = (User) o;
        return Objects.equals(username, user.username);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), username);
    }

    @Override
    public String toString() {
        return "User{" +
                "username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", status=" + status +
                "} " + super.toString();
    }
}