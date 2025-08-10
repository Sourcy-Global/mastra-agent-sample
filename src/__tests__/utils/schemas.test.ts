import { describe, it, expect } from 'vitest'
import {
	marketAnalysisSchema,
	specGenAgentSchema,
	conversationSummarySchema,
	searchResultSchema,
	searchAnalysisSchema,
	ProductProcessingReportSchema,
} from '../../utils/schemas'

describe('Zod Schema Tests', () => {
	describe('marketAnalysisSchema', () => {
		const validMarketAnalysis = {
			market_analysis_report: {
				trending_features: ['Feature 1', 'Feature 2'],
				popular_styles: ['Modern', 'Minimalist'],
				preferred_materials: ['Cotton', 'Polyester'],
				archetype_brands: [
					{
						brand_name: 'Brand A',
						position: 'Premium',
						key_differentiators: ['Quality', 'Design'],
					},
				],
				positive_trends: ['Sustainability', 'Customization'],
				negative_trends: ['Fast fashion', 'Overproduction'],
				price_insights: {
					typical_range: '$10-50',
					premium_features: ['Eco-friendly', 'Handmade'],
					value_drivers: ['Quality', 'Brand reputation'],
				},
				consumer_preferences: ['Durability', 'Aesthetics'],
				market_gaps: ['Affordable luxury', 'Size inclusivity'],
				seasonal_trends: ['Spring colors', 'Summer fabrics'],
				summary: 'Market shows strong demand for sustainable products',
			},
			confidence_level: 8,
			research_depth: 'Analyzed 10+ sources including industry reports',
		}

		it('should validate complete valid market analysis', () => {
			expect(() => marketAnalysisSchema.parse(validMarketAnalysis)).not.toThrow()
		})

		it('should require all top-level fields', () => {
			const incomplete = { ...validMarketAnalysis }
			delete incomplete.confidence_level
			expect(() => marketAnalysisSchema.parse(incomplete)).toThrow()
		})

		it('should validate confidence_level range (1-10)', () => {
			expect(() =>
				marketAnalysisSchema.parse({
					...validMarketAnalysis,
					confidence_level: 0,
				})
			).toThrow()
			expect(() =>
				marketAnalysisSchema.parse({
					...validMarketAnalysis,
					confidence_level: 11,
				})
			).toThrow()
			expect(() =>
				marketAnalysisSchema.parse({
					...validMarketAnalysis,
					confidence_level: 5,
				})
			).not.toThrow()
		})

		it('should validate archetype_brands structure', () => {
			const invalidBrand = {
				...validMarketAnalysis,
				market_analysis_report: {
					...validMarketAnalysis.market_analysis_report,
					archetype_brands: [{ brand_name: 'Test' }], // missing required fields
				},
			}
			expect(() => marketAnalysisSchema.parse(invalidBrand)).toThrow()
		})

		it('should validate price_insights structure', () => {
			const invalidPriceInsights = {
				...validMarketAnalysis,
				market_analysis_report: {
					...validMarketAnalysis.market_analysis_report,
					price_insights: {
						typical_range: '$10-50',
						// missing premium_features and value_drivers
					},
				},
			}
			expect(() => marketAnalysisSchema.parse(invalidPriceInsights)).toThrow()
		})

		it('should accept empty arrays for optional fields', () => {
			const withEmptyArrays = {
				...validMarketAnalysis,
				market_analysis_report: {
					...validMarketAnalysis.market_analysis_report,
					trending_features: [],
					popular_styles: [],
				},
			}
			expect(() => marketAnalysisSchema.parse(withEmptyArrays)).not.toThrow()
		})
	})

	describe('specGenAgentSchema', () => {
		const validSpecGenOutput = {
			chunks: [
				{
					generated_specs: {
						item_name: 'Cotton T-Shirt',
						item_archetype: 'Apparel',
						spec_type: 'must-have' as const,
						recommended_specs: {
							material: 'Cotton',
							color: 'White',
							dimensions: 'L',
							quantity: 100,
							target_price_cny: 25,
						},
						product_specs: [
							{
								spec_name: 'GSM',
								spec_value: '180',
								required: true,
							},
						],
						specifications_text: 'White cotton t-shirt, size L, 180 GSM',
					},
					reasoning: 'Based on user requirements for basic cotton apparel',
				},
			],
			next_action: 'search',
		}

		it('should validate complete valid spec generation output', () => {
			expect(() => specGenAgentSchema.parse(validSpecGenOutput)).not.toThrow()
		})

		it('should require chunks array', () => {
			const withoutChunks = { ...validSpecGenOutput }
			delete withoutChunks.chunks
			expect(() => specGenAgentSchema.parse(withoutChunks)).toThrow()
		})

		it('should validate spec_type enum values', () => {
			const invalidSpecType = {
				...validSpecGenOutput,
				chunks: [
					{
						...validSpecGenOutput.chunks[0],
						generated_specs: {
							...validSpecGenOutput.chunks[0].generated_specs,
							spec_type: 'invalid-type',
						},
					},
				],
			}
			expect(() => specGenAgentSchema.parse(invalidSpecType)).toThrow()

			const validTypes = ['must-have', 'good-to-have', 'upsell']
			validTypes.forEach((type) => {
				const withValidType = {
					...validSpecGenOutput,
					chunks: [
						{
							...validSpecGenOutput.chunks[0],
							generated_specs: {
								...validSpecGenOutput.chunks[0].generated_specs,
								spec_type: type,
							},
						},
					],
				}
				expect(() => specGenAgentSchema.parse(withValidType)).not.toThrow()
			})
		})

		it('should validate recommended_specs with optional fields', () => {
			const withMinimalSpecs = {
				...validSpecGenOutput,
				chunks: [
					{
						...validSpecGenOutput.chunks[0],
						generated_specs: {
							...validSpecGenOutput.chunks[0].generated_specs,
							recommended_specs: {}, // all fields are optional
						},
					},
				],
			}
			expect(() => specGenAgentSchema.parse(withMinimalSpecs)).not.toThrow()
		})

		it('should validate product_specs structure', () => {
			const invalidProductSpec = {
				...validSpecGenOutput,
				chunks: [
					{
						...validSpecGenOutput.chunks[0],
						generated_specs: {
							...validSpecGenOutput.chunks[0].generated_specs,
							product_specs: [
								{
									spec_name: 'GSM',
									// missing spec_value and required
								},
							],
						},
					},
				],
			}
			expect(() => specGenAgentSchema.parse(invalidProductSpec)).toThrow()
		})

		it('should accept next_action as string (lenient validation)', () => {
			const withStringAction = {
				...validSpecGenOutput,
				next_action: 'continue to search phase',
			}
			expect(() => specGenAgentSchema.parse(withStringAction)).not.toThrow()
		})

		it('should handle multiple chunks', () => {
			const multipleChunks = {
				...validSpecGenOutput,
				chunks: [
					...validSpecGenOutput.chunks,
					{
						generated_specs: {
							item_name: 'Cotton Pants',
							item_archetype: 'Apparel',
							spec_type: 'good-to-have' as const,
							recommended_specs: {
								material: 'Cotton',
								color: 'Blue',
							},
							product_specs: [],
							specifications_text: 'Blue cotton pants',
						},
						reasoning: 'Additional item in user request',
					},
				],
			}
			expect(() => specGenAgentSchema.parse(multipleChunks)).not.toThrow()
		})
	})

	describe('conversationSummarySchema', () => {
		const validConversationSummary = {
			sourcing_requirements: {
				item_name: 'Custom T-Shirts',
				description: 'Cotton t-shirts for promotional use',
				specifications: {
					material: 'Cotton',
					dimensions: 'Various sizes (S-XL)',
					color: 'White and Black',
					quantity: 500,
					quality_standards: 'Standard quality',
					customization: 'Screen printing logo',
				},
				commercial_requirements: {
					target_price: 15.5,
					price_range: '$12-20',
					budget: 7750,
					number_of_selections: 2,
					minimum_order_quantity: 100,
					lead_time: '2 weeks',
				},
				additional_context: {
					intended_use: 'Corporate promotional items',
					target_market: 'B2B clients',
					compliance_requirements: 'CE marking',
					packaging_requirements: 'Individual poly bags',
					shipping_requirements: 'Express shipping',
				},
			},
			confidence_level: 9,
			missing_information: ['Exact logo specifications', 'Shipping address'],
			next_recommended_action: 'generate_specs' as const,
		}

		it('should validate complete valid conversation summary', () => {
			expect(() =>
				conversationSummarySchema.parse(validConversationSummary)
			).not.toThrow()
		})

		it('should require top-level fields', () => {
			const incomplete = { ...validConversationSummary }
			delete incomplete.confidence_level
			expect(() => conversationSummarySchema.parse(incomplete)).toThrow()
		})

		it('should validate confidence_level range (1-10)', () => {
			expect(() =>
				conversationSummarySchema.parse({
					...validConversationSummary,
					confidence_level: 0,
				})
			).toThrow()
			expect(() =>
				conversationSummarySchema.parse({
					...validConversationSummary,
					confidence_level: 11,
				})
			).toThrow()
		})

		it('should validate next_recommended_action enum', () => {
			const validActions = [
				'clarify_requirements',
				'generate_specs',
				'search_suppliers',
				'market_analysis',
			]

			validActions.forEach((action) => {
				expect(() =>
					conversationSummarySchema.parse({
						...validConversationSummary,
						next_recommended_action: action,
					})
				).not.toThrow()
			})

			expect(() =>
				conversationSummarySchema.parse({
					...validConversationSummary,
					next_recommended_action: 'invalid_action',
				})
			).toThrow()
		})

		it('should handle optional fields in specifications', () => {
			const minimalSpecs = {
				...validConversationSummary,
				sourcing_requirements: {
					...validConversationSummary.sourcing_requirements,
					specifications: {}, // all fields are optional
				},
			}
			expect(() => conversationSummarySchema.parse(minimalSpecs)).not.toThrow()
		})

		it('should handle optional fields in commercial_requirements', () => {
			const minimalCommercial = {
				...validConversationSummary,
				sourcing_requirements: {
					...validConversationSummary.sourcing_requirements,
					commercial_requirements: {}, // all fields are optional
				},
			}
			expect(() =>
				conversationSummarySchema.parse(minimalCommercial)
			).not.toThrow()
		})

		it('should handle optional additional_context fields', () => {
			const minimalContext = {
				...validConversationSummary,
				sourcing_requirements: {
					...validConversationSummary.sourcing_requirements,
					additional_context: {}, // all fields are optional
				},
			}
			expect(() => conversationSummarySchema.parse(minimalContext)).not.toThrow()
		})
	})

	describe('searchResultSchema', () => {
		const validSearchResult = {
			query: 'cotton t-shirts',
			searchType: 'web' as const,
			results: [
				{
					title: 'Cotton T-Shirts - Best Quality',
					link: 'https://example.com/product1',
					snippet: 'High quality cotton t-shirts available in various sizes',
					position: 1,
					source: 'web' as const,
				},
			],
			totalResults: 1,
			formattedSummary: 'Found 1 result for cotton t-shirts',
			relatedQueries: ['cotton shirts', 'quality t-shirts'],
		}

		it('should validate complete valid search result', () => {
			expect(() => searchResultSchema.parse(validSearchResult)).not.toThrow()
		})

		it('should validate searchType enum', () => {
			const validSearchTypes = ['web', 'shopping']
			validSearchTypes.forEach((type) => {
				expect(() =>
					searchResultSchema.parse({
						...validSearchResult,
						searchType: type,
					})
				).not.toThrow()
			})

			expect(() =>
				searchResultSchema.parse({
					...validSearchResult,
					searchType: 'invalid',
				})
			).toThrow()
		})

		it('should validate source enum in results', () => {
			const validSources = ['web', 'shopping']
			validSources.forEach((source) => {
				expect(() =>
					searchResultSchema.parse({
						...validSearchResult,
						results: [
							{
								...validSearchResult.results[0],
								source,
							},
						],
					})
				).not.toThrow()
			})
		})

		it('should handle optional relatedQueries', () => {
			const withoutRelatedQueries = { ...validSearchResult }
			delete withoutRelatedQueries.relatedQueries
			expect(() => searchResultSchema.parse(withoutRelatedQueries)).not.toThrow()
		})

		it('should handle empty results array', () => {
			const emptyResults = {
				...validSearchResult,
				results: [],
				totalResults: 0,
			}
			expect(() => searchResultSchema.parse(emptyResults)).not.toThrow()
		})
	})

	describe('searchAnalysisSchema', () => {
		const validSearchAnalysis = {
			processedResults: 'Analysis of cotton t-shirt search results',
			keyInsights: ['High demand for organic cotton', 'Price range $10-30'],
			sourceCount: 15,
			searchType: '1688-en' as const,
		}

		it('should validate complete valid search analysis', () => {
			expect(() => searchAnalysisSchema.parse(validSearchAnalysis)).not.toThrow()
		})

		it('should validate extended searchType enum', () => {
			const validSearchTypes = ['web', 'shopping', '1688', '1688-en', 'alibaba']
			validSearchTypes.forEach((type) => {
				expect(() =>
					searchAnalysisSchema.parse({
						...validSearchAnalysis,
						searchType: type,
					})
				).not.toThrow()
			})

			expect(() =>
				searchAnalysisSchema.parse({
					...validSearchAnalysis,
					searchType: 'invalid',
				})
			).toThrow()
		})

		it('should handle empty keyInsights array', () => {
			const emptyInsights = {
				...validSearchAnalysis,
				keyInsights: [],
			}
			expect(() => searchAnalysisSchema.parse(emptyInsights)).not.toThrow()
		})

		it('should require all fields', () => {
			const incomplete = { ...validSearchAnalysis }
			delete incomplete.sourceCount
			expect(() => searchAnalysisSchema.parse(incomplete)).toThrow()
		})
	})

	describe('ProductProcessingReportSchema', () => {
		const validProductReport = {
			product_id: 'prod_123',
			product_title: 'High Quality Cotton T-Shirt',
			spec_matching_analysis: {
				score: 85,
				reason: ['Good material match', 'Price within range'],
				item_match: true,
				partial_match: false,
				type: 'apparel',
				spec_scores: [
					{
						spec_name: 'Material',
						product_value: 'Cotton',
						spec_value: 'Cotton',
						is_satisfied: 'true' as const,
						is_spec_required: true,
					},
				],
				detailed_analysis: 'Product matches most requirements with good quality',
			},
			quality_assessment: {
				quality_score: 78,
				supplier_rating: 4.2,
				certifications: ['ISO 9001', 'OEKO-TEX'],
				quality_indicators: 'Good reviews and certifications',
			},
			price_analysis: {
				price_competitiveness: 82,
				value_proposition: 'Good value for quality offered',
				bulk_pricing_available: true,
				price_breakdown: 'Base price $12, bulk discount 10%',
			},
			supplier_evaluation: {
				reliability_score: 88,
				location: 'Guangzhou, China',
				company_info: '5 years in business, 100+ employees',
				communication_quality: 'Excellent English, responsive',
			},
			risk_assessment: {
				risk_level: 'low' as const,
				identified_risks: ['Currency fluctuation'],
				mitigation_strategies: ['Fixed price contract'],
				red_flags: [],
			},
			recommendation: {
				overall_recommendation: 'recommended' as const,
				key_strengths: ['Quality', 'Price', 'Reliability'],
				key_weaknesses: ['Limited color options'],
				procurement_considerations: 'Consider bulk order for better pricing',
			},
			processing_metadata: {
				processing_time_ms: 1250,
				api_source: 'spec-matching-agent',
				has_detailed_specs: true,
				error_occurred: false,
			},
		}

		it('should validate complete valid product report', () => {
			expect(() =>
				ProductProcessingReportSchema.parse(validProductReport)
			).not.toThrow()
		})

		it('should validate quality_score range (0-100)', () => {
			expect(() =>
				ProductProcessingReportSchema.parse({
					...validProductReport,
					quality_assessment: {
						...validProductReport.quality_assessment,
						quality_score: 101,
					},
				})
			).toThrow()

			expect(() =>
				ProductProcessingReportSchema.parse({
					...validProductReport,
					quality_assessment: {
						...validProductReport.quality_assessment,
						quality_score: -1,
					},
				})
			).toThrow()
		})

		it('should validate supplier_rating range (0-5)', () => {
			expect(() =>
				ProductProcessingReportSchema.parse({
					...validProductReport,
					quality_assessment: {
						...validProductReport.quality_assessment,
						supplier_rating: 5.1,
					},
				})
			).toThrow()

			expect(() =>
				ProductProcessingReportSchema.parse({
					...validProductReport,
					quality_assessment: {
						...validProductReport.quality_assessment,
						supplier_rating: undefined, // optional field
					},
				})
			).not.toThrow()
		})

		it('should validate risk_level enum', () => {
			const validRiskLevels = ['low', 'medium', 'high']
			validRiskLevels.forEach((level) => {
				expect(() =>
					ProductProcessingReportSchema.parse({
						...validProductReport,
						risk_assessment: {
							...validProductReport.risk_assessment,
							risk_level: level,
						},
					})
				).not.toThrow()
			})

			expect(() =>
				ProductProcessingReportSchema.parse({
					...validProductReport,
					risk_assessment: {
						...validProductReport.risk_assessment,
						risk_level: 'invalid',
					},
				})
			).toThrow()
		})

		it('should validate overall_recommendation enum', () => {
			const validRecommendations = [
				'highly_recommended',
				'recommended',
				'consider',
				'not_recommended',
			]
			validRecommendations.forEach((rec) => {
				expect(() =>
					ProductProcessingReportSchema.parse({
						...validProductReport,
						recommendation: {
							...validProductReport.recommendation,
							overall_recommendation: rec,
						},
					})
				).not.toThrow()
			})
		})

		it('should validate is_satisfied enum in spec_scores', () => {
			const validSatisfactionValues = ['true', 'false', 'unknown']
			validSatisfactionValues.forEach((value) => {
				expect(() =>
					ProductProcessingReportSchema.parse({
						...validProductReport,
						spec_matching_analysis: {
							...validProductReport.spec_matching_analysis,
							spec_scores: [
								{
									...validProductReport.spec_matching_analysis.spec_scores[0],
									is_satisfied: value,
								},
							],
						},
					})
				).not.toThrow()
			})
		})

		it('should handle optional error_message field', () => {
			const withErrorMessage = {
				...validProductReport,
				processing_metadata: {
					...validProductReport.processing_metadata,
					error_occurred: true,
					error_message: 'Connection timeout',
				},
			}
			expect(() =>
				ProductProcessingReportSchema.parse(withErrorMessage)
			).not.toThrow()

			const withoutErrorMessage = {
				...validProductReport,
				processing_metadata: {
					...validProductReport.processing_metadata,
					error_occurred: false,
					// error_message is optional
				},
			}
			expect(() =>
				ProductProcessingReportSchema.parse(withoutErrorMessage)
			).not.toThrow()
		})

		it('should handle optional type and product_value fields', () => {
			const withOptionalFields = {
				...validProductReport,
				spec_matching_analysis: {
					...validProductReport.spec_matching_analysis,
					type: undefined, // optional
					spec_scores: [
						{
							...validProductReport.spec_matching_analysis.spec_scores[0],
							product_value: undefined, // optional
						},
					],
				},
			}
			expect(() =>
				ProductProcessingReportSchema.parse(withOptionalFields)
			).not.toThrow()
		})
	})
})