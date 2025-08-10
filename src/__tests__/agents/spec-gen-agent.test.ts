import { describe, it, expect } from 'vitest'
import { specGenAgent } from '../../agents/spec-gen-agent'
import { specGenAgentSchema } from '../../utils/schemas'

describe('Spec Generation Agent', () => {
	it('should be configured with correct name', () => {
		expect(specGenAgent.name).toBe('Spec Generation Agent')
	})

	it('should have basic search tools available', () => {
		expect(specGenAgent.tools).toHaveProperty('webSearchTool')
		expect(specGenAgent.tools).toHaveProperty('shoppingSearchTool')
	})

	it('should have a model configured', () => {
		expect(specGenAgent.model).toBeDefined()
	})

	describe('instructions content', () => {
		it('should mention expertise in product specification engineering', () => {
			expect(specGenAgent.instructions).toContain(
				'expert product specification engineer'
			)
			expect(specGenAgent.instructions).toContain(
				'comprehensive product specifications'
			)
		})

		it('should outline the step-by-step process', () => {
			expect(specGenAgent.instructions).toContain(
				'1. Analyze user requests'
			)
			expect(specGenAgent.instructions).toContain(
				'2. Conduct web searches'
			)
			expect(specGenAgent.instructions).toContain(
				'3. Generate detailed, actionable specifications'
			)
		})

		it('should emphasize research using search tools', () => {
			expect(specGenAgent.instructions).toContain(
				'search tools proactively'
			)
			expect(specGenAgent.instructions).toContain('Conduct web searches')
			expect(specGenAgent.instructions).toContain('market-informed')
		})

		it('should mention spec type classification', () => {
			expect(specGenAgent.instructions).toContain('must-have')
			expect(specGenAgent.instructions).toContain('good-to-have')
			expect(specGenAgent.instructions).toContain('upsell')
		})

		it('should emphasize important rules', () => {
			expect(specGenAgent.instructions).toContain('IMPORTANT RULES')
			expect(specGenAgent.instructions).toContain('marked as optional')
			expect(specGenAgent.instructions).toContain('explicitly stated by user')
			expect(specGenAgent.instructions).toContain(
				'Do NOT simply copy previous specifications'
			)
		})

		it('should mention proactive search tool usage', () => {
			expect(specGenAgent.instructions).toContain(
				'Use search tools proactively'
			)
			expect(specGenAgent.instructions).toContain('market-informed')
			expect(specGenAgent.instructions).toContain('technically accurate')
		})
	})

	describe('spec generation schema', () => {
		it('should have required top-level fields', () => {
			const shape = specGenAgentSchema.shape
			expect(shape).toHaveProperty('chunks')
			expect(shape).toHaveProperty('next_action')
		})

		it('should validate next_action as string', () => {
			const nextAction = specGenAgentSchema.shape.next_action
			expect(() => nextAction.parse('search')).not.toThrow()
			expect(() => nextAction.parse('other_action')).not.toThrow()
			expect(() => nextAction.parse(123)).toThrow() // Should only accept strings
		})

		it('should have comprehensive chunk structure', () => {
			// Test that chunks is an array
			const chunks = specGenAgentSchema.shape.chunks
			expect(chunks._def.typeName).toBe('ZodArray')
		})

		it('should have generated_specs with required fields', () => {
			// This tests the structure without parsing actual data
			const mockChunk = {
				generated_specs: {
					item_name: 'Test Item',
					item_archetype: 'Test Archetype',
					spec_type: 'must-have' as const,
					recommended_specs: {
						material: 'plastic',
						color: 'blue',
						dimensions: '10x10x10cm',
						quantity: 100,
						target_price_cny: 50,
					},
					product_specs: [
						{
							spec_name: 'Weight',
							spec_value: '1kg',
							required: true,
						},
					],
					specifications_text: 'Test specifications summary',
				},
				reasoning: 'Test reasoning',
			}

			expect(() =>
				specGenAgentSchema.shape.chunks.element.parse(mockChunk)
			).not.toThrow()
		})

		it('should validate spec_type enum values', () => {
			const validTypes = ['must-have', 'good-to-have', 'upsell']
			validTypes.forEach(type => {
				const mockData = {
					generated_specs: {
						item_name: 'Test',
						item_archetype: 'Test',
						spec_type: type,
						recommended_specs: {},
						product_specs: [],
						specifications_text: 'Test',
					},
					reasoning: 'Test',
				}
				expect(() =>
					specGenAgentSchema.shape.chunks.element.parse(mockData)
				).not.toThrow()
			})
		})

		it('should handle nullable fields in recommended_specs', () => {
			const mockData = {
				generated_specs: {
					item_name: 'Test Item',
					item_archetype: 'Test Archetype',
					spec_type: 'must-have' as const,
					recommended_specs: {},
					product_specs: [],
					specifications_text: 'Test specifications',
				},
				reasoning: 'Test reasoning',
			}

			expect(() =>
				specGenAgentSchema.shape.chunks.element.parse(mockData)
			).not.toThrow()
		})
	})
})
