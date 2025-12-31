package com.enterprise.api.controller;

import com.enterprise.core.dto.UserDto;
import com.enterprise.core.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for User management operations
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "APIs for managing users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @Operation(summary = "Create a new user")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody UserDto userDto) {
        UserDto createdUser = userService.createUser(userDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    @PreAuthorize("hasRole('ADMIN') or @userService.isCurrentUser(#id)")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) {
        return userService.getUserById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @Operation(summary = "Get all users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<UserDto> users = userService.getAllUsers(page, size);
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user")
    @PreAuthorize("hasRole('ADMIN') or @userService.isCurrentUser(#id)")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @Valid @RequestBody UserDto userDto) {
        return userService.updateUser(id, userDto)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete user")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (userService.deleteUser(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/activate")
    @Operation(summary = "Activate user")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> activateUser(@PathVariable Long id) {
        return userService.activateUser(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate user")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> deactivateUser(@PathVariable Long id) {
        return userService.deactivateUser(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}