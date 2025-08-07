import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { SerperAPI, serperAPI } from '../serper';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('SerperAPI', () => {
  let api: SerperAPI;

  beforeEach(() => {
    vi.resetAllMocks();
    // Set up environment variables for testing
    process.env.SERPER_API_KEY = 'test-serper-key';
    process.env.SERPER_API_URL = 'https://google.serper.dev';
    api = new SerperAPI();
  });

  describe('constructor', () => {
    it('should create instance with environment variables', () => {
      expect(api).toBeDefined();
    });

    it('should throw error if SERPER_API_KEY is not set', () => {
      delete process.env.SERPER_API_KEY;
      expect(() => new SerperAPI()).toThrow('SERPER_API_KEY environment variable is required');
    });
  });

  describe('search', () => {
    it('should perform search successfully', async () => {
      const mockResponse = {
        data: {
          searchParameters: {
            q: 'test query',
            type: 'search',
            num: 10,
            engine: 'google'
          },
          organic: [
            {
              title: 'Test Result',
              link: 'https://example.com',
              snippet: 'Test snippet',
              position: 1
            }
          ],
          credits: 100
        }
      };

      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      const result = await api.search({
        q: 'test query',
        num: 10
      });

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://google.serper.dev/search',
        headers: {
          'X-API-KEY': 'test-serper-key',
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({
          q: 'test query',
          num: 10
        })
      });
    });

    it('should handle axios errors', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: 'Bad request' }
        }
      };

      mockedAxios.isAxiosError.mockReturnValueOnce(true);
      mockedAxios.request.mockRejectedValueOnce(axiosError);

      await expect(api.search({ q: 'test' })).rejects.toEqual({
        message: 'Bad request',
        status: 400,
        details: { message: 'Bad request' }
      });
    });

    it('should handle non-axios errors', async () => {
      const genericError = new Error('Network error');
      mockedAxios.isAxiosError.mockReturnValueOnce(false);
      mockedAxios.request.mockRejectedValueOnce(genericError);

      await expect(api.search({ q: 'test' })).rejects.toEqual({
        message: 'Network error'
      });
    });
  });

  describe('searchQuery', () => {
    it('should search with default parameters', async () => {
      const mockResponse = {
        data: {
          searchParameters: { q: 'AI', type: 'search', num: 10, engine: 'google' },
          organic: [],
          credits: 100
        }
      };

      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      const result = await api.searchQuery('AI');

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: JSON.stringify({
            q: 'AI',
            num: 10,
            page: 1,
            gl: 'us',
            hl: 'en',
            autocorrect: true,
            safe: true,
          })
        })
      );
    });

    it('should search with custom number of results', async () => {
      const mockResponse = {
        data: {
          searchParameters: { q: 'machine learning', type: 'search', num: 5, engine: 'google' },
          organic: [],
          credits: 95
        }
      };

      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      await api.searchQuery('machine learning', 5);

      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: JSON.stringify({
            q: 'machine learning',
            num: 5,
            page: 1,
            gl: 'us',
            hl: 'en',
            autocorrect: true,
            safe: true,
          })
        })
      );
    });
  });

  describe('getFormattedResults', () => {
    it('should format search results with knowledge graph', async () => {
      const mockResponse = {
        data: {
          searchParameters: { q: 'Apple Inc', type: 'search', num: 5, engine: 'google' },
          knowledgeGraph: {
            title: 'Apple Inc.',
            description: 'Technology company',
            descriptionSource: 'Wikipedia',
            descriptionLink: 'https://en.wikipedia.org/wiki/Apple_Inc.',
            attributes: {
              'Founded': '1976',
              'CEO': 'Tim Cook'
            }
          },
          organic: [
            {
              title: 'Apple Official Site',
              link: 'https://apple.com',
              snippet: 'Official Apple website',
              position: 1,
              date: '2024-01-01'
            }
          ],
          peopleAlsoAsk: [
            {
              question: 'When was Apple founded?',
              snippet: 'Apple was founded in 1976',
              title: 'Apple History',
              link: 'https://example.com/history'
            }
          ],
          relatedSearches: [
            { query: 'Apple products' },
            { query: 'iPhone' }
          ],
          credits: 90
        }
      };

      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      const result = await api.getFormattedResults('Apple Inc', 5);

      expect(result).toContain('Search Results for: "Apple Inc"');
      expect(result).toContain('Knowledge Graph:');
      expect(result).toContain('Title: Apple Inc.');
      expect(result).toContain('Founded: 1976');
      expect(result).toContain('Top Results:');
      expect(result).toContain('Apple Official Site');
      expect(result).toContain('People Also Ask:');
      expect(result).toContain('When was Apple founded?');
      expect(result).toContain('Related Searches:');
      expect(result).toContain('Apple products');
    });

    it('should handle search errors gracefully', async () => {
      mockedAxios.request.mockRejectedValueOnce(new Error('API error'));
      mockedAxios.isAxiosError.mockReturnValueOnce(false);

      const result = await api.getFormattedResults('test query');

      expect(result).toContain('Error performing search for "test query"');
      expect(result).toContain('API error');
    });
  });

  describe('shopping search', () => {
    it('should perform shopping search successfully', async () => {
      const mockResponse = {
        data: {
          searchParameters: {
            q: 'iPhone 15',
            type: 'shopping',
            num: 20,
            page: 1,
            engine: 'google'
          },
          shopping: [
            {
              title: 'iPhone 15 Pro',
              source: 'Apple',
              link: 'https://apple.com/iphone-15',
              price: '$999',
              imageUrl: 'https://example.com/iphone.jpg',
              rating: 4.8,
              ratingCount: 1500,
              productId: 'iphone-15-pro',
              position: 1
            }
          ],
          credits: 85
        }
      };

      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      const result = await api.shopping({
        q: 'iPhone 15',
        num: 20
      });

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://google.serper.dev/shopping',
        headers: {
          'X-API-KEY': 'test-serper-key',
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({
          q: 'iPhone 15',
          num: 20
        })
      });
    });

    it('should format shopping results', async () => {
      const mockResponse = {
        data: {
          searchParameters: {
            q: 'laptop',
            type: 'shopping',
            num: 10,
            page: 1,
            engine: 'google'
          },
          shopping: [
            {
              title: 'MacBook Pro',
              source: 'Best Buy',
              link: 'https://bestbuy.com/macbook',
              price: '$1299',
              rating: 4.5,
              ratingCount: 850,
              productId: 'macbook-pro-13',
              position: 1
            }
          ],
          credits: 80
        }
      };

      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      const result = await api.getFormattedShoppingResults('laptop', 10);

      expect(result.formattedResults).toContain('Shopping Results for: "laptop"');
      expect(result.formattedResults).toContain('MacBook Pro');
      expect(result.formattedResults).toContain('Price: $1299');
      expect(result.formattedResults).toContain('Rating: 4.5/5 (850 reviews)');
      expect(result.response).toEqual(mockResponse.data);
    });

    it('should handle shopping search errors', async () => {
      mockedAxios.request.mockRejectedValueOnce(new Error('Shopping API error'));
      mockedAxios.isAxiosError.mockReturnValueOnce(false);

      const result = await api.getFormattedShoppingResults('test product');

      expect(result.formattedResults).toContain('Error performing shopping search for "test product"');
      expect(result.response.shopping).toEqual([]);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(serperAPI).toBeDefined();
      expect(serperAPI).toBeInstanceOf(SerperAPI);
    });
  });
});