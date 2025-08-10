import { describe, it, expect } from 'vitest'
import {
	summarizerAgent,
	conversationSummarySchema,
} from '../../agents/summarizer-agent'

describe('Summarizer Agent', () => {
	it('should be configured with correct name', () => {
		expect(summarizerAgent.name).toBe('Summarizer Agent')
	})

	it('should have no tools (pure conversation analysis)', () => {
		expect(Object.keys(summarizerAgent.tools)).toHaveLength(0)
	})

	it('should have a model configured', () => {
		expect(summarizerAgent.model).toBeDefined()
	})

	describe('instructions content', () => {
		it('should mention expertise in sourcing analysis', () => {
			expect(summarizerAgent.instructions).toContain('expert sourcing analyst')
			expect(summarizerAgent.instructions).toContain(
				'extracting precise requirements'
			)
		})

		it('should mention conversation analysis capabilities', () => {
			expect(summarizerAgent.instructions).toContain('analyze conversations')
			expect(summarizerAgent.instructions).toContain('groups of messages')
		})

		it('should emphasize extracting explicit requirements', () => {
			expect(summarizerAgent.instructions).toContain('explicitly stated')
			expect(summarizerAgent.instructions).toContain('clearly implied')
		})

		it('should mention key sourcing elements', () => {
			expect(summarizerAgent.instructions).toContain(
				'Item names and descriptions'
			)
			expect(summarizerAgent.instructions).toContain('Technical specifications')
			expect(summarizerAgent.instructions).toContain('Commercial requirements')
		})

		it('should emphasize avoiding assumptions', () => {
			expect(summarizerAgent.instructions).toContain("Don't make assumptions")
			expect(summarizerAgent.instructions).toContain('explicitly stated')
		})

		it('should mention CNY conversion', () => {
			expect(summarizerAgent.instructions).toContain('Convert prices to CNY')
		})
	})

	describe('conversation summary schema', () => {
		it('should have required top-level fields', () => {
			const shape = conversationSummarySchema.shape
			expect(shape).toHaveProperty('sourcing_requirements')
			expect(shape).toHaveProperty('confidence_level')
			expect(shape).toHaveProperty('missing_information')
			expect(shape).toHaveProperty('next_recommended_action')
		})

		it('should have comprehensive sourcing requirements structure', () => {
			const sourcingReqs =
				conversationSummarySchema.shape.sourcing_requirements.shape
			expect(sourcingReqs).toHaveProperty('item_name')
			expect(sourcingReqs).toHaveProperty('description')
			expect(sourcingReqs).toHaveProperty('specifications')
			expect(sourcingReqs).toHaveProperty('commercial_requirements')
			expect(sourcingReqs).toHaveProperty('additional_context')
		})

		it('should have detailed specifications structure', () => {
			const specs =
				conversationSummarySchema.shape.sourcing_requirements.shape
					.specifications.shape
			expect(specs).toHaveProperty('material')
			expect(specs).toHaveProperty('dimensions')
			expect(specs).toHaveProperty('color')
			expect(specs).toHaveProperty('quantity')
			expect(specs).toHaveProperty('quality_standards')
			expect(specs).toHaveProperty('customization')
		})

		it('should have commercial requirements structure', () => {
			const commercial =
				conversationSummarySchema.shape.sourcing_requirements.shape
					.commercial_requirements.shape
			expect(commercial).toHaveProperty('target_price')
			expect(commercial).toHaveProperty('price_range')
			expect(commercial).toHaveProperty('budget')
			expect(commercial).toHaveProperty('number_of_selections')
			expect(commercial).toHaveProperty('minimum_order_quantity')
			expect(commercial).toHaveProperty('lead_time')
		})

		it('should validate confidence level range', () => {
			const confidenceLevel = conversationSummarySchema.shape.confidence_level
			expect(() => confidenceLevel.parse(5)).not.toThrow()
			expect(() => confidenceLevel.parse(0)).toThrow()
			expect(() => confidenceLevel.parse(11)).toThrow()
		})

		it('should have valid next action options', () => {
			const nextAction = conversationSummarySchema.shape.next_recommended_action
			expect(() => nextAction.parse('clarify_requirements')).not.toThrow()
			expect(() => nextAction.parse('generate_specs')).not.toThrow()
			expect(() => nextAction.parse('search_suppliers')).not.toThrow()
			expect(() => nextAction.parse('market_analysis')).not.toThrow()
			expect(() => nextAction.parse('invalid_action')).toThrow()
		})
	})
})
