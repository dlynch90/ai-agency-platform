package com.enterprise.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

/**
 * Main Spring Boot Application class following enterprise patterns
 */
@SpringBootApplication(scanBasePackages = "com.enterprise")
@EnableConfigurationProperties
public class JavaEnterpriseApplication {

    public static void main(String[] args) {
        SpringApplication.run(JavaEnterpriseApplication.class, args);
    }
}