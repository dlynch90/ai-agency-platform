import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Global test setup for TDD
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

// Mock 1Password SDK for testing
global.mockOnePasswordSDK = {
  getSecret: vi.fn().mockResolvedValue('test-secret'),
  createItem: vi.fn().mockResolvedValue({ id: 'test-id' }),
  updateItem: vi.fn().mockResolvedValue({ id: 'test-id' })
}

// Mock LangChain components for testing
global.mockLangChain = {
  OpenAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn().mockResolvedValue('Mock AI response')
  })),
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn().mockResolvedValue('Mock chat response')
  }))
}

// Mock 1Password SDK for testing
global.mockOnePasswordSDK = {
  getSecret: vi.fn().mockResolvedValue('test-secret'),
  createItem: vi.fn().mockResolvedValue({ id: 'test-id' }),
  updateItem: vi.fn().mockResolvedValue({ id: 'test-id' })
}

// Mock LangChain components for testing
global.mockLangChain = {
  OpenAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn().mockResolvedValue('Mock AI response')
  })),
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn().mockResolvedValue('Mock chat response')
  }))
}