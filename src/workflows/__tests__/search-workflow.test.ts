import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchWorkflow } from '../search-workflow';

// Mock the search tools
vi.mock('../../tools/search-tool', () => ({
  search1688Tool: {
    execute: vi.fn(),
  },
  search1688EnglishTool: {
    execute: vi.fn(),
  },
  searchAlibabaTool: {
    execute: vi.fn(),
  },
  webSearchTool: {
    execute: vi.fn(),
  },
  shoppingSearchTool: {
    execute: vi.fn(),
  },
}));

// Mock console.stdout.write to prevent test output pollution
const mockStdoutWrite = vi.fn();
vi.stubGlobal('process', {
  ...process,
  stdout: {
    ...process.stdout,
    write: mockStdoutWrite
  }
});

describe('Search Workflow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockStdoutWrite.mockReturnValue(true);
  });

  it('should have correct id and configuration', () => {
    expect(searchWorkflow.id).toBe('search-workflow');
    expect(searchWorkflow.inputSchema).toBeDefined();
    expect(searchWorkflow.outputSchema).toBeDefined();
  });

  it('should validate input schema', () => {
    const validInput = { 
      query: 'artificial intelligence trends',
      searchType: '1688-en',
      maxResults: 10
    };
    const result = searchWorkflow.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should handle default values in input schema', () => {
    const minimalInput = { query: 'test query' };
    const result = searchWorkflow.inputSchema.safeParse(minimalInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.searchType).toBe('1688-en');
      expect(result.data.maxResults).toBe(10);
    }
  });

  it('should reject invalid input', () => {
    const invalidInput = { search: 'test' }; // wrong field name
    const result = searchWorkflow.inputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should validate searchType enum', () => {
    const invalidSearchType = { 
      query: 'test',
      searchType: 'invalid'
    };
    const result = searchWorkflow.inputSchema.safeParse(invalidSearchType);
    expect(result.success).toBe(false);
  });

  it('should validate output schema', () => {
    const validOutput = { 
      processedResults: 'Analysis of search results',
      keyInsights: ['insight 1', 'insight 2'],
      sourceCount: 5,
      searchType: '1688-en'
    };
    const result = searchWorkflow.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  describe('workflow configuration', () => {
    it('should be properly instantiated', () => {
      expect(searchWorkflow).toBeDefined();
      expect(typeof searchWorkflow).toBe('object');
    });

    it('should have workflow methods', () => {
      expect(searchWorkflow.id).toBeDefined();
      expect(searchWorkflow.inputSchema).toBeDefined();
      expect(searchWorkflow.outputSchema).toBeDefined();
    });
  });

  describe('search type validation', () => {
    const validSearchTypes = ['1688', '1688-en', 'alibaba'];
    
    validSearchTypes.forEach(searchType => {
      it(`should accept ${searchType} as valid search type`, () => {
        const input = { 
          query: 'test query',
          searchType: searchType as '1688' | '1688-en' | 'alibaba'
        };
        const result = searchWorkflow.inputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('maxResults validation', () => {
    it('should accept positive numbers for maxResults', () => {
      const input = { 
        query: 'test query',
        maxResults: 20
      };
      const result = searchWorkflow.inputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should handle maxResults as optional', () => {
      const input = { query: 'test query' };
      const result = searchWorkflow.inputSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxResults).toBe(10);
      }
    });
  });
});