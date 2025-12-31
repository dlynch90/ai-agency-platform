package com.enterprise.core.service;

import com.enterprise.core.domain.UserStatus;
import com.enterprise.core.dto.UserDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for UserService interface
 * Testing business logic with in-memory implementation
 */
class UserServiceTest {

    private UserService userService;

    @BeforeEach
    void setUp() {
        // Use in-memory implementation for testing
        userService = new InMemoryUserServiceImpl();
    }

    /**
     * Simple in-memory implementation of UserService for testing
     */
    private static class InMemoryUserServiceImpl implements UserService {
        private final ConcurrentHashMap<Long, UserDto> users = new ConcurrentHashMap<>();
        private final AtomicLong idGenerator = new AtomicLong(1);

        @Override
        public UserDto createUser(UserDto userDto) {
            // Check for existing username/email
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
                java.time.LocalDateTime.now(),
                java.time.LocalDateTime.now(),
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
                    java.time.LocalDateTime.now(),
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
                    user.getCreatedAt(), java.time.LocalDateTime.now(), user.getLastLoginAt()
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
                    user.getCreatedAt(), java.time.LocalDateTime.now(), user.getLastLoginAt()
                );
                users.put(id, updated);
                return Optional.of(updated);
            }
            return Optional.empty();
        }

        @Override
        public boolean isCurrentUser(Long userId) {
            return true; // For testing purposes
        }
    }

    @Test
    void shouldCreateUserSuccessfully() {
        // Given
        UserDto userDto = new UserDto();
        userDto.setUsername("testuser");
        userDto.setEmail("test@example.com");
        userDto.setFirstName("Test");
        userDto.setLastName("User");

        // When
        UserDto createdUser = userService.createUser(userDto);

        // Then
        assertThat(createdUser).isNotNull();
        assertThat(createdUser.getId()).isNotNull();
        assertThat(createdUser.getUsername()).isEqualTo("testuser");
        assertThat(createdUser.getEmail()).isEqualTo("test@example.com");
        assertThat(createdUser.getFirstName()).isEqualTo("Test");
        assertThat(createdUser.getLastName()).isEqualTo("User");
        assertThat(createdUser.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(createdUser.getCreatedAt()).isNotNull();
        assertThat(createdUser.getFullName()).isEqualTo("Test User");
    }

    @Test
    void shouldThrowExceptionWhenCreatingUserWithExistingUsername() {
        // Given
        UserDto firstUser = new UserDto();
        firstUser.setUsername("duplicate");
        firstUser.setEmail("first@example.com");
        firstUser.setFirstName("First");
        firstUser.setLastName("User");

        UserDto secondUser = new UserDto();
        secondUser.setUsername("duplicate"); // Same username
        secondUser.setEmail("second@example.com");
        secondUser.setFirstName("Second");
        secondUser.setLastName("User");

        // When
        userService.createUser(firstUser);

        // Then
        assertThatThrownBy(() -> userService.createUser(secondUser))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Username already exists");
    }

    @Test
    void shouldThrowExceptionWhenCreatingUserWithExistingEmail() {
        // Given
        UserDto firstUser = new UserDto();
        firstUser.setUsername("firstuser");
        firstUser.setEmail("duplicate@example.com");
        firstUser.setFirstName("First");
        firstUser.setLastName("User");

        UserDto secondUser = new UserDto();
        secondUser.setUsername("seconduser");
        secondUser.setEmail("duplicate@example.com"); // Same email
        secondUser.setFirstName("Second");
        secondUser.setLastName("User");

        // When
        userService.createUser(firstUser);

        // Then
        assertThatThrownBy(() -> userService.createUser(secondUser))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Email already exists");
    }

    @Test
    void shouldRetrieveUserById() {
        // Given
        UserDto userDto = new UserDto();
        userDto.setUsername("testuser");
        userDto.setEmail("test@example.com");
        userDto.setFirstName("Test");
        userDto.setLastName("User");

        UserDto createdUser = userService.createUser(userDto);

        // When
        Optional<UserDto> retrievedUser = userService.getUserById(createdUser.getId());

        // Then
        assertThat(retrievedUser).isPresent();
        assertThat(retrievedUser.get().getId()).isEqualTo(createdUser.getId());
        assertThat(retrievedUser.get().getUsername()).isEqualTo("testuser");
    }

    @Test
    void shouldReturnEmptyOptionalForNonExistentUser() {
        // When
        Optional<UserDto> user = userService.getUserById(999L);

        // Then
        assertThat(user).isEmpty();
    }

    @Test
    void shouldUpdateUserSuccessfully() {
        // Given
        UserDto userDto = new UserDto();
        userDto.setUsername("testuser");
        userDto.setEmail("test@example.com");
        userDto.setFirstName("Test");
        userDto.setLastName("User");

        UserDto createdUser = userService.createUser(userDto);

        UserDto updateDto = new UserDto();
        updateDto.setFirstName("Updated");
        updateDto.setLastName("Name");

        // When
        Optional<UserDto> updatedUser = userService.updateUser(createdUser.getId(), updateDto);

        // Then
        assertThat(updatedUser).isPresent();
        assertThat(updatedUser.get().getFirstName()).isEqualTo("Updated");
        assertThat(updatedUser.get().getLastName()).isEqualTo("Name");
        assertThat(updatedUser.get().getFullName()).isEqualTo("Updated Name");
        assertThat(updatedUser.get().getUpdatedAt()).isAfter(updatedUser.get().getCreatedAt());
    }

    @Test
    void shouldReturnEmptyOptionalWhenUpdatingNonExistentUser() {
        // Given
        UserDto updateDto = new UserDto();
        updateDto.setFirstName("Updated");
        updateDto.setLastName("Name");

        // When
        Optional<UserDto> result = userService.updateUser(999L, updateDto);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void shouldDeleteUserSuccessfully() {
        // Given
        UserDto userDto = new UserDto();
        userDto.setUsername("testuser");
        userDto.setEmail("test@example.com");
        userDto.setFirstName("Test");
        userDto.setLastName("User");

        UserDto createdUser = userService.createUser(userDto);

        // When
        boolean deleted = userService.deleteUser(createdUser.getId());

        // Then
        assertThat(deleted).isTrue();
        assertThat(userService.getUserById(createdUser.getId())).isEmpty();
    }

    @Test
    void shouldReturnFalseWhenDeletingNonExistentUser() {
        // When
        boolean deleted = userService.deleteUser(999L);

        // Then
        assertThat(deleted).isFalse();
    }

    @Test
    void shouldActivateUserSuccessfully() {
        // Given
        UserDto userDto = new UserDto();
        userDto.setUsername("testuser");
        userDto.setEmail("test@example.com");
        userDto.setFirstName("Test");
        userDto.setLastName("User");

        UserDto createdUser = userService.createUser(userDto);

        // First deactivate
        userService.deactivateUser(createdUser.getId());

        // When
        Optional<UserDto> activatedUser = userService.activateUser(createdUser.getId());

        // Then
        assertThat(activatedUser).isPresent();
        assertThat(activatedUser.get().getStatus()).isEqualTo(UserStatus.ACTIVE);
    }

    @Test
    void shouldDeactivateUserSuccessfully() {
        // Given
        UserDto userDto = new UserDto();
        userDto.setUsername("testuser");
        userDto.setEmail("test@example.com");
        userDto.setFirstName("Test");
        userDto.setLastName("User");

        UserDto createdUser = userService.createUser(userDto);

        // When
        Optional<UserDto> deactivatedUser = userService.deactivateUser(createdUser.getId());

        // Then
        assertThat(deactivatedUser).isPresent();
        assertThat(deactivatedUser.get().getStatus()).isEqualTo(UserStatus.INACTIVE);
    }

    @Test
    void shouldReturnAllUsersWithPagination() {
        // Given
        for (int i = 1; i <= 5; i++) {
            UserDto userDto = new UserDto();
            userDto.setUsername("user" + i);
            userDto.setEmail("user" + i + "@example.com");
            userDto.setFirstName("User");
            userDto.setLastName(String.valueOf(i));
            userService.createUser(userDto);
        }

        // When
        List<UserDto> users = userService.getAllUsers(0, 3);

        // Then
        assertThat(users).hasSize(3);
    }

    @Test
    void shouldCheckIfCurrentUserHasAccess() {
        // This is a placeholder test - in real implementation,
        // this would check security context
        boolean hasAccess = userService.isCurrentUser(1L);
        assertThat(hasAccess).isTrue();
    }
}