import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSimilarProducts, type GetSimilarProductsParams, type VectorQueryRes } from '../internal-search';
import { QueryTypes } from 'sequelize';

// Mock all the dependencies
vi.mock('../database/connect.js', () => ({
  default: {
    sequelizeConnection: {
      query: vi.fn(),
      escape: vi.fn((value) => `'${value}'`),
    }
  }
}));

vi.mock('../../sourcy-models/lib/logging/index', () => ({
  logQueryError: vi.fn()
}));

vi.mock('../../utils/textToEmbedding', () => ({
  getEmbeddings: vi.fn()
}));

vi.mock('../../utils/cohere', () => ({
  default: {
    reRank: vi.fn()
  }
}));

vi.mock('sequelize', () => ({
  QueryTypes: {
    SELECT: 'SELECT',
    RAW: 'RAW'
  }
}));

import db from '../database/connect.js';
import { ModelError } from '../../sourcy-models/lib/errors/ModelError';
import { ControllerError } from '../../sourcy-models/lib/errors/ControllerError';
import { logQueryError } from '../../sourcy-models/lib/logging/index';
import { getEmbeddings } from '../../utils/textToEmbedding';
import cohere from '../../utils/cohere';

// Get the mocked functions
const mockQuery = vi.mocked(db.sequelizeConnection.query);
const mockEscape = vi.mocked(db.sequelizeConnection.escape);
const mockGetEmbeddings = vi.mocked(getEmbeddings);
const mockCohere = vi.mocked(cohere.reRank);
const mockLogQueryError = vi.mocked(logQueryError);

