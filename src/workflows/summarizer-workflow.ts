import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { summarizerAgent } from '../agents/summarizer-agent'
import { conversationSummarySchema } from '../utils/schemas'

const formatInput = createStep({
	id: 'format-input',
	description: 'Formats conversation messages into a single prompt',
	inputSchema: z.object({
		messages: z.array(z.string()).describe('Array of conversation messages'),
		context: z
			.string()
			.optional()
			.describe('Additional context about the conversation'),
	}),
	outputSchema: z.object({
		prompt: z.string(),
	}),
	execute: async ({ inputData }) => {
		if (!inputData) {
			throw new Error('Input data not found')
		}

		const conversationText = inputData.messages.join('\n\n---\n\n')
		const contextString = inputData.context
			? `\n\nAdditional Context:\n${inputData.context}`
			: ''

		const prompt = `Analyze the following conversation and extract precise sourcing requirements:

Conversation:
${conversationText}${contextString}`

		return { prompt }
	},
})

const processWithAgent = createStep({
	id: 'process-with-agent',
	description: 'Uses summarizer agent to extract requirements',
	inputSchema: z.object({
		prompt: z.string(),
	}),
	outputSchema: conversationSummarySchema,
	execute: async ({ inputData }) => {
		if (!inputData) {
			throw new Error('Input data not found')
		}

		const response = await summarizerAgent.generate(inputData.prompt)
		return (
			response.object || {
				sourcing_requirements: {
					item_name: 'Unable to parse',
					description: 'Failed to parse response',
					specifications: {
						material: null,
						dimensions: null,
						color: null,
						quantity: null,
						quality_standards: null,
						customization: null,
					},
					commercial_requirements: {
						target_price: null,
						price_range: null,
						budget: null,
						number_of_selections: null,
						minimum_order_quantity: null,
						lead_time: null,
					},
					additional_context: {
						intended_use: null,
						target_market: null,
						compliance_requirements: null,
						packaging_requirements: null,
						shipping_requirements: null,
					},
				},
				confidence_level: 1,
				missing_information: ['Failed to parse response'],
				next_recommended_action: 'clarify_requirements' as const,
			}
		)
	},
})

const summarizerWorkflow = createWorkflow({
	id: 'summarizer-workflow',
	inputSchema: z.object({
		messages: z.array(z.string()).describe('Array of conversation messages'),
		context: z
			.string()
			.optional()
			.describe('Additional context about the conversation'),
	}),
	outputSchema: conversationSummarySchema,
})
	.then(formatInput)
	.then(processWithAgent)

summarizerWorkflow.commit()

export { summarizerWorkflow }
