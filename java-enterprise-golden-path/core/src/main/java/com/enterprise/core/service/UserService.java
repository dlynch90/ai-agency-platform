package com.enterprise.core.service;

import com.enterprise.core.dto.UserDto;

import java.util.List;
import java.util.Optional;

/**
 * Service interface for User operations
 */
public interface UserService {

    /**
     * Create a new user
     */
    UserDto createUser(UserDto userDto);

    /**
     * Get user by ID
     */
    Optional<UserDto> getUserById(Long id);

    /**
     * Get all users with pagination
     */
    List<UserDto> getAllUsers(int page, int size);

    /**
     * Update user
     */
    Optional<UserDto> updateUser(Long id, UserDto userDto);

    /**
     * Delete user
     */
    boolean deleteUser(Long id);

    /**
     * Activate user
     */
    Optional<UserDto> activateUser(Long id);

    /**
     * Deactivate user
     */
    Optional<UserDto> deactivateUser(Long id);

    /**
     * Check if current user has access to specified user ID
     */
    boolean isCurrentUser(Long userId);
}