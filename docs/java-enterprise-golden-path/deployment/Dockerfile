# Multi-stage Docker build for Java Enterprise Golden Path
FROM eclipse-temurin:21-jdk-alpine AS builder

# Install Maven
ENV MAVEN_VERSION=3.9.5
RUN wget https://archive.apache.org/dist/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz \
    && tar -xzf apache-maven-${MAVEN_VERSION}-bin.tar.gz \
    && mv apache-maven-${MAVEN_VERSION} /opt/maven \
    && rm apache-maven-${MAVEN_VERSION}-bin.tar.gz

ENV PATH="/opt/maven/bin:${PATH}"

# Set working directory
WORKDIR /app

# Copy parent POM and modules
COPY pom.xml .
COPY core/pom.xml core/
COPY infrastructure/pom.xml infrastructure/
COPY config/pom.xml config/
COPY api/pom.xml api/

# Download dependencies (for better layer caching)
RUN mvn dependency:go-offline -B

# Copy source code
COPY core/src core/src/
COPY infrastructure/src infrastructure/src/
COPY config/src config/src/
COPY api/src api/src/

# Build the application
RUN mvn clean package -DskipTests -B

# Production stage
FROM eclipse-temurin:21-jre-alpine

# Install security updates and create non-root user
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser

# Set working directory
WORKDIR /app

# Copy the JAR file from builder stage
COPY --from=builder /app/api/target/*.jar app.jar

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/actuator/health || exit 1

# Expose port
EXPOSE 8080

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run the application
CMD ["java", \
     "-XX:+UseContainerSupport", \
     "-XX:MaxRAMPercentage=75.0", \
     "-XX:+UseG1GC", \
     "-XX:+UseCompressedOops", \
     "-XX:+OptimizeStringConcat", \
     "-Djava.security.egd=file:/dev/./urandom", \
     "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-production}", \
     "-jar", \
     "app.jar"]