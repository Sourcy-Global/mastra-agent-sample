import { describe, it, expect, vi, beforeEach } from 'vitest';
import { weatherTool } from '../index';

// Mock fetch globally
global.fetch = vi.fn();

describe('Weather Tool', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('weatherTool configuration', () => {
    it('should have correct id and description', () => {
      expect(weatherTool.id).toBe('get-weather');
      expect(weatherTool.description).toBe('Get current weather for a location');
    });

    it('should validate input schema', () => {
      const validInput = { location: 'New York' };
      const result = weatherTool.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid input', () => {
      const invalidInput = { city: 'New York' }; // wrong field name
      const result = weatherTool.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('weather data fetching', () => {
    it('should successfully fetch weather data', async () => {
      // Mock geocoding response
      const geocodingResponse = {
        results: [{
          latitude: 40.7128,
          longitude: -74.0060,
          name: 'New York'
        }]
      };

      // Mock weather response
      const weatherResponse = {
        current: {
          time: '2023-01-01T12:00',
          temperature_2m: 20,
          apparent_temperature: 18,
          relative_humidity_2m: 65,
          wind_speed_10m: 10,
          wind_gusts_10m: 15,
          weather_code: 0
        }
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(geocodingResponse)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(weatherResponse)
        });

      const result = await weatherTool.execute({
        context: { location: 'New York' }
      });

      expect(result).toEqual({
        temperature: 20,
        feelsLike: 18,
        humidity: 65,
        windSpeed: 10,
        windGust: 15,
        conditions: 'Clear sky',
        location: 'New York'
      });
    });

    it('should throw error for location not found', async () => {
      const geocodingResponse = { results: [] };

      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve(geocodingResponse)
      });

      await expect(
        weatherTool.execute({ context: { location: 'NonexistentCity' } })
      ).rejects.toThrow("Location 'NonexistentCity' not found");
    });

    it('should handle unknown weather codes', async () => {
      const geocodingResponse = {
        results: [{
          latitude: 40.7128,
          longitude: -74.0060,
          name: 'New York'
        }]
      };

      const weatherResponse = {
        current: {
          time: '2023-01-01T12:00',
          temperature_2m: 20,
          apparent_temperature: 18,
          relative_humidity_2m: 65,
          wind_speed_10m: 10,
          wind_gusts_10m: 15,
          weather_code: 999 // Unknown code
        }
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(geocodingResponse)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(weatherResponse)
        });

      const result = await weatherTool.execute({
        context: { location: 'New York' }
      });

      expect(result.conditions).toBe('Unknown');
    });
  });

  describe('weather condition mapping', () => {
    const testCases = [
      { code: 0, expected: 'Clear sky' },
      { code: 1, expected: 'Mainly clear' },
      { code: 2, expected: 'Partly cloudy' },
      { code: 95, expected: 'Thunderstorm' },
      { code: 999, expected: 'Unknown' }
    ];

    testCases.forEach(({ code, expected }) => {
      it(`should map weather code ${code} to "${expected}"`, async () => {
        const geocodingResponse = {
          results: [{
            latitude: 40.7128,
            longitude: -74.0060,
            name: 'Test City'
          }]
        };

        const weatherResponse = {
          current: {
            time: '2023-01-01T12:00',
            temperature_2m: 20,
            apparent_temperature: 18,
            relative_humidity_2m: 65,
            wind_speed_10m: 10,
            wind_gusts_10m: 15,
            weather_code: code
          }
        };

        (global.fetch as any)
          .mockResolvedValueOnce({
            json: () => Promise.resolve(geocodingResponse)
          })
          .mockResolvedValueOnce({
            json: () => Promise.resolve(weatherResponse)
          });

        const result = await weatherTool.execute({
          context: { location: 'Test City' }
        });

        expect(result.conditions).toBe(expected);
      });
    });
  });
});