import { z } from 'zod'

// Market Analysis Schema
export const marketAnalysisSchema = z.object({
	market_analysis_report: z
		.object({
			trending_features: z
				.array(z.string())
				.describe('Top trending features in the market'),
			popular_styles: z
				.array(z.string())
				.describe('Popular design styles and aesthetics'),
			preferred_materials: z
				.array(z.string())
				.describe('Preferred materials and compositions'),
			archetype_brands: z
				.array(
					z.object({
						brand_name: z.string(),
						position: z.string(),
						key_differentiators: z.array(z.string()),
					})
				)
				.describe('Key archetype brands and their positioning'),
			positive_trends: z
				.array(z.string())
				.describe('Positive market trends and opportunities'),
			negative_trends: z
				.array(z.string())
				.describe('Negative trends and challenges to avoid'),
			price_insights: z
				.object({
					typical_range: z.string(),
					premium_features: z.array(z.string()),
					value_drivers: z.array(z.string()),
				})
				.describe('Pricing insights and value drivers'),
			consumer_preferences: z
				.array(z.string())
				.describe('Key consumer preferences and behaviors'),
			market_gaps: z
				.array(z.string())
				.describe('Identified market gaps and opportunities'),
			seasonal_trends: z
				.array(z.string())
				.describe('Seasonal and temporal trends'),
			summary: z.string().describe('Executive summary of market analysis'),
		})
		.describe('Comprehensive market analysis report'),
	confidence_level: z
		.number()
		.min(1)
		.max(10)
		.describe('Confidence level in the analysis'),
	research_depth: z
		.string()
		.describe('Description of research depth and sources analyzed'),
})

// Specification Generation Schema
export const specGenAgentSchema = z.object({
	chunks: z
		.array(
			z
				.object({
					generated_specs: z.object({
						item_name: z
							.string()
							.describe(
								'Concise and descriptive product name for e-commerce in 2-3 words'
							),
						item_archetype: z
							.string()
							.describe(
								'Smallest subset that best contains the product, in 2-3 words'
							),
						spec_type: z
							.enum(['must-have', 'good-to-have', 'upsell'])
							.describe('Type of specifications'),
						recommended_specs: z
							.object({
								material: z.string().optional(),
								color: z.string().optional(),
								dimensions: z.string().optional(),
								quantity: z.number().optional(),
								target_price_cny: z.number().optional(),
								customization_requirements: z.string().optional(),
								reference_images: z.array(z.string()).optional(),
								reference_product_urls: z.array(z.string()).optional(),
								reference_documents: z.array(z.string()).optional(),
								number_of_selections: z.number().optional(),
								other_remarks: z.string().optional(),
							})
							.describe('Key product attributes and request information'),
						product_specs: z
							.array(
								z.object({
									spec_name: z.string(),
									spec_value: z.string(),
									required: z.boolean(),
									reference: z.string().optional(),
								})
							)
							.describe('Additional product-related specifications'),
						specifications_text: z
							.string()
							.describe('Human-readable summary of specifications'),
					}),
					reasoning: z
						.string()
						.describe('Explanation of the specification generation process'),
				})
				.describe(
					'Generated specifications for each product/item within the user request'
				)
		)
		.describe('Generated specifications for the full user request'),
	// Be lenient here because some models may return a sentence instead of the exact literal
	// Downstream always proceeds to search regardless
	next_action: z
		.string()
		.describe('Next action suggested by the agent; typically "search"'),
})

