import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { summarizerAgent } from '../agents/summarizer-agent'
import { demandAgent } from '../agents/demand-agent'
import { processAgentResponse } from '../utils/workflow-functions'
import { marketAnalysisSchema } from '../utils/schemas'

// Schema for a structured sourcing plan
export const sourcingPlanSchema = z.object({
	objectives: z
		.array(z.string())
		.describe('Primary goals for the sourcing request'),
	steps: z
		.array(
			z.object({
				id: z.string(),
				title: z.string(),
				detail: z.string(),
				owner: z.string().default('agent'),
				dependencies: z.array(z.string()).default([]),
			})
		)
		.min(3)
		.max(12)
		.describe('Ordered execution steps'),
	data_to_collect: z.array(z.string()).default([]),
	tools_to_use: z.array(z.string()).default([]),
	risks: z.array(z.string()).default([]),
	success_metrics: z.array(z.string()).default([]),
})

// Schema for planning output
const planningSchema = z.object({
	plan_summary: z
		.string()
		.describe('High-level plan to execute the sourcing request'),
	trend_sensitive: z
		.boolean()
		.describe('Whether the product is trend-sensitive'),
	trend_reason: z.string().describe('Reasoning for trend sensitivity decision'),
	run_market_analysis: z
		.boolean()
		.describe('Whether to enrich with market analysis'),
	suggested_queries: z.array(z.string()).default([]),
	sourcing_plan: sourcingPlanSchema,
})

// Step that plans how to execute the sourcing request and optionally enriches context
export const planningStep = createStep({
	id: 'planning-workflow',
	description:
		'Creates an overall plan for executing the sourcing request, classifies trend sensitivity, and optionally enriches with market analysis.',
	inputSchema: z.object({
		userRequest: z.string().describe('Original sourcing request to process'),
		minShortlist: z.number().default(5),
	}),
	outputSchema: z.object({
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

		const trendinessRubric = `You are a product trend analyst expert. Use the following rubric to decide if the product is trend-sensitive.

TREND-SENSITIVE (Yes) indicators:
- Fashion & Aesthetics primary (style, color, design)
- Social media-driven (TikTok, Instagram, Pinterest, influencers)
- Seasonal/Viral
- Youth/Lifestyle focused (Gen-Z, millennials)
- Categories: fashion, beauty, home decor, lifestyle accessories, trending gadgets

STANDARD (No) indicators:
- Utility-first, function over form
- B2B/Industrial
- Basic commodities
- Technical/Professional tools
- Stable demand independent of trends

Output format (strict):
{
  "plan_summary": string,
  "trend_sensitive": boolean,
  "trend_reason": string,
  "run_market_analysis": boolean,
  "suggested_queries": string[],
  "sourcing_plan": {
    "objectives": string[],
    "steps": Array<{ "id": string, "title": string, "detail": string, "owner": string, "dependencies": string[] }>,
    "data_to_collect": string[],
    "tools_to_use": string[],
    "risks": string[],
    "success_metrics": string[]
  }
}`

		const planningPrompt = `SOURCING REQUEST:\n${inputData.userRequest}\n\nRUBRIC:\n${trendinessRubric}\n\nTASK:\n1) Classify trend sensitivity using the rubric\n2) Propose a concise step-by-step plan to execute the sourcing request\n3) Suggest 3-6 search queries\n4) Set run_market_analysis true only if trend-sensitive or context would materially improve specs\n\nReturn strictly in the required JSON format.`

		const plan = await processAgentResponse(
			{
				agent: summarizerAgent,
				schema: planningSchema,
				fallback: {
					plan_summary:
						'Collect requirements, generate must-have specs, search suppliers on 1688/Alibaba, match specs, shortlist best candidates.',
					trend_sensitive: false,
					trend_reason: 'Defaulted due to planning failure',
					run_market_analysis: false,
					suggested_queries: [],
					sourcing_plan: {
						objectives: [
							'Clarify must-have specifications',
							'Identify qualified suppliers',
							'Shortlist best-matching products',
						],
						steps: [
							{
								id: '1',
								title: 'Generate must-have specifications',
								detail:
									'Create structured specs strictly from the request; keep enrichments optional.',
								owner: 'agent',
								dependencies: [],
							},
							{
								id: '2',
								title: 'Search suppliers on 1688/Alibaba',
								detail:
									'Use multilingual queries targeting item name, material, and key attributes.',
								owner: 'agent',
								dependencies: ['1'],
							},
							{
								id: '3',
								title: 'Run spec matching and shortlist',
								detail:
									'Score candidates vs. specs and produce a shortlist with recommendations.',
								owner: 'agent',
								dependencies: ['2'],
							},
						],
						data_to_collect: [
							'MOQ',
							'Lead time',
							'Certifications',
							'Bulk pricing',
						],
						tools_to_use: [
							'1688 search',
							'Alibaba search',
							'Spec matching agent',
						],
						risks: [
							'Overfitting to aesthetic cues',
							'Incomplete supplier info',
						],
						success_metrics: [
							'Spec match score > 75',
							'>= N qualified suppliers',
						],
					},
				},
				showOutput: false,
			},
			planningPrompt
		)

		let marketContext: string | undefined = undefined
		if (plan.run_market_analysis) {
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
				`Conduct a comprehensive market analysis for: ${inputData.userRequest}`
			)
			marketContext = analysis.market_analysis_report.summary
		}

		return {
			userRequest: inputData.userRequest,
			trend_sensitive: plan.trend_sensitive,
			reasoning: plan.trend_reason,
			market_context: marketContext,
			plan_summary: plan.plan_summary,
			suggested_queries: plan.suggested_queries,
			sourcing_plan: plan.sourcing_plan,
		}
	},
})

// Create standalone planning workflow for testing
const planningWorkflow = createWorkflow({
	id: 'planning-workflow',
	inputSchema: z.object({
		userRequest: z.string().describe('Original sourcing request to process'),
		minShortlist: z.number().default(5),
	}),
	outputSchema: z.object({
		userRequest: z.string(),
		trend_sensitive: z.boolean(),
		reasoning: z.string(),
		market_context: z.string().optional(),
		plan_summary: z.string(),
		suggested_queries: z.array(z.string()),
		sourcing_plan: sourcingPlanSchema,
	}),
})
	.then(planningStep)

planningWorkflow.commit()

export { planningSchema, planningWorkflow }
