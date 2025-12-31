import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Example Test Suite - TDD Demonstration
 * 
 * This demonstrates Test-Driven Development (TDD) approach:
 * 1. Write a failing test first (RED)
 * 2. Write minimal code to make it pass (GREEN)
 * 3. Refactor if needed (REFACTOR)
 */

describe('Example Calculator', () => {
  // TDD Step 1: Write the test first
  describe('add', () => {
    it('should add two positive numbers', () => {
      // Arrange
      const a = 5;
      const b = 3;
      
      // Act
      const result = add(a, b);
      
      // Assert
      expect(result).toBe(8);
    });

    it('should add negative numbers', () => {
      expect(add(-5, -3)).toBe(-8);
    });

    it('should handle zero', () => {
      expect(add(5, 0)).toBe(5);
      expect(add(0, 0)).toBe(0);
    });
  });

  describe('subtract', () => {
    it('should subtract two numbers', () => {
      expect(subtract(10, 3)).toBe(7);
    });
  });

  describe('multiply', () => {
    it('should multiply two numbers', () => {
      expect(multiply(4, 5)).toBe(20);
    });
  });

  describe('divide', () => {
    it('should divide two numbers', () => {
      expect(divide(10, 2)).toBe(5);
    });

    it('should throw error when dividing by zero', () => {
      expect(() => divide(10, 0)).toThrow('Cannot divide by zero');
    });
  });
});

// TDD Step 2: Implement the minimal code to make tests pass
function add(a: number, b: number): number {
  return a + b;
}

function subtract(a: number, b: number): number {
  return a - b;
}

function multiply(a: number, b: number): number {
  return a * b;
}

function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Cannot divide by zero');
  }
  return a / b;
}

// TDD Step 3: Refactor if needed (code is simple, no refactoring needed)