// Conversation Summary Schema
export const conversationSummarySchema = z.object({
	sourcing_requirements: z
		.object({
			item_name: z
				.string()
				.describe('Primary product or item name to be sourced'),
			description: z
				.string()
				.describe('Detailed description of the product requirements'),
			specifications: z
				.object({
					material: z
						.string()
						.optional()
						.describe('Required or preferred material'),
					dimensions: z
						.string()
						.optional()
						.describe('Size, dimensions, or measurements'),
					color: z
						.string()
						.optional()
						.describe('Color requirements or preferences'),
					quantity: z.number().optional().describe('Quantity needed'),
					quality_standards: z
						.string()
						.optional()
						.describe('Quality requirements or certifications'),
					customization: z
						.string()
						.optional()
						.describe('Customization requirements'),
				})
				.describe('Technical specifications and requirements'),
			commercial_requirements: z
				.object({
					target_price: z
						.number()
						.optional()
						.describe('Target price per unit in CNY'),
					price_range: z.string().optional().describe('Acceptable price range'),
					budget: z.number().optional().describe('Total budget available'),
					number_of_selections: z
						.number()
						.optional()
						.describe('Number of different options/suppliers needed'),
					minimum_order_quantity: z
						.number()
						.optional()
						.describe('Minimum order quantity requirements'),
					lead_time: z
						.string()
						.optional()
						.describe('Required delivery timeline'),
				})
				.describe('Commercial and procurement requirements'),
			additional_context: z
				.object({
					intended_use: z
						.string()
						.optional()
						.describe('How the product will be used'),
					target_market: z
						.string()
						.optional()
						.describe('Target market or customer base'),
					compliance_requirements: z
						.string()
						.optional()
						.describe('Regulatory or compliance needs'),
					packaging_requirements: z
						.string()
						.optional()
						.describe('Packaging specifications'),
					shipping_requirements: z
						.string()
						.optional()
						.describe('Shipping and logistics needs'),
				})
				.describe('Additional context and requirements'),
		})
		.describe(
			'Comprehensive sourcing requirements extracted from conversation'
		),
	confidence_level: z
		.number()
		.min(1)
		.max(10)
		.describe('Confidence level in the extracted requirements'),
	missing_information: z
		.array(z.string())
		.describe('Key information that might be missing and should be clarified'),
	next_recommended_action: z
		.enum([
			'clarify_requirements',
			'generate_specs',
			'search_suppliers',
			'market_analysis',
		])
		.describe('Recommended next step in the sourcing process'),
})

// Search Result Schema
export const searchResultSchema = z.object({
	query: z.string(),
	searchType: z.enum(['web', 'shopping']),
	results: z.array(
		z.object({
			title: z.string(),
			link: z.string(),
			snippet: z.string(),
			position: z.number(),
			source: z.enum(['web', 'shopping']),
		})
	),
	totalResults: z.number(),
	formattedSummary: z.string(),
	relatedQueries: z.array(z.string()).optional(),
})

// Search Analysis Schema
export const searchAnalysisSchema = z.object({
	processedResults: z.string(),
	keyInsights: z.array(z.string()),
	sourceCount: z.number(),
	searchType: z.enum(['web', 'shopping', '1688', '1688-en', 'alibaba']),
})

// Product Processing Report Schema
export const ProductProcessingReportSchema = z.object({
	product_id: z.string(),
	product_title: z.string(),
	spec_matching_analysis: z.object({
		score: z.number(),
		reason: z.array(z.string()),
		item_match: z.boolean(),
		partial_match: z.boolean(),
		type: z.string().optional(),
		spec_scores: z.array(
			z.object({
				spec_name: z.string(),
				product_value: z.string().optional(),
				spec_value: z.string(),
				is_satisfied: z.enum(['true', 'false', 'unknown']),
				is_spec_required: z.boolean(),
			})
		),
		detailed_analysis: z.string(),
	}),
	quality_assessment: z.object({
		quality_score: z.number().min(0).max(100),
		supplier_rating: z.number().min(0).max(5).optional(),
		certifications: z.array(z.string()),
		quality_indicators: z.string(),
	}),
	price_analysis: z.object({
		price_competitiveness: z.number().min(0).max(100),
		value_proposition: z.string(),
		bulk_pricing_available: z.boolean(),
		price_breakdown: z.string(),
	}),
	supplier_evaluation: z.object({
		reliability_score: z.number().min(0).max(100),
		location: z.string(),
		company_info: z.string(),
		communication_quality: z.string(),
	}),
	risk_assessment: z.object({
		risk_level: z.enum(['low', 'medium', 'high']),
		identified_risks: z.array(z.string()),
		mitigation_strategies: z.array(z.string()),
		red_flags: z.array(z.string()),
	}),
	recommendation: z.object({
		overall_recommendation: z.enum([
			'highly_recommended',
			'recommended',
			'consider',
			'not_recommended',
		]),
		key_strengths: z.array(z.string()),
		key_weaknesses: z.array(z.string()),
		procurement_considerations: z.string(),
	}),
	processing_metadata: z.object({
		processing_time_ms: z.number(),
		api_source: z.string(),
		has_detailed_specs: z.boolean(),
		error_occurred: z.boolean(),
		error_message: z.string().optional(),
	}),
})
