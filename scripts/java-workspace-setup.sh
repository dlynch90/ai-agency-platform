#!/bin/bash

# Java Workspace Setup Script
# This script configures the Java development environment for the workspace

set -e

echo "🔧 Setting up Java workspace environment..."

# Source Java configuration
if [ -f ".java-config" ]; then
    echo "📋 Loading Java configuration..."
    source .java-config
else
    echo "⚠️  Warning: .java-config not found, using defaults"
fi

# Set Java environment
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home}"
export PATH="$JAVA_HOME/bin:$PATH"

# Verify Java installation
if ! java -version &>/dev/null; then
    echo "❌ Java is not properly installed or configured"
    exit 1
fi

echo "✅ Java $(java -version 2>&1 | head -n 1 | cut -d'"' -f2) is available"

# Set Maven/Gradle environment
export MAVEN_OPTS="${MAVEN_OPTS:--Xmx1024m -XX:MaxPermSize=256m}"
export GRADLE_OPTS="${GRADLE_OPTS:--Xmx1024m}"

# Configure IDE settings
setup_vscode_java() {
    if [ -d ".vscode" ]; then
        echo "🔧 Configuring VS Code Java settings..."

        # Create or update settings.json
        mkdir -p .vscode
        cat > .vscode/settings.json << EOF
{
    "java.configuration.updateBuildConfiguration": "automatic",
    "java.server.launchMode": "Standard",
    "java.compile.nullAnalysis.mode": "automatic",
    "java.format.settings.url": "https://raw.githubusercontent.com/google/styleguide/gh-pages/eclipse-java-google-style.xml",
    "java.format.settings.profile": "GoogleStyle",
    "java.saveActions.organizeImports": true,
    "maven.executable.path": "$(which mvn 2>/dev/null || echo 'mvn')",
    "gradle.wrapper.executable": "./gradlew"
}
EOF
    fi
}

setup_intellij_java() {
    if [ -f "*.iml" ] || [ -d ".idea" ]; then
        echo "🔧 IntelliJ project detected, Java configuration should be automatic"
    fi
}

# Setup based on detected tools
if command -v code &>/dev/null; then
    setup_vscode_java
fi

if [ -d ".idea" ]; then
    setup_intellij_java
fi

# Create Maven wrapper if pom.xml exists
if [ -f "pom.xml" ] && [ ! -f "mvnw" ]; then
    echo "📦 Setting up Maven wrapper..."
    mvn wrapper:wrapper -Dmaven="$(mvn --version | head -1 | cut -d' ' -f3)" || true
fi

# Create Gradle wrapper if build.gradle exists
if [ -f "build.gradle" ] && [ ! -f "gradlew" ]; then
    echo "📦 Setting up Gradle wrapper..."
    gradle wrapper --gradle-version="${GRADLE_VERSION:-8.5}" || true
fi

# Set up pre-commit hooks for Java projects
setup_java_hooks() {
    if [ -d ".git" ] && [ -f "pom.xml" ] || [ -f "build.gradle" ]; then
        echo "🔗 Setting up Java-specific git hooks..."

        mkdir -p .git/hooks

        # Pre-commit hook for Java
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "🔍 Running Java pre-commit checks..."

# Run tests
if [ -f "pom.xml" ]; then
    echo "Running Maven tests..."
    mvn test -q || exit 1
elif [ -f "build.gradle" ]; then
    echo "Running Gradle tests..."
    ./gradlew test --quiet || exit 1
fi

# Check code style
if command -v checkstyle &>/dev/null && [ -f "checkstyle.xml" ]; then
    echo "Running Checkstyle..."
    checkstyle -c checkstyle.xml "src/main/java/**/*.java" || exit 1
fi

echo "✅ All Java checks passed!"
EOF

        chmod +x .git/hooks/pre-commit
    fi
}

setup_java_hooks

echo "🎉 Java workspace setup complete!"
echo ""
echo "📋 Available commands:"
echo "  java -version          # Check Java version"
echo "  mvn --version         # Check Maven version"
echo "  gradle --version      # Check Gradle version"
echo "  ./mvnw spring-boot:run # Run Spring Boot app (if applicable)"
echo ""
echo "🔧 Environment variables set:"
echo "  JAVA_HOME: $JAVA_HOME"
echo "  MAVEN_OPTS: $MAVEN_OPTS"
echo "  GRADLE_OPTS: $GRADLE_OPTS"