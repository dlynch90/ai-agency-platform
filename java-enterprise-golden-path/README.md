# Java Enterprise Golden Path

A production-ready Spring Boot application following enterprise-grade patterns and best practices.

## Architecture Overview

This project implements a multi-module Spring Boot application with clean architecture principles:

```
java-enterprise-golden-path/
├── api/                    # REST API layer (controllers, security, config)
├── core/                   # Business logic and domain entities
├── infrastructure/         # Data access and external integrations
├── config/                 # Configuration classes and beans
├── deployment/             # Docker, Kubernetes, and deployment configs
├── docs/                   # Documentation and guides
└── pom.xml                # Parent POM with module management
```

## Key Features

### ✅ Enterprise Patterns Implemented

- **Multi-Module Architecture**: Separated concerns across API, Core, Infrastructure, and Config modules
- **Clean Architecture**: Domain-driven design with clear boundaries
- **Security First**: JWT authentication, role-based access control, OWASP security headers
- **Database Excellence**: PostgreSQL, Flyway migrations, connection pooling with HikariCP
- **Observability**: Micrometer metrics, OpenTelemetry tracing, structured logging
- **API Documentation**: OpenAPI/Swagger integration with SpringDoc
- **Caching Strategy**: Multi-level caching with Caffeine and Redis
- **Testing Framework**: Unit tests, integration tests, performance tests
- **Container Ready**: Docker and Kubernetes configurations

### ✅ Quality Assurance

- **Code Quality**: Checkstyle, PMD, SpotBugs integration
- **Test Coverage**: JaCoCo with minimum coverage requirements
- **Security Scanning**: OWASP Dependency Check integration
- **Build Optimization**: Parallel builds, caching, incremental compilation

### ✅ Production Readiness

- **Configuration Management**: Profile-based configuration (dev/test/prod)
- **Health Checks**: Spring Boot Actuator with custom health indicators
- **Metrics & Monitoring**: Prometheus metrics export
- **Logging**: Structured logging with logback
- **Error Handling**: Global exception handling with proper HTTP status codes

## Quick Start

### Prerequisites

- Java 21+
- Maven 3.8+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Development Setup

1. **Clone and build:**

   ```bash
   git clone <repository-url>
   cd java-enterprise-golden-path
   mvn clean install
   ```

2. **Start PostgreSQL:**

   ```bash
   docker run -d --name postgres \
     -e POSTGRES_DB=enterprise_db \
     -e POSTGRES_USER=enterprise_user \
     -e POSTGRES_PASSWORD=enterprise_password \
     -p 5432:5432 postgres:15-alpine
   ```

3. **Run the application:**

   ```bash
   cd api
   mvn spring-boot:run
   ```

4. **Access the application:**
   - API: http://localhost:8080/api
   - Swagger UI: http://localhost:8080/api/swagger-ui.html
   - Actuator: http://localhost:8080/api/actuator/health

### Docker Setup

```bash
# Build and run with Docker Compose
docker-compose -f deployment/docker-compose.yml up -d
```

## API Usage

### Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Sample API Calls

**Create User:**

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Get User:**

```bash
curl -X GET http://localhost:8080/api/users/1 \
  -H "Authorization: Bearer <token>"
```

## Development Guidelines

### Code Style

- Follow Google Java Style Guide
- Use meaningful variable and method names
- Write comprehensive JavaDoc comments
- Prefer immutability and functional programming patterns

### Testing

- Write unit tests for all business logic
- Use integration tests for API endpoints
- Maintain >85% code coverage
- Use TestContainers for database testing

### Security

- Never log sensitive information
- Use parameterized queries to prevent SQL injection
- Implement proper input validation
- Follow OWASP security guidelines

## Configuration

### Application Profiles

- `development`: Local development with debug logging
- `testing`: Test environment with TestContainers
- `production`: Production environment with optimized settings

### Environment Variables

```bash
# Database
DB_USERNAME=enterprise_user
DB_PASSWORD=enterprise_password

# JWT
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRATION=86400

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Monitoring & Observability

### Health Checks

- Database connectivity
- Disk space
- Memory usage
- Custom business health indicators

### Metrics

- HTTP request metrics
- Database query performance
- Cache hit/miss ratios
- JVM metrics

### Logging

- Structured JSON logging
- Configurable log levels
- Centralized log aggregation support

## Deployment

### Docker

```bash
# Build image
docker build -t enterprise-app:latest .

# Run container
docker run -p 8080:8080 \
  -e DB_USERNAME=... \
  -e DB_PASSWORD=... \
  enterprise-app:latest
```

### Kubernetes

```bash
# Deploy to Kubernetes
kubectl apply -f deployment/kubernetes/
```

## Contributing

1. Follow the established patterns and conventions
2. Write comprehensive tests
3. Update documentation
4. Ensure all checks pass:
   ```bash
   mvn clean verify
   ```

## License

This project implements enterprise-grade patterns and is designed for production use. See LICENSE file for details.

## Golden Path Achievements

This implementation represents a "golden path" for Java enterprise development by:

- ✅ Eliminating common anti-patterns
- ✅ Implementing proven enterprise patterns
- ✅ Providing comprehensive tooling and automation
- ✅ Ensuring production readiness from day one
- ✅ Following vendor best practices and recommendations
- ✅ Maintaining high code quality and security standards

The result is a scalable, maintainable, and secure Spring Boot application that serves as a reference implementation for enterprise Java development.
