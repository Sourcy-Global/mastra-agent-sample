import { describe, it, expect } from 'vitest';

describe('Test Setup', () => {
  it('should have Vitest working correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('should support ES modules', () => {
    const module = { test: 'value' };
    expect(module.test).toBe('value');
  });

  it('should have TypeScript support', () => {
    const typedFunction = (x: number): number => x * 2;
    expect(typedFunction(5)).toBe(10);
  });
});