describe('getSimilarProducts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('input validation', () => {
    it('should return ModelError for empty query', async () => {
      const params: GetSimilarProductsParams = {
        query: ''
      };

      const result = await getSimilarProducts(params);

      expect(result).toBeInstanceOf(ModelError);
      expect((result as ModelError).error).toBe('No query provided');
      expect(mockLogQueryError).toHaveBeenCalledWith(
        'productVectorStore',
        'getSimilarProducts',
        'No query provided'
      );
    });

    it('should handle valid query input', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockQueryResults: VectorQueryRes[] = [
        {
          product_id: 1,
          product_variant_id: 101,
          product: 'Test Product',
          link: 'https://example.com/product1',
          product_image: 'https://example.com/img1.jpg',
          price: 99.99,
          moq: 10,
          lead_time_days: 7,
          labels: ['electronics'],
          cos_dist: 0.1
        }
      ];

      mockGetEmbeddings.mockResolvedValue(mockEmbedding);
      mockQuery
        .mockResolvedValueOnce(undefined) // for HNSW setting
        .mockResolvedValueOnce(mockQueryResults as any); // for main query

      const params: GetSimilarProductsParams = {
        query: 'laptop computer'
      };

      const result = await getSimilarProducts(params);

      expect(result).toEqual(mockQueryResults);
      expect(mockGetEmbeddings).toHaveBeenCalledWith('laptop computer');
    });
  });

  describe('parameter handling', () => {
    beforeEach(() => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      mockGetEmbeddings.mockResolvedValue(mockEmbedding);
      mockQuery
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([]);
    });

    it('should use default parameters when not provided', async () => {
      const params: GetSimilarProductsParams = {
        query: 'test product'
      };

      await getSimilarProducts(params);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('limit $limit'),
        expect.objectContaining({
          bind: expect.objectContaining({
            limit: 20, // default limit
            offset: 0,  // default page * limit
          })
        })
      );
    });

    it('should handle custom pagination parameters', async () => {
      const params: GetSimilarProductsParams = {
        query: 'test product',
        page: 2,
        limit: 50
      };

      await getSimilarProducts(params);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          bind: expect.objectContaining({
            limit: 50,
            offset: 100, // page 2 * limit 50
          })
        })
      );
    });

    it('should handle price filters', async () => {
      const params: GetSimilarProductsParams = {
        query: 'test product',
        priceMin: 10.00,
        priceMax: 100.00
      };

      await getSimilarProducts(params);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          bind: expect.objectContaining({
            priceMin: 10.00,
            priceMax: 100.00,
          })
        })
      );
    });

    it('should handle MOQ filters', async () => {
      const params: GetSimilarProductsParams = {
        query: 'test product',
        moqMin: 5,
        moqMax: 50
      };

      await getSimilarProducts(params);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          bind: expect.objectContaining({
            moqMin: 5,
            moqMax: 50,
          })
        })
      );
    });

    it('should handle lead time filters', async () => {
      const params: GetSimilarProductsParams = {
        query: 'test product',
        leadTimeMin: 1,
        leadTimeMax: 30
      };

      await getSimilarProducts(params);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          bind: expect.objectContaining({
            leadTimeMin: 1,
            leadTimeMax: 30,
          })
        })
      );
    });

    it('should handle product label filters', async () => {
      const params: GetSimilarProductsParams = {
        query: 'test product',
        productLabelKeys: ['electronics', 'consumer']
      };

      mockEscape
        .mockReturnValueOnce("'electronics'")
        .mockReturnValueOnce("'consumer'");

      await getSimilarProducts(params);

      expect(mockEscape).toHaveBeenCalledWith('electronics');
      expect(mockEscape).toHaveBeenCalledWith('consumer');
    });
  });

  describe('reranking functionality', () => {
    it('should apply reranking when requested', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockQueryResults: VectorQueryRes[] = [
        {
          product_id: 1,
          product_variant_id: 101,
          product: 'Product A',
          link: 'https://example.com/a',
          product_image: 'https://example.com/a.jpg',
          price: 50,
          moq: 10,
          lead_time_days: 7,
          labels: ['electronics'],
          cos_dist: 0.1
        },
        {
          product_id: 2,
          product_variant_id: 102,
          product: 'Product B',
          link: 'https://example.com/b',
          product_image: 'https://example.com/b.jpg',
          price: 75,
          moq: 5,
          lead_time_days: 14,
          labels: ['electronics'],
          cos_dist: 0.2
        }
      ];

      const mockRerankedResults = [
        { index: 1 }, // Product B first
        { index: 0 }  // Product A second
      ];

      mockGetEmbeddings.mockResolvedValue(mockEmbedding);
      mockQuery
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(mockQueryResults);
      mockCohere.mockResolvedValue(mockRerankedResults);

      const params: GetSimilarProductsParams = {
        query: 'laptop',
        rerank: true,
        limit: 2
      };

      const result = await getSimilarProducts(params);

      expect(mockCohere).toHaveBeenCalledWith(
        'laptop',
        ['Product A', 'Product B'],
        2
      );
      
      // Result should be reordered: Product B first, then Product A
      expect(result).toEqual([mockQueryResults[1], mockQueryResults[0]]);
    });

    it('should handle reranking errors gracefully', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockQueryResults: VectorQueryRes[] = [
        {
          product_id: 1,
          product_variant_id: 101,
          product: 'Product A',
          link: 'https://example.com/a',
          product_image: 'https://example.com/a.jpg',
          price: 50,
          moq: 10,
          lead_time_days: 7,
          labels: ['electronics'],
          cos_dist: 0.1
        }
      ];

      mockGetEmbeddings.mockResolvedValue(mockEmbedding);
      mockQuery
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(mockQueryResults);
      mockCohere.mockRejectedValue(new Error('Reranking failed'));

      const params: GetSimilarProductsParams = {
        query: 'laptop',
        rerank: true
      };

      const result = await getSimilarProducts(params);

      // Should return original results when reranking fails
      expect(result).toEqual(mockQueryResults);
    });

    it('should handle ControllerError from reranking', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockQueryResults: VectorQueryRes[] = [
        {
          product_id: 1,
          product_variant_id: 101,
          product: 'Product A',
          link: 'https://example.com/a',
          product_image: 'https://example.com/a.jpg',
          price: 50,
          moq: 10,
          lead_time_days: 7,
          labels: ['electronics'],
          cos_dist: 0.1
        }
      ];

      const controllerError = new ControllerError('Reranking service unavailable');

      mockGetEmbeddings.mockResolvedValue(mockEmbedding);
      mockQuery
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(mockQueryResults);
      mockCohere.mockResolvedValue(controllerError);

      const params: GetSimilarProductsParams = {
        query: 'laptop',
        rerank: true
      };

      const result = await getSimilarProducts(params);

      expect(result).toBeInstanceOf(ModelError);
      expect((result as ModelError).error).toBe('Reranking service unavailable');
    });
  });

  describe('database interaction', () => {
    it('should set HNSW ef_search parameter', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      
      mockGetEmbeddings.mockResolvedValue(mockEmbedding);
      mockQuery
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([]);

      const params: GetSimilarProductsParams = {
        query: 'test product',
        limit: 50
      };

      await getSimilarProducts(params);

      // Should set HNSW parameter to max(100, limit * 2) = max(100, 100) = 100
      expect(mockQuery).toHaveBeenCalledWith(
        'set hnsw.ef_search = 100;',
        { type: QueryTypes.RAW }
      );
    });

    it('should use larger HNSW ef_search for small limits', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      
      mockGetEmbeddings.mockResolvedValue(mockEmbedding);
      mockQuery
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([]);

      const params: GetSimilarProductsParams = {
        query: 'test product',
        limit: 10
      };

      await getSimilarProducts(params);

      // Should set HNSW parameter to max(100, 10 * 2) = 100
      expect(mockQuery).toHaveBeenCalledWith(
        'set hnsw.ef_search = 100;',
        { type: QueryTypes.RAW }
      );
    });
  });

  describe('error handling', () => {
    it('should handle database query errors', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const dbError = new Error('Database connection failed');
      
      mockGetEmbeddings.mockResolvedValue(mockEmbedding);
      mockQuery.mockRejectedValue(dbError);

      const params: GetSimilarProductsParams = {
        query: 'test product'
      };

      const result = await getSimilarProducts(params);

      expect(result).toBeInstanceOf(ModelError);
      expect(mockLogQueryError).toHaveBeenCalledWith(
        'productVectorStore',
        'getSimilarProducts',
        expect.any(String)
      );
    });

    it('should handle embedding generation errors', async () => {
      const embeddingError = new Error('Embedding service unavailable');
      
      mockGetEmbeddings.mockRejectedValue(embeddingError);

      const params: GetSimilarProductsParams = {
        query: 'test product'
      };

      const result = await getSimilarProducts(params);

      expect(result).toBeInstanceOf(ModelError);
      expect(mockLogQueryError).toHaveBeenCalledWith(
        'productVectorStore',
        'getSimilarProducts',
        expect.any(String)
      );
    });
  });

  describe('boolean flags', () => {
    beforeEach(() => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      mockGetEmbeddings.mockResolvedValue(mockEmbedding);
      mockQuery
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([]);
    });

    it('should handle translated flag', async () => {
      const params: GetSimilarProductsParams = {
        query: 'test product',
        translated: true
      };

      await getSimilarProducts(params);

      // Should include translated condition in query
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('p.title_translated is not null'),
        expect.any(Object)
      );
    });

    it('should handle categorized flag', async () => {
      const params: GetSimilarProductsParams = {
        query: 'test product',
        categorized: true
      };

      await getSimilarProducts(params);

      // Should include taxonomy condition in query
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('p.taxonomy_id is not null'),
        expect.any(Object)
      );
    });

    it('should handle botSearch flag', async () => {
      const params: GetSimilarProductsParams = {
        query: 'test product',
        botSearch: true
      };

      await getSimilarProducts(params);

      // Should include bot search conditions in query
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('pv.price > 0'),
        expect.any(Object)
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('pv.weight_per_unit_kg is not null'),
        expect.any(Object)
      );
    });
  });
});