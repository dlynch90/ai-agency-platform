package com.enterprise.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.time.Duration;

/**
 * Cache configuration with Caffeine for local caching and Redis for distributed caching
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    @Primary
    public CacheManager caffeineCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .initialCapacity(100)
            .maximumSize(1000)
            .expireAfterWrite(Duration.ofMinutes(10))
            .weakKeys()
            .recordStats());

        // Define cache names and their configurations
        cacheManager.setCacheNames(java.util.Arrays.asList(
            "users",           // User data cache
            "userDetails",     // Detailed user information
            "userPermissions", // User permissions and roles
            "applicationConfig" // Application configuration cache
        ));

        return cacheManager;
    }

    @Bean
    public Caffeine<Object, Object> userCache() {
        return Caffeine.newBuilder()
            .initialCapacity(50)
            .maximumSize(500)
            .expireAfterWrite(Duration.ofMinutes(30))
            .recordStats();
    }

    @Bean
    public Caffeine<Object, Object> userDetailsCache() {
        return Caffeine.newBuilder()
            .initialCapacity(25)
            .maximumSize(250)
            .expireAfterWrite(Duration.ofHours(1))
            .recordStats();
    }

    @Bean
    public Caffeine<Object, Object> permissionsCache() {
        return Caffeine.newBuilder()
            .initialCapacity(10)
            .maximumSize(100)
            .expireAfterWrite(Duration.ofMinutes(15))
            .recordStats();
    }

    @Bean
    public Caffeine<Object, Object> configCache() {
        return Caffeine.newBuilder()
            .initialCapacity(5)
            .maximumSize(50)
            .expireAfterWrite(Duration.ofHours(6))
            .recordStats();
    }
}