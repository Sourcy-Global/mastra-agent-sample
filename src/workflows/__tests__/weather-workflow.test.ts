import { describe, it, expect, vi, beforeEach } from 'vitest';
import { weatherWorkflow } from '../index';

// Mock fetch globally
global.fetch = vi.fn();

// Mock console.stdout.write to prevent test output pollution
const mockStdoutWrite = vi.fn();
vi.stubGlobal('process', {
  ...process,
  stdout: {
    ...process.stdout,
    write: mockStdoutWrite
  }
});

describe('Weather Workflow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockStdoutWrite.mockReturnValue(true);
  });

  it('should have correct id and configuration', () => {
    expect(weatherWorkflow.id).toBe('weather-workflow');
    expect(weatherWorkflow.inputSchema).toBeDefined();
    expect(weatherWorkflow.outputSchema).toBeDefined();
  });

  it('should validate input schema', () => {
    const validInput = { city: 'New York' };
    const result = weatherWorkflow.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject invalid input', () => {
    const invalidInput = { location: 'New York' }; // wrong field name
    const result = weatherWorkflow.inputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should validate output schema', () => {
    const validOutput = { activities: 'Some activity recommendations' };
    const result = weatherWorkflow.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  describe('workflow configuration', () => {
    it('should be properly instantiated', () => {
      expect(weatherWorkflow).toBeDefined();
      expect(typeof weatherWorkflow).toBe('object');
    });

    it('should have workflow methods', () => {
      // Test that workflow has expected structure without accessing internal implementation
      expect(weatherWorkflow.id).toBeDefined();
      expect(weatherWorkflow.inputSchema).toBeDefined();
      expect(weatherWorkflow.outputSchema).toBeDefined();
    });
  });

  // Note: Full integration tests would require mocking the OpenAI API
  // and would be more complex. These tests focus on configuration and structure.
});