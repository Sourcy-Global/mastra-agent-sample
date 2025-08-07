import { describe, it, expect, vi, beforeEach } from 'vitest';
import { webSearchTool, shoppingSearchTool } from '../search-tool';

// Mock the serperAPI module
vi.mock('../../api/serper', () => ({
  serperAPI: {
    searchQuery: vi.fn(),
    getFormattedResults: vi.fn(),
    getFormattedShoppingResults: vi.fn(),
  }
}));

describe('Search Tools', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('webSearchTool configuration', () => {
    it('should have correct id and description', () => {
      expect(webSearchTool.id).toBe('web-search');
      expect(webSearchTool.description).toBe('Perform web search to find current information on any topic');
    });

    it('should validate input schema', () => {
      const validInput = { query: 'artificial intelligence', maxResults: 5 };
      const result = webSearchTool.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid input', () => {
      const invalidInput = { search: 'AI' }; // wrong field name
      const result = webSearchTool.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should handle default maxResults', () => {
      const inputWithoutMax = { query: 'test query' };
      const result = webSearchTool.inputSchema.safeParse(inputWithoutMax);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxResults).toBe(10);
      }
    });
  });

  describe('shoppingSearchTool configuration', () => {
    it('should have correct id and description', () => {
      expect(shoppingSearchTool.id).toBe('shopping-search');
      expect(shoppingSearchTool.description).toBe('Search for products and shopping information');
    });

    it('should validate input schema', () => {
      const validInput = { query: 'iPhone 15', maxResults: 20 };
      const result = shoppingSearchTool.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should handle default maxResults', () => {
      const inputWithoutMax = { query: 'laptop' };
      const result = shoppingSearchTool.inputSchema.safeParse(inputWithoutMax);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxResults).toBe(20);
      }
    });
  });

  describe('web search functionality', () => {
    it('should successfully perform web search', async () => {
      const { serperAPI } = await import('../../api/serper');
      
      // Mock search response
      const mockSearchResponse = {
        organic: [
          {
            title: 'AI Overview',
            link: 'https://example.com/ai',
            snippet: 'Artificial intelligence overview',
            position: 1,
          },
          {
            title: 'Machine Learning Guide',
            link: 'https://example.com/ml',
            snippet: 'Guide to machine learning',
            position: 2,
          }
        ],
        relatedSearches: [
          { query: 'machine learning' },
          { query: 'deep learning' }
        ]
      };

      (serperAPI.searchQuery as any).mockResolvedValue(mockSearchResponse);
      (serperAPI.getFormattedResults as any).mockResolvedValue('Formatted search results');

      const result = await webSearchTool.execute({
        context: { query: 'artificial intelligence', maxResults: 10 }
      });

      expect(result).toEqual({
        query: 'artificial intelligence',
        results: [
          {
            title: 'AI Overview',
            link: 'https://example.com/ai',
            snippet: 'Artificial intelligence overview',
            position: 1,
            source: 'web'
          },
          {
            title: 'Machine Learning Guide',
            link: 'https://example.com/ml',
            snippet: 'Guide to machine learning',
            position: 2,
            source: 'web'
          }
        ],
        totalResults: 2,
        searchType: 'web',
        formattedSummary: 'Formatted search results',
        relatedQueries: ['machine learning', 'deep learning']
      });
    });

    it('should handle search errors gracefully', async () => {
      const { serperAPI } = await import('../../api/serper');
      
      (serperAPI.searchQuery as any).mockRejectedValue(new Error('API error'));

      const result = await webSearchTool.execute({
        context: { query: 'test query', maxResults: 5 }
      });

      expect(result.query).toBe('test query');
      expect(result.results).toEqual([]);
      expect(result.totalResults).toBe(0);
      expect(result.searchType).toBe('web');
      expect(result.formattedSummary).toContain('Error performing web search');
    });
  });

  describe('shopping search functionality', () => {
    it('should successfully perform shopping search', async () => {
      const { serperAPI } = await import('../../api/serper');
      
      // Mock shopping response
      const mockShoppingResponse = {
        shopping: [
          {
            title: 'iPhone 15 Pro',
            link: 'https://store.com/iphone15',
            price: '$999',
            source: 'Apple Store',
            position: 1,
            rating: 4.8
          }
        ]
      };

      (serperAPI.getFormattedShoppingResults as any).mockResolvedValue({
        response: mockShoppingResponse,
        formattedResults: 'Formatted shopping results'
      });

      const result = await shoppingSearchTool.execute({
        context: { query: 'iPhone 15', maxResults: 20 }
      });

      expect(result).toEqual({
        query: 'iPhone 15',
        results: [
          {
            title: 'iPhone 15 Pro',
            link: 'https://store.com/iphone15',
            snippet: '$999 - Apple Store (4.8⭐)',
            position: 1,
            source: 'shopping'
          }
        ],
        totalResults: 1,
        searchType: 'shopping',
        formattedSummary: 'Formatted shopping results'
      });
    });

    it('should handle shopping search errors gracefully', async () => {
      const { serperAPI } = await import('../../api/serper');
      
      (serperAPI.getFormattedShoppingResults as any).mockRejectedValue(new Error('Shopping API error'));

      const result = await shoppingSearchTool.execute({
        context: { query: 'laptop', maxResults: 10 }
      });

      expect(result.query).toBe('laptop');
      expect(result.results).toEqual([]);
      expect(result.totalResults).toBe(0);
      expect(result.searchType).toBe('shopping');
      expect(result.formattedSummary).toContain('Error performing shopping search');
    });

    it('should handle products without ratings', async () => {
      const { serperAPI } = await import('../../api/serper');
      
      const mockShoppingResponse = {
        shopping: [
          {
            title: 'Basic Laptop',
            link: 'https://store.com/laptop',
            price: '$599',
            source: 'TechStore',
            position: 1,
            // No rating provided
          }
        ]
      };

      (serperAPI.getFormattedShoppingResults as any).mockResolvedValue({
        response: mockShoppingResponse,
        formattedResults: 'Formatted shopping results'
      });

      const result = await shoppingSearchTool.execute({
        context: { query: 'laptop', maxResults: 10 }
      });

      expect(result.results[0].snippet).toBe('$599 - TechStore');
    });
  });
});