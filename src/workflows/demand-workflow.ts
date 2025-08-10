import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { demandAgent } from '../agents/demand-agent'
import { marketAnalysisSchema } from '../utils/schemas'
import { processAgentResponse } from '../utils/workflow-functions'

const conductMarketAnalysis = createStep({
	id: 'conduct-market-analysis',
	description:
		'Conducts comprehensive market analysis to identify trends and opportunities',
	inputSchema: z.object({
		productCategory: z.string().describe('Product category to analyze'),
		targetMarket: z
			.string()
			.optional()
			.describe('Target market or geographic region'),
		analysisDepth: z
			.enum(['basic', 'comprehensive', 'deep-dive'])
			.optional()
			.default('comprehensive')
			.describe('Depth of market analysis'),
		specificFocus: z
			.string()
			.optional()
			.describe(
				'Specific aspects to focus on (e.g., pricing, features, brands)'
			),
	}),
	outputSchema: marketAnalysisSchema,
	execute: async ({ inputData }) => {
		if (!inputData) {
			throw new Error('Input data not found')
		}

		const targetMarketString = inputData.targetMarket
			? `\nTarget Market: ${inputData.targetMarket}`
			: ''
		const focusString = inputData.specificFocus
			? `\nSpecific Focus Areas: ${inputData.specificFocus}`
			: ''

		const prompt = `Conduct a ${inputData.analysisDepth || 'comprehensive'} market analysis for the following product category:

Product Category: ${inputData.productCategory}${targetMarketString}${focusString}

Please provide a comprehensive market analysis including:

1. Current trending features and innovations in this category
2. Popular design styles and aesthetic preferences
3. Preferred materials and manufacturing approaches
4. Key archetype brands and their market positioning
5. Positive market trends and growth opportunities
6. Negative trends and challenges to avoid
7. Pricing insights and value drivers
8. Consumer preferences and behavior patterns
9. Market gaps and underserved segments
10. Seasonal and temporal trends

Use multiple search sources including:
- Web search for industry reports and trend articles
- Shopping search for current product offerings and pricing
- 1688 search for manufacturing trends and supplier capabilities
- Alibaba search for international trade patterns

Conduct 5-8 different searches with varied keywords to ensure comprehensive coverage. Cross-reference findings across multiple sources and focus on recent data from the last 12-24 months.

Provide specific, actionable findings rather than generic statements. Include confidence level based on data quality and source reliability.`

		return await processAgentResponse(
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
				showOutput: true,
			},
			prompt
		)
	},
})

const demandWorkflow = createWorkflow({
	id: 'demand-workflow',
	inputSchema: z.object({
		productCategory: z.string().describe('Product category to analyze'),
		targetMarket: z
			.string()
			.optional()
			.describe('Target market or geographic region'),
		analysisDepth: z
			.enum(['basic', 'comprehensive', 'deep-dive'])
			.optional()
			.default('comprehensive')
			.describe('Depth of market analysis'),
		specificFocus: z
			.string()
			.optional()
			.describe(
				'Specific aspects to focus on (e.g., pricing, features, brands)'
			),
	}),
	outputSchema: marketAnalysisSchema,
}).then(conductMarketAnalysis)
demandWorkflow.commit()

export { demandWorkflow }
