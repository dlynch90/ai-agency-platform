package com.enterprise.infrastructure.service;

import com.enterprise.core.domain.UserStatus;
import com.enterprise.core.dto.UserDto;
import com.enterprise.core.service.UserService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Simple in-memory implementation of UserService for demonstration
 * In production, this would use JPA repository
 */
@Service
public class UserServiceImpl implements UserService {

    private final Map<Long, UserDto> users = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    @Override
    public UserDto createUser(UserDto userDto) {
        // Check for existing username/email (simplified)
        if (users.values().stream().anyMatch(u -> u.getUsername().equals(userDto.getUsername()))) {
            throw new IllegalArgumentException("Username already exists: " + userDto.getUsername());
        }
        if (users.values().stream().anyMatch(u -> u.getEmail().equals(userDto.getEmail()))) {
            throw new IllegalArgumentException("Email already exists: " + userDto.getEmail());
        }

        UserDto newUser = new UserDto(
            idGenerator.getAndIncrement(),
            userDto.getUsername(),
            userDto.getEmail(),
            userDto.getFirstName(),
            userDto.getLastName(),
            UserStatus.ACTIVE,
            LocalDateTime.now(),
            LocalDateTime.now(),
            null
        );

        users.put(newUser.getId(), newUser);
        return newUser;
    }

    @Override
    public Optional<UserDto> getUserById(Long id) {
        return Optional.ofNullable(users.get(id));
    }

    @Override
    public List<UserDto> getAllUsers(int page, int size) {
        return users.values().stream()
            .skip((long) page * size)
            .limit(size)
            .toList();
    }

    @Override
    public Optional<UserDto> updateUser(Long id, UserDto userDto) {
        UserDto existing = users.get(id);
        if (existing != null) {
            UserDto updated = new UserDto(
                existing.getId(),
                existing.getUsername(),
                existing.getEmail(),
                userDto.getFirstName(),
                userDto.getLastName(),
                existing.getStatus(),
                existing.getCreatedAt(),
                LocalDateTime.now(),
                existing.getLastLoginAt()
            );
            users.put(id, updated);
            return Optional.of(updated);
        }
        return Optional.empty();
    }

    @Override
    public boolean deleteUser(Long id) {
        return users.remove(id) != null;
    }

    @Override
    public Optional<UserDto> activateUser(Long id) {
        UserDto user = users.get(id);
        if (user != null) {
            UserDto updated = new UserDto(
                user.getId(), user.getUsername(), user.getEmail(),
                user.getFirstName(), user.getLastName(),
                UserStatus.ACTIVE,
                user.getCreatedAt(), LocalDateTime.now(), user.getLastLoginAt()
            );
            users.put(id, updated);
            return Optional.of(updated);
        }
        return Optional.empty();
    }

    @Override
    public Optional<UserDto> deactivateUser(Long id) {
        UserDto user = users.get(id);
        if (user != null) {
            UserDto updated = new UserDto(
                user.getId(), user.getUsername(), user.getEmail(),
                user.getFirstName(), user.getLastName(),
                UserStatus.INACTIVE,
                user.getCreatedAt(), LocalDateTime.now(), user.getLastLoginAt()
            );
            users.put(id, updated);
            return Optional.of(updated);
        }
        return Optional.empty();
    }

    @Override
    public boolean isCurrentUser(Long userId) {
        // TODO: Implement with security context
        return true; // For now, allow all operations
    }
}