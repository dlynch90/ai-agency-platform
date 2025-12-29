package com.enterprise.infrastructure.repository;

import com.enterprise.core.domain.UserStatus;
import com.enterprise.infrastructure.entity.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * JPA Repository for User entity operations
 */
@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    // Basic queries
    Optional<UserEntity> findByUsername(String username);
    Optional<UserEntity> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    // Status-based queries
    List<UserEntity> findByStatus(UserStatus status);
    Page<UserEntity> findByStatus(UserStatus status, Pageable pageable);

    // Active users only
    @Query("SELECT u FROM UserEntity u WHERE u.deleted = false AND u.status = :status")
    List<UserEntity> findActiveUsersByStatus(@Param("status") UserStatus status);

    @Query("SELECT u FROM UserEntity u WHERE u.deleted = false")
    Page<UserEntity> findAllActiveUsers(Pageable pageable);

    // Search queries
    @Query("SELECT u FROM UserEntity u WHERE u.deleted = false AND " +
           "(LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<UserEntity> searchUsers(@Param("searchTerm") String searchTerm, Pageable pageable);

    // Audit queries
    @Query("SELECT u FROM UserEntity u WHERE u.updatedAt >= :since")
    List<UserEntity> findRecentlyUpdatedUsers(@Param("since") LocalDateTime since);

    // Bulk operations
    @Modifying
    @Query("UPDATE UserEntity u SET u.status = :status, u.updatedAt = CURRENT_TIMESTAMP, u.updatedBy = :updatedBy " +
           "WHERE u.id IN :userIds AND u.deleted = false")
    int bulkUpdateStatus(@Param("userIds") List<Long> userIds,
                        @Param("status") UserStatus status,
                        @Param("updatedBy") String updatedBy);

    @Modifying
    @Query("UPDATE UserEntity u SET u.deleted = true, u.updatedAt = CURRENT_TIMESTAMP, u.updatedBy = :updatedBy " +
           "WHERE u.id IN :userIds AND u.deleted = false")
    int bulkSoftDelete(@Param("userIds") List<Long> userIds, @Param("updatedBy") String updatedBy);

    // Statistics queries
    @Query("SELECT COUNT(u) FROM UserEntity u WHERE u.deleted = false")
    long countActiveUsers();

    @Query("SELECT COUNT(u) FROM UserEntity u WHERE u.status = :status AND u.deleted = false")
    long countUsersByStatus(@Param("status") UserStatus status);

    @Query("SELECT u.status, COUNT(u) FROM UserEntity u WHERE u.deleted = false GROUP BY u.status")
    List<Object[]> getUserStatusDistribution();
}