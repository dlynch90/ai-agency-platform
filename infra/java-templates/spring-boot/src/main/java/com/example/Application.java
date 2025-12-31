package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main Spring Boot Application class - Vendor: Spring Framework (Pivotal/Spring)
 *
 * This is the entry point for the Spring Boot application.
 * Spring Boot is an opinionated framework that simplifies Java application development.
 *
 * The @SpringBootApplication annotation enables:
 * - @Configuration: Tags the class as a source of bean definitions
 * - @EnableAutoConfiguration: Enables Spring Boot's auto-configuration (Vendor: Spring)
 * - @ComponentScan: Enables component scanning (Vendor: Spring Core)
 *
 * Architecture follows singleton pattern for application instance management.
 * Vendor source: https://github.com/spring-projects/spring-boot
 * Documentation: https://docs.spring.io/spring-boot/docs/current/reference/html/
 *
 * @author Spring Boot Team (Vendor: Pivotal/VMware)
 * @since 1.0.0
 * @version 3.4.1
 */
@SpringBootApplication
public class Application {

    // Application constants - vendor recommended patterns
    public static final String APPLICATION_NAME = "Spring Boot Microservice";
    public static final String APPLICATION_VERSION = "1.0.0-SNAPSHOT";
    public static final int DEFAULT_PORT = 8080;
    public static final String DEFAULT_PROFILE = "default";

    // Singleton instance for application management
    private static volatile Application instance;
    private static final Object LOCK = new Object();

    // Configuration variables
    private boolean initialized = false;
    private String activeProfile = DEFAULT_PROFILE;

    /**
     * Private constructor for singleton pattern
     */
    private Application() {
        // Initialize application state
        this.initialized = true;
    }

    /**
     * Get singleton instance of Application
     * Thread-safe lazy initialization
     *
     * @return Application singleton instance
     */
    public static Application getInstance() {
        if (instance == null) {
            synchronized (LOCK) {
                if (instance == null) {
                    instance = new Application();
                }
            }
        }
        return instance;
    }

    /**
     * Main application entry point
     *
     * @param args command line arguments
     */
    public static void main(String[] args) {
        // Get singleton instance and run application
        Application app = getInstance();

        // Log application startup
        System.out.println("Starting " + APPLICATION_NAME + " v" + APPLICATION_VERSION);

        // Run Spring Boot application
        SpringApplication.run(Application.class, args);

        System.out.println(APPLICATION_NAME + " started successfully on port " + DEFAULT_PORT);
    }

    /**
     * Get application name
     * @return application name constant
     */
    public String getApplicationName() {
        return APPLICATION_NAME;
    }

    /**
     * Get application version
     * @return application version constant
     */
    public String getApplicationVersion() {
        return APPLICATION_VERSION;
    }

    /**
     * Check if application is initialized
     * @return initialization status
     */
    public boolean isInitialized() {
        return initialized;
    }

    /**
     * Get active profile
     * @return active profile
     */
    public String getActiveProfile() {
        return activeProfile;
    }

    /**
     * Set active profile
     * @param activeProfile the profile to set
     */
    public void setActiveProfile(String activeProfile) {
        this.activeProfile = activeProfile != null ? activeProfile : DEFAULT_PROFILE;
    }
}