import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { specGenAgent } from '../agents/spec-gen-agent'
import { specGenAgentSchema } from '../utils/schemas'
import { processAgentResponse } from '../utils/workflow-functions'

const generateSpecifications = createStep({
	id: 'generate-specifications',
	description:
		'Generates detailed product specifications based on user requirements',
	inputSchema: z.object({
		userRequest: z.string().describe('User requirements for the product'),
		specType: z
			.enum(['must-have', 'good-to-have', 'upsell'])
			.describe('Type of specifications to generate'),
		context: z.string().optional().describe('Additional context information'),
		previousSpecs: z
			.string()
			.optional()
			.describe('Previous specifications to compare against'),
	}),
	outputSchema: specGenAgentSchema,
	execute: async ({ inputData }) => {
		if (!inputData) {
			throw new Error('Input data not found')
		}

		const contextString = inputData.context || 'No additional context provided'
		const previousSpecsString = inputData.previousSpecs
			? `\n\nPrevious Specifications:\n${inputData.previousSpecs}`
			: ''

		const prompt = `User Request: ${inputData.userRequest}
Spec Type: ${inputData.specType}

Context Information:
${contextString}${previousSpecsString}

Generate comprehensive product specifications for sourcing based on the user request and any available context.

Instructions:
1. Identify the product types and generate appropriate item_name and item_archetypes for each chunk of the user request.
2. Create specifications based on the spec_type (${inputData.specType})
3. Include recommended_specs with key attributes like material, color, dimensions, quantity
4. Add product_specs with additional detailed specifications
5. If multiple distinct products need to be sourced, create separate objects for each
6. Convert any target prices to CNY if needed
7. Tag specs as required only if explicitly mandatory in the query or defining features of the archetype

IMPORTANT: All good-to-have and upsell specifications should be based on the user request and the market insights and MUST BE OPTIONAL always.
For must-have, do not enrich or add additional specs that the user did not ask for.

IMPORTANT: If previous specs exist, compare that with the user requirements and the context information, to produce new specs that are more relevant to the user request, DO NOT simply copy the previous specs.

Conduct research using available search tools to understand product categories, standards, and market insights before generating specifications.

Format the output as a valid JSON according to the structured schema with both recommended_specs and product_specs sections.`

		return await processAgentResponse(
			{
				agent: specGenAgent,
				schema: specGenAgentSchema,
				fallback: {
					chunks: [
						{
							generated_specs: {
								item_name: 'Failed to parse',
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
							reasoning: 'Specification generation failed',
						},
					],
					next_action: 'search' as const,
				},
				showOutput: true,
			},
			prompt
		)
	},
})

const specGenWorkflow = createWorkflow({
	id: 'spec-gen-workflow',
	inputSchema: z.object({
		userRequest: z.string().describe('User requirements for the product'),
		specType: z
			.enum(['must-have', 'good-to-have', 'upsell'])
			.describe('Type of specifications to generate'),
		context: z.string().optional().describe('Additional context information'),
		previousSpecs: z
			.string()
			.optional()
			.describe('Previous specifications to compare against'),
	}),
	outputSchema: specGenAgentSchema,
}).then(generateSpecifications)
specGenWorkflow.commit()

export { specGenWorkflow }
