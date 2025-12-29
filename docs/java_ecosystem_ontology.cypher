// Java Ecosystem Ontology for Dependency Mapping
// This file defines the knowledge graph structure for Java components and their relationships

// Node Labels:
// - JavaComponent: Core Java technologies and tools
// - RuntimeManager: Version management tools (SDKMAN, jenv, etc.)
// - BuildTool: Build and dependency management (Maven, Gradle)
// - Framework: Development frameworks (Spring, Hibernate, etc.)
// - Library: Supporting libraries and utilities
// - IDE: Development environments
// - Database: Database connectivity and ORM tools

// Relationship Types:
// - DEPENDS_ON: Direct dependency relationship
// - COMPATIBLE_WITH: Version compatibility
// - BUILT_WITH: Build tool relationship
// - USES_FRAMEWORK: Framework usage
// - INTEGRATES_WITH: Integration relationships
// - REQUIRES: Mandatory requirements

// Core Java Runtimes
CREATE (java8:JavaComponent {name: 'Java 8', version: '8', type: 'runtime', vendor: 'Oracle/OpenJDK', status: 'LTS'})
CREATE (java11:JavaComponent {name: 'Java 11', version: '11', type: 'runtime', vendor: 'Oracle/OpenJDK', status: 'LTS'})
CREATE (java17:JavaComponent {name: 'Java 17', version: '17', type: 'runtime', vendor: 'Oracle/OpenJDK', status: 'LTS'})
CREATE (java21:JavaComponent {name: 'Java 21', version: '21', type: 'runtime', vendor: 'Oracle/OpenJDK', status: 'LTS'})

// Runtime Managers
CREATE (sdkman:RuntimeManager {name: 'SDKMAN', version: '5.20.0', type: 'version_manager', platform: 'cross-platform'})
CREATE (jenv:RuntimeManager {name: 'jenv', version: '0.5.2', type: 'version_manager', platform: 'macOS/Linux'})
CREATE (jabba:RuntimeManager {name: 'Jabba', version: '0.11.2', type: 'version_manager', platform: 'cross-platform'})

// Build Tools
CREATE (maven:BuildTool {name: 'Maven', version: '3.9.12', type: 'build_tool', language: 'XML'})
CREATE (gradle:BuildTool {name: 'Gradle', version: '9.2.1', type: 'build_tool', language: 'Groovy/Kotlin'})

// Frameworks
CREATE (spring:Framework {name: 'Spring Framework', version: '6.0', type: 'application_framework', category: 'enterprise'})
CREATE (spring_boot:Framework {name: 'Spring Boot', version: '3.4.1', type: 'application_framework', category: 'microservices'})
CREATE (hibernate:Framework {name: 'Hibernate', version: '6.0', type: 'orm', category: 'data'})
CREATE (quarkus:Framework {name: 'Quarkus', version: '3.0', type: 'application_framework', category: 'cloud-native'})

// Libraries
CREATE (junit:Library {name: 'JUnit', version: '5.10', type: 'testing', category: 'unit_testing'})
CREATE (mockito:Library {name: 'Mockito', version: '5.0', type: 'testing', category: 'mocking'})
CREATE (slf4j:Library {name: 'SLF4J', version: '2.0', type: 'logging', category: 'facade'})
CREATE (logback:Library {name: 'Logback', version: '1.4', type: 'logging', category: 'implementation'})

// IDEs
CREATE (intellij:IDE {name: 'IntelliJ IDEA', version: '2024.1', type: 'ide', vendor: 'JetBrains'})
CREATE (eclipse:IDE {name: 'Eclipse', version: '2024-03', type: 'ide', vendor: 'Eclipse Foundation'})
CREATE (vscode:IDE {name: 'VS Code', version: '1.90', type: 'editor', vendor: 'Microsoft'})

// Databases & ORMs
CREATE (postgresql:Database {name: 'PostgreSQL', version: '16', type: 'relational', category: 'sql'})
CREATE (mongodb:Database {name: 'MongoDB', version: '7.0', type: 'document', category: 'nosql'})
CREATE (mysql:Database {name: 'MySQL', version: '8.0', type: 'relational', category: 'sql'})

// Relationships - Runtime Dependencies
CREATE (maven)-[:REQUIRES]->(java8)
CREATE (gradle)-[:REQUIRES]->(java8)
CREATE (spring_boot)-[:REQUIRES]->(java17)
CREATE (quarkus)-[:REQUIRES]->(java17)

// Framework Dependencies
CREATE (spring_boot)-[:EXTENDS]->(spring)
CREATE (spring_boot)-[:USES_FRAMEWORK]->(spring)

