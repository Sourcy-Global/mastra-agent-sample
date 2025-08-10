import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { specMatchingAgent } from '../agents/spec-matching-agent'
import { ProductProcessingReportSchema } from '../utils/schemas'

const formatMatchingInput = createStep({
	id: 'format-matching-input',
	description: 'Formats user specs and product details for analysis',
	inputSchema: z.object({
		userSpecs: z.object({
			item_name: z.string(),
			requirements: z.string(),
			specifications: z.record(z.any()),
		}),
		productDetails: z.object({
			product_id: z.string(),
			title: z.string(),
			price: z.number(),
			supplier: z.string(),
			description: z.string(),
			specifications: z.record(z.any()),
		}),
	}),
	outputSchema: z.object({
		prompt: z.string(),
		product_id: z.string(),
		product_title: z.string(),
	}),
	execute: async ({ inputData }) => {
		if (!inputData) {
			throw new Error('Input data not found')
		}

		const { userSpecs, productDetails } = inputData

		const prompt = `Analyze how well this product matches the user requirements and create a comprehensive processing report:

USER REQUIREMENTS:
- Item Name: ${userSpecs.item_name}
- Requirements: ${userSpecs.requirements}
- Specifications: ${JSON.stringify(userSpecs.specifications, null, 2)}

PRODUCT DETAILS:
- Product ID: ${productDetails.product_id}
- Title: ${productDetails.title}
- Price: $${productDetails.price}
- Supplier: ${productDetails.supplier}
- Description: ${productDetails.description}
- Specifications: ${JSON.stringify(productDetails.specifications, null, 2)}

Provide a detailed analysis covering all aspects of the match quality, supplier evaluation, risks, and final recommendation.`

		return {
			prompt,
			product_id: productDetails.product_id,
			product_title: productDetails.title,
		}
	},
})

const processWithMatchingAgent = createStep({
	id: 'process-with-matching-agent',
	description: 'Uses spec matching agent to analyze product fit',
	inputSchema: z.object({
		prompt: z.string(),
		product_id: z.string(),
		product_title: z.string(),
	}),
	outputSchema: ProductProcessingReportSchema,
	execute: async ({ inputData }) => {
		if (!inputData) {
			throw new Error('Input data not found')
		}

		const startTime = Date.now()
		
		try {
			const response = await specMatchingAgent.generate(inputData.prompt, {
				output: { schema: ProductProcessingReportSchema },
			})
			
			const processingTime = Date.now() - startTime
			
			return {
				...response,
				processing_metadata: {
					...response.processing_metadata,
					processing_time_ms: processingTime,
					error_occurred: false,
					error_message: null,
				}
			}
		} catch (error) {
			const processingTime = Date.now() - startTime
			
			// Return a basic error report if agent fails
			return {
				product_id: inputData.product_id,
				product_title: inputData.product_title,
				spec_matching_analysis: {
					score: 0,
					reason: ['Agent processing failed'],
					item_match: false,
					partial_match: false,
					type: null,
					spec_scores: [],
					detailed_analysis: 'Analysis failed due to processing error',
				},
				quality_assessment: {
					quality_score: 0,
					supplier_rating: null,
					certifications: [],
					quality_indicators: 'Unable to assess due to processing error',
				},
				price_analysis: {
					price_competitiveness: 0,
					value_proposition: 'Unable to analyze due to processing error',
					bulk_pricing_available: false,
					price_breakdown: 'Not available',
				},
				supplier_evaluation: {
					reliability_score: 0,
					location: 'Unknown',
					company_info: 'Unable to evaluate due to processing error',
					communication_quality: 'Not assessed',
				},
				risk_assessment: {
					risk_level: 'high' as const,
					identified_risks: ['Processing error occurred'],
					mitigation_strategies: ['Retry analysis with different approach'],
					red_flags: ['Agent processing failure'],
				},
				recommendation: {
					overall_recommendation: 'not_recommended' as const,
					key_strengths: [],
					key_weaknesses: ['Processing failed'],
					procurement_considerations: 'Unable to provide recommendation due to processing error',
				},
				processing_metadata: {
					processing_time_ms: processingTime,
					api_source: 'spec-matching-agent',
					has_detailed_specs: false,
					error_occurred: true,
					error_message: error instanceof Error ? error.message : 'Unknown error',
				},
			}
		}
	},
})

const specMatchingWorkflow = createWorkflow({
	id: 'spec-matching-workflow',
	inputSchema: z.object({
		userSpecs: z.object({
			item_name: z.string(),
			requirements: z.string(),
			specifications: z.record(z.any()),
		}),
		productDetails: z.object({
			product_id: z.string(),
			title: z.string(),
			price: z.number(),
			supplier: z.string(),
			description: z.string(),
			specifications: z.record(z.any()),
		}),
	}),
	outputSchema: ProductProcessingReportSchema,
})
.then(formatMatchingInput)
.then(processWithMatchingAgent)

specMatchingWorkflow.commit()

export { specMatchingWorkflow }

// Test data - dummy specs and product for testing
export const dummyTestData = {
	userSpecs: {
		item_name: 'Bluetooth Headphones',
		requirements: 'Looking for high-quality wireless headphones with noise cancellation, long battery life, and comfortable fit for daily use.',
		specifications: {
			connectivity: 'Bluetooth 5.0 or higher',
			battery_life: 'At least 20 hours',
			noise_cancellation: 'Active noise cancellation',
			weight: 'Under 300g',
			price_range: '$100-200',
			warranty: '1 year minimum',
		},
	},
	productDetails: {
		product_id: 'BT-HP-001',
		title: 'Sony WH-1000XM4 Wireless Noise Canceling Headphones',
		price: 179.99,
		supplier: 'Sony Electronics',
		description: 'Industry-leading noise canceling with Dual Noise Sensor technology. Up to 30-hour battery life with quick charge. Touch Sensor controls to pause, play, skip tracks, control volume, activate voice assistant, and answer phone calls.',
		specifications: {
			connectivity: 'Bluetooth 5.0',
			battery_life: '30 hours',
			noise_cancellation: 'Dual Noise Sensor Technology',
			weight: '254g',
			driver_size: '40mm',
			frequency_response: '4Hz-40,000Hz',
			warranty: '1 year',
			color_options: ['Black', 'Silver', 'Blue'],
		},
	},
}