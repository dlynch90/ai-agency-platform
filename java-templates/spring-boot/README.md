# {{project-name}}

{{project-description}}

## Prerequisites

- Java 21
- Maven 3.9+
- PostgreSQL (for production)

## Getting Started

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd {{project-name}}
   ```

2. **Set up the database**

   ```bash
   # Create PostgreSQL database
   createdb {{project-name}}

   # Or using Docker
   docker run --name postgres-dev -e POSTGRES_DB={{project-name}} -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:16
   ```

3. **Configure environment variables**

   ```bash
   export DB_USERNAME=postgres
   export DB_PASSWORD=password
   ```

4. **Run the application**
   ```bash
   ./mvnw spring-boot:run
   ```

The application will be available at `http://localhost:8080`

### Running Tests

```bash
# Run unit tests
./mvnw test

# Run with coverage report
./mvnw test jacoco:report

# Run integration tests
./mvnw verify
```

### Building for Production

```bash
# Create JAR file
./mvnw clean package

# Run the JAR
java -jar target/{{project-name}}-1.0.0-SNAPSHOT.jar
```

## Project Structure

```
src/
├── main/
│   ├── java/com/example/
│   │   ├── Application.java          # Main application class
│   │   └── ...                       # Application code
│   └── resources/
│       ├── application.properties    # Application configuration
│       └── ...                       # Static resources
└── test/
    ├── java/com/example/
    │   └── ApplicationTests.java     # Application tests
    └── resources/
        └── application-test.properties # Test configuration
```

## Configuration

The application uses the following configuration properties:

- `server.port`: Server port (default: 8080)
- `spring.datasource.*`: Database configuration
- `spring.jpa.*`: JPA/Hibernate configuration
- `logging.level.*`: Logging levels

## API Documentation

Once the application is running, API documentation is available at:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- API Docs: `http://localhost:8080/v3/api-docs`

## Monitoring

Application health and metrics are available at:

- Health: `http://localhost:8080/actuator/health`
- Info: `http://localhost:8080/actuator/info`
- Metrics: `http://localhost:8080/actuator/metrics`

## Contributing

1. Create a feature branch
2. Write tests for new functionality
3. Ensure all tests pass
4. Submit a pull request

## License

This project is licensed under the MIT License.
