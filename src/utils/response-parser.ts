import { z } from 'zod'

export interface ParseOptions<T> {
	fallbackValue: T
	errorMessage?: string
}

export class ResponseParser {
	static async parseJsonResponse<T>(
		responseText: string,
		schema: z.ZodSchema<T>,
		options: ParseOptions<T>
	): Promise<T> {
		try {
			const parsed = JSON.parse(responseText)
			const validated = schema.parse(parsed)
			return validated
		} catch (error) {
			console.warn(`Failed to parse JSON response: ${error}`)
			return options.fallbackValue
		}
	}

	static createFallbackResponse<T>(template: T, overrides?: Partial<T>): T {
		return { ...template, ...overrides }
	}

	static extractInsights(text: string): string[] {
		return text
			.split('\n')
			.filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
			.map(line => line.trim().replace(/^[•-]\s*/, ''))
			.slice(0, 5) // Top 5 insights
	}
}

// Common fallback responses
export const commonFallbacks = {
	searchAnalysis: {
		processedResults: 'Analysis failed to parse properly',
		keyInsights: ['Analysis completed with errors'],
		sourceCount: 0,
		searchType: 'web' as const,
	},
	marketAnalysis: {
		market_analysis_report: {
			trending_features: [],
			popular_styles: [],
			preferred_materials: [],
			archetype_brands: [],
			positive_trends: [],
			negative_trends: [],
			price_insights: {
				typical_range: 'Unable to determine',
				premium_features: [],
				value_drivers: [],
			},
			consumer_preferences: [],
			market_gaps: [],
			seasonal_trends: [],
			summary: 'Market analysis failed to parse properly',
		},
		confidence_level: 1,
		research_depth: 'Failed to parse response',
	},
	specGeneration: {
		chunks: [
			{
				generated_specs: {
					item_name: 'Parse Error',
					item_archetype: 'Unknown',
					spec_type: 'must-have' as const,
					recommended_specs: {
						material: null,
						color: null,
						dimensions: null,
						quantity: null,
						target_price_cny: null,
						customization_requirements: null,
						reference_images: null,
						reference_product_urls: null,
						reference_documents: null,
						number_of_selections: null,
						other_remarks: null,
					},
					product_specs: [],
					specifications_text: 'Failed to generate specifications',
				},
				reasoning: 'Failed to parse agent response as JSON',
			},
		],
		next_action: 'search' as const,
	},
}