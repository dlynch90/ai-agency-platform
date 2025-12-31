package com.enterprise.core.domain;

/**
 * User status enumeration
 */
public enum UserStatus {
    ACTIVE("Active"),
    INACTIVE("Inactive"),
    SUSPENDED("Suspended"),
    PENDING("Pending Verification");

    private final String description;

    UserStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    public boolean isActiveState() {
        return this == ACTIVE;
    }

    public boolean isInactiveState() {
        return this == INACTIVE || this == SUSPENDED;
    }
}