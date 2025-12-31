package com.enterprise.core.entity;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Base entity with common audit fields following enterprise patterns
 */
public abstract class BaseEntity {

    protected Long id;
    protected LocalDateTime createdAt;
    protected String createdBy;
    protected LocalDateTime updatedAt;
    protected String updatedBy;
    protected Integer version;
    protected boolean deleted;

    protected BaseEntity() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.version = 0;
        this.deleted = false;
    }

    // Getters and setters with fluent interface
    public Long getId() {
        return id;
    }

    public BaseEntity setId(Long id) {
        this.id = id;
        return this;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public BaseEntity setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public BaseEntity setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
        return this;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public BaseEntity setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
        return this;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public BaseEntity setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
        return this;
    }

    public Integer getVersion() {
        return version;
    }

    public BaseEntity setVersion(Integer version) {
        this.version = version;
        return this;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public BaseEntity setDeleted(boolean deleted) {
        this.deleted = deleted;
        return this;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BaseEntity)) return false;
        BaseEntity that = (BaseEntity) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + "{" +
                "id=" + id +
                ", version=" + version +
                ", deleted=" + deleted +
                '}';
    }
}