import { describe, it, expect } from 'vitest';
import { searchAgent } from '../search-agent';

describe('Search Agent', () => {
  it('should be configured with correct name', () => {
    expect(searchAgent.name).toBe('Search Agent');
  });

  it('should have search tools available', () => {
    expect(searchAgent.tools).toHaveProperty('webSearchTool');
    expect(searchAgent.tools).toHaveProperty('shoppingSearchTool');
  });

  it('should have appropriate instructions', () => {
    expect(searchAgent.instructions).toContain('search assistant');
    expect(searchAgent.instructions).toContain('current information');
    expect(searchAgent.instructions).toContain('web search tool');
    expect(searchAgent.instructions).toContain('shopping search tool');
  });

  it('should use GPT-4o model', () => {
    expect(searchAgent.model.modelId).toBe('gpt-4o');
  });

  describe('instruction content', () => {
    it('should mention searching for current information', () => {
      expect(searchAgent.instructions).toContain('current, up-to-date information');
    });

    it('should mention both web and shopping search capabilities', () => {
      expect(searchAgent.instructions).toContain('general information queries');
      expect(searchAgent.instructions).toContain('product or shopping queries');
    });

    it('should emphasize providing sources and links', () => {
      expect(searchAgent.instructions).toContain('relevant links and sources');
    });

    it('should mention suggesting alternative search terms', () => {
      expect(searchAgent.instructions).toContain('alternative search terms');
    });

    it('should emphasize keeping responses informative but concise', () => {
      expect(searchAgent.instructions).toContain('informative but concise');
    });
  });

  describe('search capabilities mentioned in instructions', () => {
    it('should list web search capability', () => {
      expect(searchAgent.instructions).toContain('Web search for current information');
    });

    it('should list shopping search capability', () => {
      expect(searchAgent.instructions).toContain('Shopping search for products');
    });

    it('should mention result filtering support', () => {
      expect(searchAgent.instructions).toContain('result filtering');
    });
  });
});