// Build Tool Relationships
CREATE (spring_boot)-[:BUILT_WITH]->(maven)
CREATE (spring_boot)-[:BUILT_WITH]->(gradle)

// Testing Dependencies
CREATE (spring_boot)-[:USES_LIBRARY {scope: 'test'}]->(junit)
CREATE (spring_boot)-[:USES_LIBRARY {scope: 'test'}]->(mockito)

// Logging Dependencies
CREATE (spring_boot)-[:USES_LIBRARY {scope: 'runtime'}]->(slf4j)
CREATE (spring_boot)-[:USES_LIBRARY {scope: 'runtime'}]->(logback)

// Database Integration
CREATE (hibernate)-[:CONNECTS_TO]->(postgresql)
CREATE (hibernate)-[:CONNECTS_TO]->(mysql)
CREATE (spring)-[:INTEGRATES_WITH]->(hibernate)

// IDE Support
CREATE (intellij)-[:SUPPORTS]->(java21)
CREATE (intellij)-[:SUPPORTS]->(spring_boot)
CREATE (intellij)-[:SUPPORTS]->(gradle)
CREATE (vscode)-[:SUPPORTS {via: 'Extension'}]->(java21)
CREATE (vscode)-[:SUPPORTS {via: 'Extension'}]->(spring_boot)

// Version Manager Capabilities
CREATE (sdkman)-[:MANAGES]->(java8)
CREATE (sdkman)-[:MANAGES]->(java11)
CREATE (sdkman)-[:MANAGES]->(java17)
CREATE (sdkman)-[:MANAGES]->(java21)
CREATE (sdkman)-[:MANAGES]->(maven)
CREATE (sdkman)-[:MANAGES]->(gradle)
CREATE (sdkman)-[:MANAGES]->(spring_boot)

// Compatibility Matrix
CREATE (java17)-[:COMPATIBLE_WITH]->(maven)
CREATE (java21)-[:COMPATIBLE_WITH]->(gradle)
CREATE (java21)-[:COMPATIBLE_WITH]->(spring_boot)
CREATE (java17)-[:COMPATIBLE_WITH]->(quarkus)

// Ecosystem Categories
CREATE (java_ecosystem:Category {name: 'Java Ecosystem', type: 'meta'})
CREATE (build_tools:Category {name: 'Build Tools', type: 'category'})
CREATE (frameworks:Category {name: 'Frameworks', type: 'category'})
CREATE (libraries:Category {name: 'Libraries', type: 'category'})
CREATE (ides:Category {name: 'IDEs', type: 'category'})

// Category Relationships
CREATE (java_ecosystem)-[:CONTAINS]->(build_tools)
CREATE (java_ecosystem)-[:CONTAINS]->(frameworks)
CREATE (java_ecosystem)-[:CONTAINS]->(libraries)
CREATE (java_ecosystem)-[:CONTAINS]->(ides)

CREATE (build_tools)-[:CONTAINS]->(maven)
CREATE (build_tools)-[:CONTAINS]->(gradle)
CREATE (frameworks)-[:CONTAINS]->(spring)
CREATE (frameworks)-[:CONTAINS]->(spring_boot)
CREATE (frameworks)-[:CONTAINS]->(hibernate)
CREATE (frameworks)-[:CONTAINS]->(quarkus)
CREATE (libraries)-[:CONTAINS]->(junit)
CREATE (libraries)-[:CONTAINS]->(mockito)
CREATE (libraries)-[:CONTAINS]->(slf4j)
CREATE (libraries)-[:CONTAINS]->(logback)
CREATE (ides)-[:CONTAINS]->(intellij)
CREATE (ides)-[:CONTAINS]->(eclipse)
CREATE (ides)-[:CONTAINS]->(vscode)

// Metadata and Properties
CREATE (java_ecosystem)-[:HAS_PROPERTY {key: 'current_lts', value: '21'}]->(java21)
CREATE (java_ecosystem)-[:HAS_PROPERTY {key: 'recommended_java', value: '21'}]->(java21)
CREATE (java_ecosystem)-[:HAS_PROPERTY {key: 'recommended_build_tool', value: 'gradle'}]->(gradle)
CREATE (java_ecosystem)-[:HAS_PROPERTY {key: 'recommended_framework', value: 'spring_boot'}]->(spring_boot)

// Query Indexes for Performance
CREATE INDEX java_component_name_idx FOR (n:JavaComponent) ON (n.name)
CREATE INDEX framework_name_idx FOR (n:Framework) ON (n.name)
CREATE INDEX library_name_idx FOR (n:Library) ON (n.name)