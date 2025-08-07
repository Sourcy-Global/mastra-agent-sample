import { describe, it, expect } from 'vitest';
import { weatherAgent } from '../index';

describe('Weather Agent', () => {
  it('should be configured with correct name', () => {
    expect(weatherAgent.name).toBe('Weather Agent');
  });

  it('should have weather tool available', () => {
    expect(weatherAgent.tools).toHaveProperty('weatherTool');
  });

  it('should have appropriate instructions', () => {
    expect(weatherAgent.instructions).toContain('weather assistant');
    expect(weatherAgent.instructions).toContain('location');
    expect(weatherAgent.instructions).toContain('weatherTool');
  });

  it('should use GPT-4o model', () => {
    expect(weatherAgent.model.modelId).toBe('gpt-4o');
  });

  describe('instruction content', () => {
    it('should mention asking for location when none provided', () => {
      expect(weatherAgent.instructions).toContain('ask for a location if none is provided');
    });

    it('should mention translation of non-English locations', () => {
      expect(weatherAgent.instructions).toContain('translate it');
    });

    it('should mention including weather details', () => {
      expect(weatherAgent.instructions).toContain('humidity');
      expect(weatherAgent.instructions).toContain('wind conditions');
      expect(weatherAgent.instructions).toContain('precipitation');
    });

    it('should emphasize concise but informative responses', () => {
      expect(weatherAgent.instructions).toContain('concise but informative');
    });
  });
});