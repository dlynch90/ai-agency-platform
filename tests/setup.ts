import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Global test setup
beforeAll(async () => {
  // Initialize test environment
  console.log('🧪 Initializing test environment...');
  
  // Load test environment variables
  process.env.NODE_ENV = 'test';
  
  // Initialize any global test resources
});

afterAll(async () => {
  // Clean up test environment
  console.log('🧹 Cleaning up test environment...');
  
  // Close database connections, cleanup resources, etc.
});

beforeEach(() => {
  // Reset mocks before each test
});

afterEach(() => {
  // Cleanup after each test
});

// Make test utilities available globally
export {};
