import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { demandAgent } from '../agents/demand-agent'
import { planningStep, sourcingPlanSchema } from './planning-workflow'
import {
	specGenAgentSchema,
	marketAnalysisSchema,
	searchAnalysisSchema,
} from '../utils/schemas'
import { processAgentResponse } from '../utils/workflow-functions'
// Accept both raw spec object and agent-wrapped object shape
const AgentWrappedSpecSchema = z
	.object({ object: specGenAgentSchema })
	.passthrough()
import { specGenAgent } from '../agents/spec-gen-agent'

const analyzeAndGenerateSpecs = createStep({
	id: 'analyze-and-generate-specs',
	description:
		'Analyzes trend sensitivity and generates specs with market context if needed',
	inputSchema: z.object({
		userRequest: z.string(),
		trend_sensitive: z.boolean(),
		reasoning: z.string(),
		market_context: z.string().optional(),
		plan_summary: z.string(),
		suggested_queries: z.array(z.string()),
		sourcing_plan: sourcingPlanSchema,
	}),
	outputSchema: z.object({
		userRequest: z.string(),
		trend_sensitive: z.boolean(),
		reasoning: z.string(),
		market_context: z.string().optional(),
		plan_summary: z.string(),
		suggested_queries: z.array(z.string()),
		sourcing_plan: sourcingPlanSchema,
		specs: AgentWrappedSpecSchema,
	}),
	execute: async ({ inputData }) => {
		if (!inputData) throw new Error('Input data not found')

		// Get market context for trend-sensitive requests
		let marketContext = inputData.market_context || ''
		if (inputData.trend_sensitive && !marketContext) {
			try {
				const analysis = await processAgentResponse(
					{
						agent: demandAgent,
						schema: marketAnalysisSchema,
						fallback: {
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
								summary: 'Failed to conduct market analysis',
							},
							confidence_level: 1,
							research_depth: 'Analysis failed',
						},
						showOutput: false,
					},
					`Conduct market analysis for: ${inputData.userRequest}`
				)
				marketContext = (analysis as any)?.market_analysis_report?.summary || ''
			} catch (error) {
				marketContext = ''
			}
		}

		// Generate specifications
		const prompt = `User Request: ${inputData.userRequest}
${marketContext ? `\nMarket Context: ${marketContext}` : ''}

Generate comprehensive product specifications for sourcing. Include item names, archetypes, and detailed specs.`

		const specs = await processAgentResponse(
			{
				agent: specGenAgent,
				schema: specGenAgentSchema,
				fallback: {
					chunks: [
						{
							generated_specs: {
								item_name: 'Unknown Product',
								item_archetype: 'Unknown',
								spec_type: 'must-have' as const,
								recommended_specs: {},
								product_specs: [],
								specifications_text: 'Failed to generate specifications',
							},
							reasoning: 'Specification generation failed',
						},
					],
					next_action: 'search' as const,
				},
				showOutput: true,
			},
			prompt
		)

		return {
			userRequest: inputData.userRequest,
			trend_sensitive: inputData.trend_sensitive,
			reasoning: inputData.reasoning,
			market_context: inputData.market_context,
			plan_summary: inputData.plan_summary,
			suggested_queries: inputData.suggested_queries,
			sourcing_plan: inputData.sourcing_plan,
			specs: { object: specs } as any,
		}
	},
})

// Enhanced output schema that includes all planning data plus search results
const sourcingBotOutputSchema = z.object({
	userRequest: z.string(),
	trend_sensitive: z.boolean(),
	reasoning: z.string(),
	market_context: z.string().optional(),
	plan_summary: z.string(),
	suggested_queries: z.array(z.string()),
	sourcing_plan: sourcingPlanSchema,
	search_results: searchAnalysisSchema,
})

const sourcingBotWorkflow = createWorkflow({
	id: 'sourcing-bot',
	inputSchema: z.object({
		userRequest: z.string().describe('Original sourcing request to process'),
		minShortlist: z.number().default(5),
	}),
	outputSchema: sourcingBotOutputSchema,
})


