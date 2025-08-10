import { describe, it, expect } from 'vitest'
import { sourcingBotOutputSchema } from '../../workflows/sourcing-bot-workflow'

describe('Sourcing Bot Workflow Schemas', () => {
	describe('sourcingBotOutputSchema', () => {
		const validSourcingBotOutput = {
			userRequest: 'I need 100 cotton t-shirts for my company event',
			trend_sensitive: false,
			reasoning: 'Detected functional/industrial keywords',
			market_context: 'Cotton t-shirt market shows stable demand',
			plan_summary: 'Find reliable suppliers for corporate t-shirts',
			suggested_queries: [
				'corporate cotton t-shirts bulk',
				'custom t-shirts printing',
				'wholesale cotton apparel',
			],
			sourcing_plan: {
				objectives: [
					'Find bulk cotton t-shirt suppliers',
					'Compare pricing for custom printing',
					'Evaluate delivery timelines',
				],
				steps: [
					{
						id: '1',
						title: 'Supplier Search',
						detail: 'Search 1688 and Alibaba for cotton t-shirt suppliers',
						owner: 'agent',
						dependencies: [],
					},
					{
						id: '2',
						title: 'Quote Comparison',
						detail: 'Compare quotes from multiple suppliers',
						owner: 'agent',
						dependencies: ['1'],
					},
					{
						id: '3',
						title: 'Supplier Evaluation',
						detail: 'Evaluate supplier reliability and quality',
						owner: 'agent',
						dependencies: ['2'],
					},
				],
				data_to_collect: ['MOQ', 'Lead time', 'Printing costs'],
				tools_to_use: ['1688 search', 'Alibaba search'],
				risks: ['Quality issues', 'Delivery delays'],
				success_metrics: ['Find 3+ suppliers', 'Price under $15 CNY'],
			},
			search_results: {
				processedResults: 'Found 15 cotton t-shirt suppliers with competitive pricing',
				keyInsights: [
					'Average price range: $8-12 CNY per piece',
					'MOQ typically 50-100 pieces',
					'Lead time 7-14 days for bulk orders',
				],
				sourceCount: 15,
				searchType: '1688-en',
			},
		}

		it('should validate complete valid sourcing bot output', () => {
			expect(() =>
				sourcingBotOutputSchema.parse(validSourcingBotOutput)
			).not.toThrow()
		})

		it('should require all top-level fields except optional ones', () => {
			// Test required fields
			const requiredFields = [
				'userRequest',
				'trend_sensitive',
				'reasoning',
				'plan_summary',
				'suggested_queries',
				'sourcing_plan',
				'search_results',
			]

			requiredFields.forEach((field) => {
				const incomplete = { ...validSourcingBotOutput }
				delete incomplete[field as keyof typeof incomplete]
				expect(() => sourcingBotOutputSchema.parse(incomplete)).toThrow()
			})
		})

		it('should allow optional market_context', () => {
			const withoutMarketContext = { ...validSourcingBotOutput }
			delete withoutMarketContext.market_context

			expect(() =>
				sourcingBotOutputSchema.parse(withoutMarketContext)
			).not.toThrow()

			// Should also work with undefined
			const withUndefinedContext = {
				...validSourcingBotOutput,
				market_context: undefined,
			}
			expect(() =>
				sourcingBotOutputSchema.parse(withUndefinedContext)
			).not.toThrow()
		})

		it('should validate trend_sensitive as boolean', () => {
			expect(() =>
				sourcingBotOutputSchema.parse({
					...validSourcingBotOutput,
					trend_sensitive: 'true', // string instead of boolean
				})
			).toThrow()

			expect(() =>
				sourcingBotOutputSchema.parse({
					...validSourcingBotOutput,
					trend_sensitive: true,
				})
			).not.toThrow()

			expect(() =>
				sourcingBotOutputSchema.parse({
					...validSourcingBotOutput,
					trend_sensitive: false,
				})
			).not.toThrow()
		})

		it('should validate suggested_queries as string array', () => {
			expect(() =>
				sourcingBotOutputSchema.parse({
					...validSourcingBotOutput,
					suggested_queries: ['valid', 'array'],
				})
			).not.toThrow()

			expect(() =>
				sourcingBotOutputSchema.parse({
					...validSourcingBotOutput,
					suggested_queries: [],
				})
			).not.toThrow()

			expect(() =>
				sourcingBotOutputSchema.parse({
					...validSourcingBotOutput,
					suggested_queries: 'not an array',
				})
			).toThrow()

			expect(() =>
				sourcingBotOutputSchema.parse({
					...validSourcingBotOutput,
					suggested_queries: [123, 456], // numbers instead of strings
				})
			).toThrow()
		})

		it('should validate sourcing_plan structure', () => {
			const invalidSourcingPlan = {
				...validSourcingBotOutput,
				sourcing_plan: {
					objectives: ['Find suppliers'],
					// missing required steps field
					data_to_collect: [],
					tools_to_use: [],
					risks: [],
					success_metrics: [],
				},
			}
			expect(() => sourcingBotOutputSchema.parse(invalidSourcingPlan)).toThrow()
		})

		it('should validate search_results structure', () => {
			const invalidSearchResults = {
				...validSourcingBotOutput,
				search_results: {
					processedResults: 'Results found',
					keyInsights: ['Insight 1'],
					// missing required sourceCount and searchType
				},
			}
			expect(() =>
				sourcingBotOutputSchema.parse(invalidSearchResults)
			).toThrow()
		})

		it('should validate search_results searchType enum', () => {
			const validSearchTypes = ['web', 'shopping', '1688', '1688-en', 'alibaba']
			
			validSearchTypes.forEach((searchType) => {
				expect(() =>
					sourcingBotOutputSchema.parse({
						...validSourcingBotOutput,
						search_results: {
							...validSourcingBotOutput.search_results,
							searchType,
						},
					})
				).not.toThrow()
			})

			expect(() =>
				sourcingBotOutputSchema.parse({
					...validSourcingBotOutput,
					search_results: {
						...validSourcingBotOutput.search_results,
						searchType: 'invalid-type',
					},
				})
			).toThrow()
		})

		it('should handle complex nested structures', () => {
			const complexOutput = {
				...validSourcingBotOutput,
				sourcing_plan: {
					objectives: [
						'Primary objective 1',
						'Primary objective 2',
						'Secondary objective',
					],
					steps: [
						{
							id: 'step-1',
							title: 'Initial Research Phase',
							detail: 'Comprehensive market research including competitor analysis',
							owner: 'agent',
							dependencies: [],
						},
						{
							id: 'step-2',
							title: 'Supplier Discovery',
							detail: 'Multi-platform supplier search across 1688, Alibaba, and web',
							owner: 'agent',
							dependencies: ['step-1'],
						},
						{
							id: 'step-3',
							title: 'Quality Assessment',
							detail: 'Evaluate supplier credentials and product quality',
							owner: 'human',
							dependencies: ['step-2'],
						},
						{
							id: 'step-4',
							title: 'Final Selection',
							detail: 'Make final supplier selection based on all criteria',
							owner: 'human',
							dependencies: ['step-2', 'step-3'],
						},
					],
					data_to_collect: [
						'Supplier certifications',
						'Product samples',
						'Pricing tiers',
						'Payment terms',
						'Shipping options',
					],
					tools_to_use: [
						'1688 Chinese search',
						'1688 English search',
						'Alibaba international search',
						'Google web search',
					],
					risks: [
						'Supplier reliability concerns',
						'Quality control issues',
						'Communication barriers',
						'Currency fluctuation',
						'Shipping delays',
					],
					success_metrics: [
						'Identify 5+ qualified suppliers',
						'Achieve target price point',
						'Confirm quality standards',
						'Establish reliable communication',
					],
				},
				search_results: {
					processedResults: 'Comprehensive analysis of 25 suppliers across multiple platforms',
					keyInsights: [
						'1688 offers best pricing for bulk orders (15-20% lower)',
						'Alibaba suppliers have better English communication',
						'Quality certifications more common in Alibaba listings',
						'Average MOQ is 100 pieces across platforms',
						'Lead times vary from 7-21 days depending on customization',
					],
					sourceCount: 25,
					searchType: 'alibaba',
				},
			}

			expect(() => sourcingBotOutputSchema.parse(complexOutput)).not.toThrow()
		})

		it('should handle minimal valid output', () => {
			const minimalOutput = {
				userRequest: 'Need basic t-shirts',
				trend_sensitive: false,
				reasoning: 'Basic requirement',
				plan_summary: 'Find suppliers',
				suggested_queries: [],
				sourcing_plan: {
					objectives: [],
					steps: [
						{ id: '1', title: 'Step 1', detail: 'Detail 1' },
						{ id: '2', title: 'Step 2', detail: 'Detail 2' },
						{ id: '3', title: 'Step 3', detail: 'Detail 3' },
					],
					data_to_collect: [],
					tools_to_use: [],
					risks: [],
					success_metrics: [],
				},
				search_results: {
					processedResults: 'No results found',
					keyInsights: [],
					sourceCount: 0,
					searchType: 'web',
				},
			}

			expect(() => sourcingBotOutputSchema.parse(minimalOutput)).not.toThrow()
		})
	})
})