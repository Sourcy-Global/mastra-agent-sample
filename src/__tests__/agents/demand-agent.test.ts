import { describe, it, expect } from 'vitest'
import { demandAgent } from '../../agents/demand-agent'
import { marketAnalysisSchema } from '../../utils/schemas'

describe('Demand Analysis Agent', () => {
	it('should be configured with correct name', () => {
		expect(demandAgent.name).toBe('Demand Analysis Agent')
	})

	it('should have all search tools available', () => {
		expect(demandAgent.tools).toHaveProperty('webSearchTool')
		expect(demandAgent.tools).toHaveProperty('shoppingSearchTool')
	})

	it('should have a model configured', () => {
		expect(demandAgent.model).toBeDefined()
	})

	describe('instructions content', () => {
		it('should mention expertise in market research analysis', () => {
			expect(demandAgent.instructions).toContain(
				'expert market research analyst'
			)
			expect(demandAgent.instructions).toContain(
				'comprehensive market analysis'
			)
		})

		it('should outline primary functions', () => {
			expect(demandAgent.instructions).toContain(
				'Conduct thorough market research'
			)
			expect(demandAgent.instructions).toContain('Analyze current market trends')
			expect(demandAgent.instructions).toContain(
				'Identify trending features'
			)
			expect(demandAgent.instructions).toContain(
				'Research competitive landscape'
			)
			expect(demandAgent.instructions).toContain(
				'Provide pricing insights'
			)
		})

		it('should emphasize research methodology', () => {
			expect(demandAgent.instructions).toContain(
				'Research Methodology and Search Strategy'
			)
			expect(demandAgent.instructions).toContain(
				'specific product category keywords'
			)
			expect(demandAgent.instructions).toContain(
				'industry publications and expert opinions'
			)
			expect(demandAgent.instructions).toContain(
				'B2C and B2B perspectives'
			)
		})

		it('should mention search strategy elements', () => {
			expect(demandAgent.instructions).toContain('2024 trends')
			expect(demandAgent.instructions).toContain('market report')
			expect(demandAgent.instructions).toContain('consumer insights')
			expect(demandAgent.instructions).toContain('regulatory and compliance trends')
		})

		it('should mention quality standards', () => {
			expect(demandAgent.instructions).toContain('Quality Standards')
			expect(demandAgent.instructions).toContain('5-8 different searches')
			expect(demandAgent.instructions).toContain('Cross-reference findings')
			expect(demandAgent.instructions).toContain('recent data')
		})

		it('should emphasize thorough analysis', () => {
			expect(demandAgent.instructions).toContain('thorough, analytical')
			expect(demandAgent.instructions).toContain('market intelligence')
			expect(demandAgent.instructions).toContain(
				'sourcing and product development decisions'
			)
		})
	})

	describe('market analysis schema', () => {
		it('should have required top-level fields', () => {
			const shape = marketAnalysisSchema.shape
			expect(shape).toHaveProperty('market_analysis_report')
			expect(shape).toHaveProperty('confidence_level')
			expect(shape).toHaveProperty('research_depth')
		})

		it('should validate confidence level range', () => {
			const confidenceLevel = marketAnalysisSchema.shape.confidence_level
			expect(() => confidenceLevel.parse(5)).not.toThrow()
			expect(() => confidenceLevel.parse(0)).toThrow()
			expect(() => confidenceLevel.parse(11)).toThrow()
		})

		it('should have comprehensive market analysis report structure', () => {
			const reportShape =
				marketAnalysisSchema.shape.market_analysis_report.shape
			expect(reportShape).toHaveProperty('trending_features')
			expect(reportShape).toHaveProperty('popular_styles')
			expect(reportShape).toHaveProperty('preferred_materials')
			expect(reportShape).toHaveProperty('archetype_brands')
			expect(reportShape).toHaveProperty('positive_trends')
			expect(reportShape).toHaveProperty('negative_trends')
			expect(reportShape).toHaveProperty('price_insights')
			expect(reportShape).toHaveProperty('consumer_preferences')
			expect(reportShape).toHaveProperty('market_gaps')
			expect(reportShape).toHaveProperty('seasonal_trends')
			expect(reportShape).toHaveProperty('summary')
		})

		it('should have detailed archetype_brands structure', () => {
			const mockBrand = {
				brand_name: 'Test Brand',
				position: 'Premium',
				key_differentiators: ['Quality', 'Innovation'],
			}

			const brandsSchema =
				marketAnalysisSchema.shape.market_analysis_report.shape.archetype_brands
			expect(() => brandsSchema.element.parse(mockBrand)).not.toThrow()
		})

		it('should have price_insights structure', () => {
			const priceInsights =
				marketAnalysisSchema.shape.market_analysis_report.shape.price_insights
					.shape
			expect(priceInsights).toHaveProperty('typical_range')
			expect(priceInsights).toHaveProperty('premium_features')
			expect(priceInsights).toHaveProperty('value_drivers')
		})

		it('should validate complete market analysis report', () => {
			const mockReport = {
				market_analysis_report: {
					trending_features: ['Feature 1', 'Feature 2'],
					popular_styles: ['Style 1', 'Style 2'],
					preferred_materials: ['Material 1', 'Material 2'],
					archetype_brands: [
						{
							brand_name: 'Brand A',
							position: 'Premium',
							key_differentiators: ['Quality', 'Design'],
						},
					],
					positive_trends: ['Trend 1', 'Trend 2'],
					negative_trends: ['Negative 1', 'Negative 2'],
					price_insights: {
						typical_range: '$10-50',
						premium_features: ['Premium 1', 'Premium 2'],
						value_drivers: ['Driver 1', 'Driver 2'],
					},
					consumer_preferences: ['Preference 1', 'Preference 2'],
					market_gaps: ['Gap 1', 'Gap 2'],
					seasonal_trends: ['Seasonal 1', 'Seasonal 2'],
					summary: 'Executive summary of the market analysis',
				},
				confidence_level: 8,
				research_depth: 'Comprehensive analysis with 10+ sources',
			}

			expect(() => marketAnalysisSchema.parse(mockReport)).not.toThrow()
		})
	})
})
