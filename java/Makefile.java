# Java Development Makefile
# Global targets for Java development across the workspace

.PHONY: java-setup java-test java-build java-clean java-docs java-deps java-update

# Setup Java environment
java-setup:
	@echo "🔧 Setting up Java environment..."
	@./java-workspace-setup.sh

# Run tests for all Java projects
java-test:
	@echo "🧪 Running Java tests..."
	@find . -name "pom.xml" -exec dirname {} \; | while read dir; do \
		echo "Testing $$dir..."; \
		(cd "$$dir" && mvn test -q) || exit 1; \
	done
	@find . -name "build.gradle" -exec dirname {} \; | while read dir; do \
		echo "Testing $$dir..."; \
		(cd "$$dir" && ./gradlew test --quiet) || exit 1; \
	done

# Build all Java projects
java-build:
	@echo "🔨 Building Java projects..."
	@find . -name "pom.xml" -exec dirname {} \; | while read dir; do \
		echo "Building $$dir..."; \
		(cd "$$dir" && mvn package -q -DskipTests) || exit 1; \
	done
	@find . -name "build.gradle" -exec dirname {} \; | while read dir; do \
		echo "Building $$dir..."; \
		(cd "$$dir" && ./gradlew build --quiet -x test) || exit 1; \
	done

# Clean all Java projects
java-clean:
	@echo "🧹 Cleaning Java projects..."
	@find . -name "pom.xml" -exec dirname {} \; | while read dir; do \
		echo "Cleaning $$dir..."; \
		(cd "$$dir" && mvn clean -q); \
	done
	@find . -name "build.gradle" -exec dirname {} \; | while read dir; do \
		echo "Cleaning $$dir..."; \
		(cd "$$dir" && ./gradlew clean --quiet); \
	done

# Generate documentation
java-docs:
	@echo "📚 Generating Java documentation..."
	@find . -name "pom.xml" -exec dirname {} \; | while read dir; do \
		echo "Generating docs for $$dir..."; \
		(cd "$$dir" && mvn javadoc:javadoc -q); \
	done
	@find . -name "build.gradle" -exec dirname {} \; | while read dir; do \
		echo "Generating docs for $$dir..."; \
		(cd "$$dir" && ./gradlew javadoc --quiet); \
	done

# Update dependencies
java-update:
	@echo "📦 Updating Java dependencies..."
	@find . -name "pom.xml" -exec dirname {} \; | while read dir; do \
		echo "Updating $$dir..."; \
		(cd "$$dir" && mvn versions:use-latest-releases -q); \
	done
	@find . -name "build.gradle" -exec dirname {} \; | while read dir; do \
		echo "Updating $$dir..."; \
		(cd "$$dir" && ./gradlew dependencyUpdates --quiet); \
	done

# Check for dependency vulnerabilities
java-security:
	@echo "🔒 Checking Java dependencies for vulnerabilities..."
	@find . -name "pom.xml" -exec dirname {} \; | while read dir; do \
		echo "Checking $$dir..."; \
		(cd "$$dir" && mvn org.owasp:dependency-check-maven:check -q) || echo "OWASP check failed for $$dir"; \
	done

# Run code quality checks
java-quality:
	@echo "🎯 Running Java code quality checks..."
	@find . -name "pom.xml" -exec dirname {} \; | while read dir; do \
		if [ -f "$$dir/pom.xml" ]; then \
			(cd "$$dir" && mvn checkstyle:check pmd:check spotbugs:check -q) || echo "Quality check failed for $$dir"; \
		fi; \
	done

# Create new Java project from template
java-new-spring-boot:
	@echo "🚀 Creating new Spring Boot project..."
	@read -p "Project name: " name; \
	read -p "Description: " desc; \
	cp -r java-templates/spring-boot "$$name"; \
	find "$$name" -type f -name "*.java" -o -name "*.properties" -o -name "*.xml" -o -name "*.md" | while read file; do \
		sed -i.bak "s/{{project-name}}/$$name/g; s/{{project-description}}/$$desc/g" "$$file" && rm "$$file.bak"; \
	done; \
	echo "✅ Spring Boot project '$$name' created!"

java-new-microservice:
	@echo "🚀 Creating new microservice project..."
	@read -p "Project name: " name; \
	read -p "Description: " desc; \
	cp -r java-templates/microservice "$$name"; \
	find "$$name" -type f -name "*.gradle" -o -name "*.properties" -o -name "*.md" | while read file; do \
		sed -i.bak "s/{{project-name}}/$$name/g; s/{{project-description}}/$$desc/g" "$$file" && rm "$$file.bak"; \
	done; \
	echo "✅ Microservice project '$$name' created!"

# Docker operations
java-docker-build:
	@echo "🐳 Building Java Docker images..."
	@find . -name "Dockerfile" -exec dirname {} \; | while read dir; do \
		echo "Building Docker image for $$dir..."; \
		(cd "$$dir" && docker build -t "$$(basename "$$dir")" .); \
	done

java-docker-run:
	@echo "🐳 Running Java Docker containers..."
	@find . -name "docker-compose.yml" -exec dirname {} \; | while read dir; do \
		echo "Starting services for $$dir..."; \
		(cd "$$dir" && docker-compose up -d); \
	done

# Development environment
java-dev-env:
	@echo "🛠️  Setting up Java development environment..."
	@./java-workspace-setup.sh
	@if [ -f "docker-compose.yml" ]; then \
		echo "Starting development services..."; \
		docker-compose up -d; \
	fi

# Help target
java-help:
	@echo "Java Development Makefile Targets:"
	@echo "  java-setup          - Setup Java environment"
	@echo "  java-test          - Run tests for all Java projects"
	@echo "  java-build         - Build all Java projects"
	@echo "  java-clean         - Clean all Java projects"
	@echo "  java-docs          - Generate documentation"
	@echo "  java-update        - Update dependencies"
	@echo "  java-security      - Check for vulnerabilities"
	@echo "  java-quality       - Run code quality checks"
	@echo "  java-new-spring-boot  - Create new Spring Boot project"
	@echo "  java-new-microservice - Create new microservice project"
	@echo "  java-docker-build  - Build Docker images"
	@echo "  java-docker-run    - Run Docker containers"
	@echo "  java-dev-env       - Setup development environment"