# TDD Example with Vitest

This document demonstrates Test-Driven Development (TDD) workflow using Vitest in this Mastra project.

## TDD Cycle (Red-Green-Refactor)

### 1. Red: Write a failing test first

```typescript
// src/utils/__tests__/temperature-converter.test.ts
import { describe, it, expect } from 'vitest';
import { celsiusToFahrenheit, fahrenheitToCelsius } from '../temperature-converter';

describe('Temperature Converter', () => {
  it('should convert Celsius to Fahrenheit', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
    expect(celsiusToFahrenheit(20)).toBe(68);
  });

  it('should convert Fahrenheit to Celsius', () => {
    expect(fahrenheitToCelsius(32)).toBe(0);
    expect(fahrenheitToCelsius(212)).toBe(100);
    expect(fahrenheitToCelsius(68)).toBe(20);
  });
});
```

### 2. Green: Write minimal code to make tests pass

```typescript
// src/utils/temperature-converter.ts
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9/5) + 32;
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return (fahrenheit - 32) * 5/9;
}
```

### 3. Refactor: Improve code while keeping tests passing

```typescript
// src/utils/temperature-converter.ts
const CELSIUS_TO_FAHRENHEIT_RATIO = 9/5;
const FAHRENHEIT_OFFSET = 32;

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * CELSIUS_TO_FAHRENHEIT_RATIO) + FAHRENHEIT_OFFSET;
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return (fahrenheit - FAHRENHEIT_OFFSET) / CELSIUS_TO_FAHRENHEIT_RATIO;
}
```

## Running TDD Workflow

1. **Start watch mode**: `pnpm test` (automatically reruns tests on file changes)
2. **Write failing test** for new feature
3. **Run tests** - they should fail (Red)
4. **Write minimal implementation** to make tests pass
5. **Run tests** - they should pass (Green)
6. **Refactor** code while keeping tests passing
7. **Repeat** for next feature

## TDD Benefits in Mastra Projects

- **Design First**: Tests help design clean APIs for tools, agents, and workflows
- **Fast Feedback**: Vitest provides instant feedback on code changes
- **Regression Prevention**: Existing tests prevent breaking changes
- **Documentation**: Tests serve as living documentation of expected behavior
- **Confidence**: Comprehensive test coverage enables safe refactoring

## Example: TDD for a new Weather Tool Feature

1. Write test for extended weather data
2. Implement minimal API integration
3. Refactor for better error handling and data transformation
4. Add tests for edge cases
5. Integrate with existing weather agent