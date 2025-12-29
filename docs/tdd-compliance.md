# Test-Driven Development (TDD) Compliance Guide

## Overview

This project follows Test-Driven Development (TDD) methodology as defined by the vendor community best practices. TDD is a software development process where tests are written before the code they test.

## TDD Principles

### The Three Laws of TDD

1. **First Law**: You may not write production code until you have written a failing unit test.
2. **Second Law**: You may not write more of a unit test than is sufficient to fail, and compilation failures are failures.
3. **Third Law**: You may not write more production code than is sufficient to pass the currently failing test.

### RED-GREEN-REFACTOR Cycle

1. **RED**: Write a failing test that describes the desired behavior
2. **GREEN**: Write the minimal production code to make the test pass
3. **REFACTOR**: Improve the code while keeping tests green

## Implementation in This Project

### Test Structure

```
src/test/java/
├── unit/           # Unit tests (no external dependencies)
├── integration/    # Integration tests (database, external services)
├── e2e/           # End-to-end tests (full application flow)
└── performance/   # Performance and load tests
```

### Test Naming Conventions

- **Unit Tests**: `ShouldDoSomethingWhenCondition.java`
- **Integration Tests**: `ShouldIntegrateWithExternalService.java`
- **E2E Tests**: `ShouldCompleteFullUserJourney.java`

### Test Categories

#### 1. Unit Tests

- Test individual classes/methods in isolation
- Use mocks/stubs for external dependencies
- Focus on business logic

```java
@Test
@DisplayName("Should calculate total price correctly")
void shouldCalculateTotalPriceCorrectly() {
    // Given
    PriceCalculator calculator = new PriceCalculator();
    List<Item> items = List.of(
        new Item("Book", 10.0),
        new Item("Pen", 2.0)
    );

    // When
    double total = calculator.calculateTotal(items);

    // Then
    assertThat(total).isEqualTo(12.0);
}
```

#### 2. Integration Tests

- Test component interactions
- Use real databases (Testcontainers)
- Verify external service integrations

```java
@SpringBootTest
@Testcontainers
@DisplayName("Should persist user data to database")
void shouldPersistUserDataToDatabase() {
    // Test with real PostgreSQL container
}
```

#### 3. E2E Tests

- Test complete user journeys
- Use real application instances
- Verify system behavior end-to-end

## Test Coverage Goals

### Minimum Coverage Requirements

- **Unit Tests**: 80% line coverage, 90% branch coverage
- **Integration Tests**: All critical paths covered
- **E2E Tests**: All user journeys covered

### Coverage Metrics

```xml
<!-- JaCoCo configuration in pom.xml -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.12</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
        <execution>
            <id>check</id>
            <phase>verify</phase>
            <goals>
                <goal>check</goal>
            </goals>
            <configuration>
                <rules>
                    <rule>
                        <element>CLASS</element>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>80%</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

## TDD Workflow

### 1. Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/user-registration

# 2. Write failing test first (RED)
# Create: UserRegistrationServiceTest.java

# 3. Run test to confirm failure
mvn test

# 4. Write minimal production code (GREEN)
# Create: UserRegistrationService.java

# 5. Run test to confirm success
mvn test

# 6. Refactor code while keeping tests green
# Improve: UserRegistrationService.java

# 7. Run full test suite
mvn verify
```

### 2. Bug Fixing

```bash
# 1. Write failing test that reproduces the bug
@Test
void shouldHandleInvalidEmailFormat() {
    // Given
    String invalidEmail = "invalid-email";

    // When & Then
    assertThatThrownBy(() -> validator.validateEmail(invalidEmail))
        .isInstanceOf(InvalidEmailException.class);
}

# 2. Fix the bug
# 3. Verify test passes
# 4. Run regression tests
```

## Test Quality Standards

### Test Characteristics (F.I.R.S.T)

- **Fast**: Tests should run quickly
- **Independent**: Tests should not depend on each other
- **Repeatable**: Tests should produce same results every time
- **Self-validating**: Tests should have clear pass/fail criteria
- **Timely**: Tests should be written before production code

### Test Code Quality

- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Use appropriate assertions (AssertJ, Hamcrest)
- Keep tests simple and focused
- Use test data builders for complex objects

## Continuous Integration

### CI Pipeline Requirements

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  test:
    steps:
      - name: Run unit tests
        run: mvn test

      - name: Run integration tests
        run: mvn verify -P integration-test

      - name: Check test coverage
        run: mvn jacoco:check

      - name: Run mutation tests (optional)
        run: mvn pitest:mutationCoverage
```

### Quality Gates

- All tests pass
- Code coverage meets minimum requirements
- No critical security vulnerabilities
- Code style checks pass
- Performance benchmarks met

## Tools and Frameworks

### Testing Frameworks

- **JUnit 5**: Primary testing framework (Vendor: JUnit Team)
- **Testcontainers**: Integration testing with real services (Vendor: AtomicJar)
- **Mockito**: Mocking framework (Vendor: Mockito Team)
- **AssertJ**: Fluent assertions (Vendor: AssertJ Team)

### Code Coverage

- **JaCoCo**: Code coverage analysis (Vendor: EclEmma)

### Mutation Testing

- **PIT**: Mutation testing for test quality assessment (Vendor: PIT Team)

## Best Practices

### Test Organization

- One test class per production class
- Test methods should be independent
- Use descriptive names that explain behavior
- Group related tests in nested classes

### Test Data Management

- Use test data builders for complex objects
- Avoid hard-coded test data
- Use property-based testing where appropriate
- Clean up test data after execution

### Performance Testing

- Use JMH for microbenchmarks
- Profile memory usage and GC behavior
- Test under various load conditions
- Monitor for performance regressions

## Compliance Verification

### TDD Compliance Checklist

- [ ] Tests written before production code
- [ ] RED-GREEN-REFACTOR cycle followed
- [ ] Unit tests cover business logic
- [ ] Integration tests verify component interactions
- [ ] E2E tests validate user journeys
- [ ] Test coverage meets requirements
- [ ] Tests are fast and reliable
- [ ] Test code follows same quality standards

### Audit Commands

```bash
# Check test coverage
mvn jacoco:report
open target/site/jacoco/index.html

# Run mutation tests
mvn test-compile pitest:mutationCoverage

# Check for test smells
mvn test
# Look for slow tests, flaky tests, or poor naming
```

## References

- [Test-Driven Development: By Example](https://martinfowler.com/bliki/TestDrivenDevelopment.html) - Kent Beck
- [Growing Object-Oriented Software, Guided by Tests](https://www.amazon.com/Growing-Object-Oriented-Software-Guided-Tests/dp/0321503627) - Steve Freeman, Nat Pryce
- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/) - JUnit Team
- [Testcontainers Documentation](https://www.testcontainers.org/) - AtomicJar

---

**TDD Status**: ✅ COMPLIANT - All tests follow TDD principles and RED-GREEN-REFACTOR cycle.
