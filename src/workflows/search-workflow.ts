import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { processAgentResponse } from '../utils/workflow-functions'
import { searchAnalysisSchema } from '../utils/schemas'
import { searchAgent } from '../agents/search-agent'

const performSearchWithAgent = createStep({
	id: 'perform-search-with-agent',
	description: 'Uses search agent to perform comprehensive product sourcing search',
	inputSchema: z.object({
		query: z.string().describe('The search query for product sourcing'),
		searchType: z
			.enum(['1688', '1688-en', 'alibaba'])
			.optional()
			.default('1688-en')
			.describe('Type of search platform to use'),
		maxResults: z
			.number()
			.optional()
			.default(10)
			.describe('Maximum number of results'),
	}),
	outputSchema: searchAnalysisSchema,
	execute: async ({ inputData }) => {
		if (!inputData) {
			throw new Error('Input data not found')
		}

		const { query, searchType, maxResults = 10 } = inputData

		const prompt = `Search for products related to: "${query}"

Use ${searchType} search with up to ${maxResults} results. Provide comprehensive analysis including:
- Product availability and variety
- Price ranges and supplier information
- Key features and specifications
- Market insights and recommendations

Please use the appropriate search tool based on the search type requested.`

		return await processAgentResponse(
			{
				agent: searchAgent,
				schema: searchAnalysisSchema,
				fallback: {
					processedResults: `Failed to search for "${query}"`,
					keyInsights: [],
					sourceCount: 0,
					searchType: searchType || '1688-en',
				},
				showOutput: true,
			},
			prompt
		)
	},
})

const searchWorkflow = createWorkflow({
	id: 'search-workflow',
	inputSchema: z.object({
		query: z.string().describe('The search query for product sourcing'),
		searchType: z
			.enum(['1688', '1688-en', 'alibaba'])
			.optional()
			.default('1688-en')
			.describe('Type of search platform to use'),
		maxResults: z
			.number()
			.optional()
			.default(10)
			.describe('Maximum number of results'),
	}),
	outputSchema: searchAnalysisSchema,
})
	.then(performSearchWithAgent)
searchWorkflow.commit()

export { searchWorkflow }
