# Java Ecosystem Development Workspace

A comprehensive monorepo for Java development with templates, tools, and best practices.

## 📋 Overview

This workspace provides:

- **Spring Boot** microservice template
- **Library** template for shared components
- **Microservice** template with Gradle
- **Webapp** template for web applications
- **Docker Compose** infrastructure setup
- **Makefile** automation for common tasks

## 🚀 Quick Start

### Prerequisites

- **Java 21** (OpenJDK or Oracle JDK)
- **Maven 3.9+** or **Gradle 8.5+**
- **Docker & Docker Compose** (for infrastructure)
- **Git** for version control

### Setup

```bash
# Clone and setup
git clone <repository-url>
cd java-ecosystem

# Setup Java environment
make java-setup

# Verify installation
java -version
mvn --version
gradle --version
```

### Creating New Projects

#### Spring Boot Microservice

```bash
make java-new-spring-boot
# Enter: Project name, Description
```

#### Microservice with Gradle

```bash
make java-new-microservice
# Enter: Project name, Description
```

## 📁 Project Structure

```
java-ecosystem/
├── java-templates/          # Project templates
│   ├── spring-boot/        # Spring Boot template
│   ├── microservice/       # Gradle microservice template
│   ├── library/           # Shared library template
│   ├── webapp/            # Web application template
│   └── docker-compose.yml # Infrastructure setup
├── java-tools/             # Development tools and utilities
├── Makefile.java           # Build automation
├── mvnw*                  # Maven wrapper
└── README.md              # This file
```

## 🛠️ Development Workflow

### Building Projects

```bash
# Build all Java projects
make java-build

# Run tests
make java-test

# Generate documentation
make java-docs

# Update dependencies
make java-update
```

### Infrastructure

```bash
# Start development infrastructure
make java-dev-env

# Build Docker images
make java-docker-build

# Run containers
make java-docker-run
```

## 🔒 Security

This workspace implements security best practices:

- **OWASP Dependency Check** for vulnerability scanning
- **Spring Security** for authentication/authorization
- **JWT tokens** for stateless authentication
- **RBAC (Role-Based Access Control)** implementation
- **Secure defaults** in application properties

### Security Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .build();
    }
}
```

## 🧪 Testing Strategy

### Test Coverage

- **Unit Tests**: Business logic testing
- **Integration Tests**: API endpoint testing
- **Security Tests**: Authentication/authorization
- **Performance Tests**: Load and stress testing

### Test Execution

```bash
# Run all tests
mvn test

# Run with coverage
mvn test jacoco:report

# Run security checks
mvn org.owasp:dependency-check-maven:check
```

## 📊 Monitoring & Observability

### Included Tools

- **Prometheus**: Metrics collection
- **Grafana**: Dashboard visualization
- **PostgreSQL**: Primary database
- **Redis**: Caching and sessions

### Starting Monitoring Stack

```bash
cd java-templates
docker-compose up -d prometheus grafana
```

Access points:

- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090

## 🚀 Deployment

### Production Readiness Checklist

- [ ] Security audit passed
- [ ] Test coverage > 80%
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] CI/CD pipeline configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented

### Containerization

```dockerfile
FROM eclipse-temurin:21-jre-alpine
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app.jar"]
```

### CI/CD Pipeline

```yaml
# GitHub Actions example
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      - run: mvn test
      - run: mvn org.owasp:dependency-check-maven:check
```

## 📚 Documentation

### API Documentation

- **Spring Boot**: http://localhost:8080/swagger-ui.html
- **Actuator**: http://localhost:8080/actuator

### Code Documentation

```bash
# Generate Javadoc
mvn javadoc:javadoc

# View coverage report
open target/site/jacoco/index.html
```

## 🤝 Contributing

### Code Standards

- **Java 21** with preview features disabled
- **Maven** for dependency management
- **Checkstyle** for code formatting
- **JaCoCo** for test coverage (>80%)

### Commit Guidelines

```
feat: add new authentication endpoint
fix: resolve memory leak in user service
docs: update API documentation
test: add integration tests for payment service
```

## 📈 Performance Optimization

### JVM Tuning

```bash
# Production JVM settings
java -server \
  -Xms2g -Xmx4g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -jar app.jar
```

### Database Optimization

- Connection pooling with HikariCP
- Query optimization and indexing
- Caching strategy with Redis

## 🔧 Troubleshooting

### Common Issues

**Maven wrapper not executable**

```bash
chmod +x mvnw mvnw.cmd
```

**Port conflicts**

```bash
# Find process using port
lsof -i :8080
# Kill process
kill -9 <PID>
```

**Database connection issues**

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Check logs
docker-compose logs postgres
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Spring Boot Team
- OWASP Community
- Testcontainers
- Docker Community

---

**Built with ❤️ using Java 21, Spring Boot 3.4.1, and modern development practices.**