// Update the runSearch step to maintain the context
const enhancedRunSearch = createStep({
	id: 'enhanced-run-search',
	description: 'Runs search and combines with planning context',
	inputSchema: z.object({
		query: z.string(),
		searchType: z.enum(['1688', '1688-en', 'alibaba']).optional().default('1688-en'),
		maxResults: z.number().optional().default(10),
		// Context from previous steps
		userRequest: z.string(),
		trend_sensitive: z.boolean(),
		reasoning: z.string(),
		market_context: z.string().optional(),
		plan_summary: z.string(),
		suggested_queries: z.array(z.string()),
		sourcing_plan: sourcingPlanSchema,
	}),
	outputSchema: sourcingBotOutputSchema,
	execute: async ({ inputData }) => {
		if (!inputData) throw new Error('Input data not found')
		
		const { query, searchType, maxResults = 10, ...planningData } = inputData
		const prompt = `Search for products related to: "${query}"

Use ${searchType || '1688-en'} search with up to ${maxResults} results. Provide comprehensive analysis including:
- Product availability and variety
- Price ranges and supplier information
- Key features and specifications
- Market insights and recommendations`

		const fallbackResult: z.infer<typeof searchAnalysisSchema> = {
			processedResults: `Failed to search for "${query}"`,
			keyInsights: [],
			sourceCount: 0,
			searchType: 'shopping',
		}
		
		const searchResults = await processAgentResponse(
			{
				agent: (await import('../agents/search-agent')).searchAgent,
				schema: searchAnalysisSchema,
				fallback: fallbackResult,
				showOutput: true,
			},
			prompt
		)
		
		return {
			...planningData,
			search_results: searchResults,
		}
	},
})

// Update prepareSearchQuery to pass through all context
const enhancedPrepareSearchQuery = createStep({
	id: 'enhanced-prepare-search-query',
	description: 'Converts specs to search query while preserving context',
	inputSchema: z.object({
		userRequest: z.string(),
		trend_sensitive: z.boolean(),
		reasoning: z.string(),
		market_context: z.string().optional(),
		plan_summary: z.string(),
		suggested_queries: z.array(z.string()),
		sourcing_plan: sourcingPlanSchema,
		specs: AgentWrappedSpecSchema,
	}),
	outputSchema: z.object({
		query: z.string(),
		searchType: z.enum(['1688', '1688-en', 'alibaba']).optional().default('1688-en'),
		maxResults: z.number().optional().default(10),
		// Pass through all planning context
		userRequest: z.string(),
		trend_sensitive: z.boolean(),
		reasoning: z.string(),
		market_context: z.string().optional(),
		plan_summary: z.string(),
		suggested_queries: z.array(z.string()),
		sourcing_plan: sourcingPlanSchema,
	}),
	execute: async ({ inputData }) => {
		if (!inputData) throw new Error('Input data not found')

		// Extract comprehensive specs for search (support wrapped/unwrapped shapes)
		const container: any = inputData.specs as any
		const chunks = container?.object?.chunks || container?.chunks || []
		const firstSpec = chunks?.[0]?.generated_specs || null
		const itemName = (firstSpec && firstSpec.item_name) || inputData.userRequest
		const specs = firstSpec?.recommended_specs
		const mandatorySpecs = (firstSpec?.product_specs || []).filter(
			(spec: { spec_name?: string; spec_value?: string }) =>
				Boolean(spec?.spec_name) && Boolean(spec?.spec_value)
		)

		// Build comprehensive search query with mandatory specs
		let queryParts = [itemName]

		// Add recommended specs
		if (specs?.material) queryParts.push(specs.material)
		if (specs?.color) queryParts.push(specs.color)
		if (specs?.dimensions) queryParts.push(specs.dimensions)

		// Add mandatory product specs
		for (const spec of mandatorySpecs) {
			if (spec.spec_value && !queryParts.includes(spec.spec_value)) {
				queryParts.push(spec.spec_value)
			}
		}

		// Add specification context for better search
		if (firstSpec?.specifications_text) {
			// Extract key terms from specifications text
			const keyTerms = firstSpec.specifications_text
				.toLowerCase()
				.split(/[,.\s]+/)
				.filter(
					(term: string) =>
						term.length > 3 &&
						!['must', 'have', 'should', 'with', 'for', 'and', 'the'].includes(
							term
						)
				)
				.slice(0, 3)
			queryParts.push(...keyTerms)
		}

		// Use suggested queries from planning if available, otherwise use built query
		let finalQuery = queryParts.filter(Boolean).slice(0, 8).join(' ')
		if (inputData.suggested_queries && inputData.suggested_queries.length > 0) {
			// Combine the best suggested query with our spec-based query
			const bestSuggested = inputData.suggested_queries[0]
			finalQuery = `${bestSuggested} ${finalQuery}`.trim()
		}

		return {
			query: finalQuery,
			searchType: '1688-en' as const,
			maxResults: 10,
			// Pass through all planning data
			userRequest: inputData.userRequest,
			trend_sensitive: inputData.trend_sensitive,
			reasoning: inputData.reasoning,
			market_context: inputData.market_context,
			plan_summary: inputData.plan_summary,
			suggested_queries: inputData.suggested_queries,
			sourcing_plan: inputData.sourcing_plan,
		}
	},
})

sourcingBotWorkflow
	.then(planningStep)
	.then(analyzeAndGenerateSpecs)
	.then(enhancedPrepareSearchQuery)
	.then(enhancedRunSearch)

sourcingBotWorkflow.commit()

export { sourcingBotWorkflow, sourcingBotOutputSchema }
