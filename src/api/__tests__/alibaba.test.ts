import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { AlibabaAPI, alibabaAPI } from '../alibaba';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock retry function
vi.mock('../index.js', () => ({
  retry: vi.fn((fn) => fn()) // Simple mock that just calls the function
}));

describe('AlibabaAPI', () => {
  let api: AlibabaAPI;

  beforeEach(() => {
    vi.resetAllMocks();
    // Set up environment variables for testing
    process.env.API_1688_TOKEN = 'test-alibaba-token';
    process.env.API_1688_BASE_URL = 'http://api.tmapi.top';
    api = new AlibabaAPI();
  });

  describe('constructor', () => {
    it('should create instance with environment variables', () => {
      expect(api).toBeDefined();
    });

    it('should throw error if API_1688_TOKEN is not set', () => {
      delete process.env.API_1688_TOKEN;
      expect(() => new AlibabaAPI()).toThrow('API_1688_TOKEN environment variable is required');
    });

    it('should use default base URL if not provided', () => {
      delete process.env.API_1688_BASE_URL;
      const apiWithDefaults = new AlibabaAPI();
      expect(apiWithDefaults).toBeDefined();
    });
  });

  describe('search', () => {
    it('should perform search successfully', async () => {
      const mockResponse = {
        data: {
          code: 200,
          msg: 'success',
          data: {
            page: 1,
            page_size: 20,
            total_count: 150,
            keywords: 'wireless headphones',
            sort: 'relevance',
            filters: {
              price_start: '',
              price_end: ''
            },
            items: [
              {
                item_id: 'ali123456',
                title: 'Wireless Bluetooth Headphones',
                img: 'https://example.com/headphones.jpg',
                category_id: '502',
                price: '$25.50',
                price_info: {
                  price_text: '$25.50 - $30.00',
                  price_min: '25.50',
                  price_max: '30.00'
                },
                comment_count: 85,
                shop_info: {
                  company_name: 'Audio Tech Ltd',
                  company_id: 'comp789',
                  company_region: 'Guangdong, China',
                  seller_id: 'seller456',
                  member_id: 'member123',
                  is_verified_supplier: true,
                  chat_url: 'https://alibaba.com/chat/seller456'
                },
                min_order_quantity: '50',
                unit: 'pieces'
              }
            ]
          }
        }
      };

      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      const result = await api.search({
        keywords: 'wireless headphones',
        page: 1,
        page_size: 20,
        sort: 'relevance'
      });

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: 'GET',
        url: 'http://api.tmapi.top/alibaba/search/items',
        params: {
          apiToken: 'test-alibaba-token',
          keywords: 'wireless headphones',
          page: 1,
          page_size: 20,
          sort: 'relevance'
        }
      });
    });
  });

  describe('searchQuery', () => {
    it('should search with default parameters', async () => {
      const mockResponse = {
        data: {
          code: 200,
          msg: 'success',
          data: {
            page: 1,
            page_size: 20,
            total_count: 75,
            keywords: 'smartphone',
            sort: 'relevance',
            items: []
          }
        }
      };

      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      const result = await api.searchQuery('smartphone');

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            keywords: 'smartphone',
            page: 1,
            page_size: 20,
            sort: 'relevance'
          })
        })
      );
    });

    it('should search with custom parameters', async () => {
      const mockResponse = {
        data: {
          code: 200,
          msg: 'success',
          data: { page: 3, page_size: 15, total_count: 200, items: [] }
        }
      };

      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      await api.searchQuery('laptop', 3, 15, 'price_desc');

      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            keywords: 'laptop',
            page: 3,
            page_size: 15,
            sort: 'price_desc'
          })
        })
      );
    });
  });

  describe('getFormattedSearchResults', () => {
    it('should format search results with products', async () => {
      const mockResponse = {
        data: {
          code: 200,
          msg: 'success',
          data: {
            page: 1,
            page_size: 10,
            total_count: 250,
            keywords: 'power bank',
            sort: 'sales_desc',
            items: [
              {
                item_id: 'pb001',
                title: '20000mAh Portable Power Bank',
                img: 'https://example.com/powerbank.jpg',
                category_id: '305',
                price: '$12.99',
                price_info: {
                  price_text: '$12.99 - $15.99',
                  price_min: '12.99',
                  price_max: '15.99'
                },
                comment_count: 156,
                shop_info: {
                  company_name: 'Electronic Solutions Inc',
                  company_id: 'esi001',
                  company_region: 'Shenzhen, China',
                  seller_id: 'seller789',
                  member_id: 'member456',
                  is_verified_supplier: true,
                  chat_url: 'https://alibaba.com/chat/seller789'
                },
                min_order_quantity: '100',
                unit: 'pieces'
              }
            ]
          }
        }
      };

      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      const result = await api.getFormattedSearchResults('power bank', 1, 10);

      expect(result).toContain('Alibaba Search Results for: "power bank"');
      expect(result).toContain('Total Results: 250');
      expect(result).toContain('Page: 1/25');
      expect(result).toContain('Sort: sales_desc');
      expect(result).toContain('20000mAh Portable Power Bank');
      expect(result).toContain('Item ID: pb001');
      expect(result).toContain('Price: $12.99 USD');
      expect(result).toContain('Price Range: $12.99 - $15.99');
      expect(result).toContain('Category ID: 305');
      expect(result).toContain('Shop: Electronic Solutions Inc (esi001)');
      expect(result).toContain('Seller ID: seller789');
      expect(result).toContain('Member ID: member456');
      expect(result).toContain('Verified Supplier: true');
      expect(result).toContain('Region: Shenzhen, China');
      expect(result).toContain('Min Order: 100 pieces');
      expect(result).toContain('Comments: 156');
    });

    it('should handle empty search results', async () => {
      const mockResponse = {
        data: {
          code: 200,
          msg: 'success',
          data: {
            page: 1,
            page_size: 10,
            total_count: 0,
            keywords: 'nonexistent product',
            items: []
          }
        }
      };

      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      const result = await api.getFormattedSearchResults('nonexistent product');

      expect(result).toContain('No products found.');
    });

    it('should handle search errors', async () => {
      mockedAxios.request.mockRejectedValueOnce(new Error('Alibaba API Error'));

      const result = await api.getFormattedSearchResults('test product');

      expect(result).toContain('Error performing Alibaba search for "test product"');
      expect(result).toContain('Alibaba API Error');
    });
  });

  describe('getDetail', () => {
    it('should get product details successfully', async () => {
      const mockResponse = {
        data: {
          code: 200,
          msg: 'success',
          data: {
            item_id: 789012,
            title: 'Premium Bluetooth Speaker',
            product_url: 'https://alibaba.com/product/premium-speaker',
            category_path: [
              { id: '1', name: 'Electronics' },
              { id: '11', name: 'Audio & Video' },
              { id: '111', name: 'Speakers' }
            ],
            category_id: 111,
            currency: 'USD',
            product_props: [
              { key: 'Brand', value: 'Premium Audio' },
              { key: 'Color', value: 'Black' },
              { key: 'Connectivity', value: 'Bluetooth 5.0' }
            ],
            main_imgs: [
              'https://example.com/speaker1.jpg',
              'https://example.com/speaker2.jpg',
              'https://example.com/speaker3.jpg'
            ],
            video_url: 'https://example.com/speaker-demo.mp4',
            price_info: {
              price_text: '$45.00 - $65.00',
              price_min: '45.00',
              price_max: '65.00'
            },
            tiered_price_info: null,
            comment_count: 89,
            customization_options: [
              {
                custom_type: 'Logo Printing',
                min_order_quantity: 500
              }
            ],
            certifications: [],
            review_info: {
              rating_star: 4.5,
              review_count: 89
            },
            sales_count: '1250',
            shop_info: {
              company_name: 'Audio Excellence Manufacturing',
              company_id: 12345,
              company_type: 'Manufacturer',
              company_region: 'Guangdong, China',
              opening_years: '8',
              seller_id: 67890,
              member_id: 98765,
              login_id: 'audio_excellence',
              contact_name: 'John Chen',
              shop_url: 'https://alibaba.com/shop/audio-excellence',
              shop_rate: {
                average_star: '4.7',
                scores: [
                  { type: 'Quality', score: '4.8' },
                  { type: 'Service', score: '4.6' },
                  { type: 'Delivery', score: '4.7' }
                ]
              },
              response_time: '< 2 hours',
              ontime_delivery_rate: '96%',
              is_company_auth: true,
              is_gold_supplier: true,
              is_top_supplier: false,
              is_dispatch_guaranteed: true
            },
            delivery_info: {
              area_from: 'Shenzhen, China',
              delivery_days: 7,
              unit_weight: '2.5 kg',
              unit_size: '25x15x20 cm'
            },
            sku_props: [
              {
                pid: 'color',
                prop_name: 'Color',
                values: [
                  { name: 'Black', vid: 'black', imageUrl: 'https://example.com/black-speaker.jpg' },
                  { name: 'White', vid: 'white', imageUrl: 'https://example.com/white-speaker.jpg' }
                ]
              }
            ],
            skus: [
              {
                skuid: 'sku_black',
                sale_price: '50.00',
                origin_price: '60.00',
                sample_price: '55.00',
                stock: 200,
                props_ids: 'color:black',
                props_names: 'Color:Black'
              },
              {
                skuid: 'sku_white',
                sale_price: '52.00',
                origin_price: '62.00',
                sample_price: '57.00',
                stock: 150,
                props_ids: 'color:white',
                props_names: 'Color:White'
              }
            ],
            min_order_quantity: 50,
            unit: 'pieces'
          }
        }
      };

      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      const result = await api.getDetail({ url: 'https://alibaba.com/product/premium-speaker' });

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: 'POST',
        url: 'http://api.tmapi.top/alibaba/item_detail_by_url',
        params: {
          apiToken: 'test-alibaba-token',
        },
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          url: 'https://alibaba.com/product/premium-speaker'
        }
      });
    });
  });

  describe('getFormattedDetailResults', () => {
    it('should format product details comprehensively', async () => {
      const mockResponse = {
        data: {
          code: 200,
          data: {
            item_id: 456789,
            title: 'Smart Fitness Watch',
            product_url: 'https://alibaba.com/product/smart-watch',
            category_id: 501,
            currency: 'USD',
            category_path: [
              { id: '5', name: 'Consumer Electronics' },
              { id: '51', name: 'Wearables' }
            ],
            price_info: {
              price_text: '$35.00 - $45.00',
              price_min: '35.00',
              price_max: '45.00'
            },
            sales_count: '2500',
            comment_count: 127,
            min_order_quantity: 20,
            unit: 'pieces',
            shop_info: {
              company_name: 'Tech Innovations Ltd',
              company_id: 54321,
              company_type: 'Trading Company',
              company_region: 'Hong Kong',
              opening_years: '12',
              seller_id: 13579,
              member_id: 24680,
              login_id: 'tech_innovations',
              contact_name: 'Alice Wong',
              shop_url: 'https://alibaba.com/shop/tech-innovations',
              shop_rate: {
                average_star: '4.9',
                scores: [
                  { type: 'Product Quality', score: '4.9' },
                  { type: 'Communication', score: '4.8' }
                ]
              },
              response_time: '< 1 hour',
              ontime_delivery_rate: '99%',
              is_company_auth: true,
              is_gold_supplier: true,
              is_top_supplier: true,
              is_dispatch_guaranteed: true
            },
            delivery_info: {
              area_from: 'Hong Kong',
              delivery_days: 5,
              unit_weight: '0.8 kg',
              unit_size: '10x8x3 cm'
            },
            product_props: [
              { key: 'Screen Size', value: '1.4 inch' },
              { key: 'Battery Life', value: '7 days' },
              { key: 'Water Resistance', value: 'IP68' }
            ],
            customization_options: [
              { custom_type: 'Custom Logo', min_order_quantity: 100 },
              { custom_type: 'Custom Packaging', min_order_quantity: 200 }
            ],
            review_info: {
              rating_star: 4.6,
              review_count: 127
            },
            sku_props: [
              {
                prop_name: 'Band Color',
                values: [
                  { name: 'Black' },
                  { name: 'Blue' },
                  { name: 'Red' }
                ]
              }
            ],
            skus: [
              {
                props_names: 'Band Color:Black',
                sale_price: '38.00',
                origin_price: '45.00',
                sample_price: '42.00',
                stock: 300
              },
              {
                props_names: 'Band Color:Blue',
                sale_price: '39.00',
                origin_price: '46.00',
                sample_price: '43.00',
                stock: 250
              }
            ],
            main_imgs: [
              'https://example.com/watch1.jpg',
              'https://example.com/watch2.jpg',
              'https://example.com/watch3.jpg',
              'https://example.com/watch4.jpg',
              'https://example.com/watch5.jpg',
              'https://example.com/watch6.jpg'
            ],
            video_url: 'https://example.com/watch-demo.mp4'
          }
        }
      };

      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      const result = await api.getFormattedDetailResults('https://alibaba.com/product/smart-watch');

      expect(result).toContain('Alibaba Product Details for URL: https://alibaba.com/product/smart-watch');
      expect(result).toContain('Title: Smart Fitness Watch');
      expect(result).toContain('Item ID: 456789');
      expect(result).toContain('Currency: USD');
      
      // Category path
      expect(result).toContain('Category Path:');
      expect(result).toContain('Consumer Electronics (ID: 5)');
      expect(result).toContain('Wearables (ID: 51)');
      
      // Price information
      expect(result).toContain('Price Information:');
      expect(result).toContain('Price Text: $35.00 - $45.00');
      expect(result).toContain('Price Range: 35.00 - 45.00 USD');
      
      // Sales information
      expect(result).toContain('Sales Information:');
      expect(result).toContain('Sales Count: 2500');
      expect(result).toContain('Comment Count: 127');
      expect(result).toContain('Min Order Quantity: 20 pieces');
      
      // Shop information
      expect(result).toContain('Shop Information:');
      expect(result).toContain('Company Name: Tech Innovations Ltd');
      expect(result).toContain('Company Type: Trading Company');
      expect(result).toContain('Region: Hong Kong');
      expect(result).toContain('Opening Years: 12');
      expect(result).toContain('Contact: Alice Wong');
      expect(result).toContain('Response Time: < 1 hour');
      expect(result).toContain('On-time Delivery Rate: 99%');
      expect(result).toContain('Gold Supplier: true');
      expect(result).toContain('Top Supplier: true');
      
      // Shop ratings
      expect(result).toContain('Shop Ratings:');
      expect(result).toContain('Average Star: 4.9');
      expect(result).toContain('Product Quality: 4.9');
      expect(result).toContain('Communication: 4.8');
      
      // Delivery information
      expect(result).toContain('Delivery Information:');
      expect(result).toContain('Area From: Hong Kong');
      expect(result).toContain('Delivery Days: 5');
      expect(result).toContain('Unit Weight: 0.8 kg');
      expect(result).toContain('Unit Size: 10x8x3 cm');
      
      // Product properties
      expect(result).toContain('Product Properties:');
      expect(result).toContain('Screen Size: 1.4 inch');
      expect(result).toContain('Battery Life: 7 days');
      expect(result).toContain('Water Resistance: IP68');
      
      // Customization options
      expect(result).toContain('Customization Options:');
      expect(result).toContain('Custom Logo: Min Order 100');
      expect(result).toContain('Custom Packaging: Min Order 200');
      
      // Review information
      expect(result).toContain('Review Information:');
      expect(result).toContain('Rating Star: 4.6');
      expect(result).toContain('Review Count: 127');
      
      // SKU properties
      expect(result).toContain('SKU Properties:');
      expect(result).toContain('Band Color: Black, Blue, Red');
      
      // SKU variants
      expect(result).toContain('SKU Variants:');
      expect(result).toContain('Band Color:Black');
      expect(result).toContain('Sale Price: 38.00 USD');
      expect(result).toContain('Origin Price: 45.00 USD');
      expect(result).toContain('Stock: 300');
      
      // Images
      expect(result).toContain('Main Images (6):');
      expect(result).toContain('1. https://example.com/watch1.jpg');
      expect(result).toContain('5. https://example.com/watch5.jpg');
      expect(result).toContain('... and 1 more images');
      
      // Video
      expect(result).toContain('Video URL: https://example.com/watch-demo.mp4');
    });

    it('should handle detail fetch errors', async () => {
      mockedAxios.request.mockRejectedValueOnce(new Error('Detail fetch failed'));

      const result = await api.getFormattedDetailResults('https://invalid-url.com');

      expect(result).toContain('Error getting Alibaba product details for URL "https://invalid-url.com"');
      expect(result).toContain('Detail fetch failed');
    });

    it('should handle products with minimal data', async () => {
      const minimalResponse = {
        data: {
          code: 200,
          data: {
            item_id: 999,
            title: 'Basic Product',
            product_url: 'https://alibaba.com/basic',
            category_id: 1,
            currency: 'USD',
            price_info: {
              price_text: '$10.00',
              price_min: '10.00',
              price_max: '10.00'
            },
            shop_info: {
              company_name: 'Basic Supplier',
              shop_rate: { average_star: '4.0', scores: [] }
            },
            delivery_info: {
              area_from: null,
              delivery_days: 0
            },
            sales_count: null,
            comment_count: 0,
            min_order_quantity: 1,
            unit: 'piece',
            product_props: [],
            customization_options: [],
            review_info: { rating_star: null, review_count: 0 },
            sku_props: [],
            skus: [],
            main_imgs: [],
            category_path: []
          }
        }
      };

      mockedAxios.request.mockResolvedValueOnce(minimalResponse);

      const result = await api.getFormattedDetailResults('https://alibaba.com/basic');

      expect(result).toContain('Title: Basic Product');
      expect(result).toContain('Sales Count: N/A');
      expect(result).toContain('Area From: N/A');
      expect(result).toContain('Rating Star: N/A');
    });
  });

  describe('searchWithDetails', () => {
    it('should search and return formatted results', async () => {
      const mockResponse = {
        data: {
          code: 200,
          data: {
            page: 1,
            page_size: 5,
            total_count: 50,
            keywords: 'tablet',
            items: []
          }
        }
      };

      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      const result = await api.searchWithDetails('tablet', 1, 5);

      expect(result.searchResults).toContain('Alibaba Search Results for: "tablet"');
    });

    it('should handle search errors in searchWithDetails', async () => {
      mockedAxios.request.mockRejectedValueOnce(new Error('Search failed'));

      const result = await api.searchWithDetails('error product');

      expect(result.searchResults).toContain('Error performing Alibaba search for "error product"');
      expect(result.searchResults).toContain('Search failed');
    });
  });

  describe('getDetailByUrl', () => {
    it('should be a wrapper for getDetail', async () => {
      const mockResponse = {
        data: {
          code: 200,
          data: { item_id: 123, title: 'Test Product' }
        }
      };

      mockedAxios.request.mockResolvedValueOnce(mockResponse);

      const result = await api.getDetailByUrl('https://alibaba.com/test');

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { url: 'https://alibaba.com/test' }
        })
      );
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(alibabaAPI).toBeDefined();
      expect(alibabaAPI).toBeInstanceOf(AlibabaAPI);
    });
  });
});