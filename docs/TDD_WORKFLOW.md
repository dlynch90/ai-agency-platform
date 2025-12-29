# Test-Driven Development (TDD) Workflow

## Overview
This project uses **Vitest** for unit and integration testing with a TDD approach.

## Quick Start

### Run Tests
```bash
npm test                    # Run all tests
npm test -- --coverage      # Run with coverage report
npm test -- --watch         # Watch mode for TDD
```

### TDD Cycle: Red-Green-Refactor

1. **RED**: Write a failing test first
2. **GREEN**: Write minimal code to make it pass
3. **REFACTOR**: Improve code while keeping tests green

## Test Structure

```
tests/
├── setup.ts              # Global test configuration
├── unit/                 # Unit tests (single component)
│   └── example.test.ts
├── integration/          # Integration tests (multiple components)
│   └── api.test.ts
├── e2e/                  # End-to-end tests
└── performance/          # Performance benchmarks
```

## Writing Tests

### Unit Test Example
```typescript
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Integration Test Example
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('API Integration', () => {
  beforeAll(async () => {
    // Setup test environment
  });

  afterAll(async () => {
    // Cleanup
  });

  it('should handle request correctly', async () => {
    // Test implementation
  });
});
```

## Coverage Requirements

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

## Best Practices

### ✅ DO
- Write tests before implementation (TDD)
- Keep tests simple and focused
- Use descriptive test names
- Test edge cases and errors
- Mock external dependencies
- Clean up resources in afterEach/afterAll

### ❌ DON'T
- Test implementation details
- Write tests that depend on each other
- Use setTimeout in tests
- Commit code without tests
- Mock what you don't own (use integration tests)

## Debugging Tests

```bash
# Run specific test file
npm test tests/unit/example.test.ts

# Run tests matching pattern
npm test -- --grep="Calculator"

# Debug mode
node --inspect-brk node_modules/.bin/vitest --run
```

## Continuous Integration

Tests run automatically on:
- Pre-commit (via git hooks)
- Pull requests
- Main branch commits

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [TDD Tutorial](https://www.freecodecamp.org/news/test-driven-development-tutorial-how-to-test-javascript-and-reactjs-app/)
