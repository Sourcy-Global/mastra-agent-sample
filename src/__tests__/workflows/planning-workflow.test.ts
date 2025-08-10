import { describe, it, expect } from 'vitest'
import { sourcingPlanSchema } from '../../workflows/planning-workflow'

describe('Planning Workflow Schemas', () => {
	describe('sourcingPlanSchema', () => {
		const validSourcingPlan = {
			objectives: [
				'Find reliable suppliers',
				'Compare pricing options',
				'Evaluate quality standards',
			],
			steps: [
				{
					id: '1',
					title: 'Market Research',
					detail: 'Conduct comprehensive market research for the product',
					owner: 'agent',
					dependencies: [],
				},
				{
					id: '2',
					title: 'Supplier Search',
					detail: 'Search for suppliers on 1688 and Alibaba',
					owner: 'agent',
					dependencies: ['1'],
				},
				{
					id: '3',
					title: 'Quality Assessment',
					detail: 'Evaluate supplier quality and reliability',
					owner: 'agent',
					dependencies: ['2'],
				},
			],
			data_to_collect: [
				'MOQ requirements',
				'Lead times',
				'Quality certifications',
				'Price breakdowns',
			],
			tools_to_use: ['1688 search', 'Alibaba search', 'Web search'],
			risks: [
				'Supplier reliability issues',
				'Quality inconsistencies',
				'Price fluctuations',
			],
			success_metrics: [
				'Find at least 3 qualified suppliers',
				'Cost savings of 15%',
				'Quality score above 80',
			],
		}

		it('should validate complete valid sourcing plan', () => {
			expect(() => sourcingPlanSchema.parse(validSourcingPlan)).not.toThrow()
		})

		it('should require objectives array', () => {
			const withoutObjectives = { ...validSourcingPlan }
			delete withoutObjectives.objectives
			expect(() => sourcingPlanSchema.parse(withoutObjectives)).toThrow()
		})

		it('should enforce minimum and maximum steps (3-12)', () => {
			// Test minimum (3 steps required)
			const tooFewSteps = {
				...validSourcingPlan,
				steps: validSourcingPlan.steps.slice(0, 2), // only 2 steps
			}
			expect(() => sourcingPlanSchema.parse(tooFewSteps)).toThrow()

			// Test maximum (12 steps max)
			const tooManySteps = {
				...validSourcingPlan,
				steps: Array.from({ length: 13 }, (_, i) => ({
					id: `${i + 1}`,
					title: `Step ${i + 1}`,
					detail: `Detail for step ${i + 1}`,
					owner: 'agent',
					dependencies: [],
				})),
			}
			expect(() => sourcingPlanSchema.parse(tooManySteps)).toThrow()

			// Test valid number (exactly 3)
			const exactlyThree = {
				...validSourcingPlan,
				steps: validSourcingPlan.steps.slice(0, 3),
			}
			expect(() => sourcingPlanSchema.parse(exactlyThree)).not.toThrow()
		})

		it('should validate step structure', () => {
			const invalidStep = {
				...validSourcingPlan,
				steps: [
					{
						id: '1',
						title: 'Step 1',
						// missing detail field
						owner: 'agent',
						dependencies: [],
					},
				],
			}
			expect(() => sourcingPlanSchema.parse(invalidStep)).toThrow()
		})

		it('should use default values for optional fields', () => {
			const minimalPlan = {
				objectives: ['Find suppliers'],
				steps: [
					{
						id: '1',
						title: 'Research',
						detail: 'Conduct research',
						// owner should default to 'agent'
						// dependencies should default to []
					},
					{
						id: '2',
						title: 'Search',
						detail: 'Search suppliers',
					},
					{
						id: '3',
						title: 'Evaluate',
						detail: 'Evaluate options',
					},
				],
				// Optional fields should get default empty arrays
			}

			const result = sourcingPlanSchema.parse(minimalPlan)
			expect(result.steps[0].owner).toBe('agent')
			expect(result.steps[0].dependencies).toEqual([])
			expect(result.data_to_collect).toEqual([])
			expect(result.tools_to_use).toEqual([])
			expect(result.risks).toEqual([])
			expect(result.success_metrics).toEqual([])
		})

		it('should handle complex dependencies', () => {
			const complexDependencies = {
				...validSourcingPlan,
				steps: [
					{
						id: '1',
						title: 'Initial Research',
						detail: 'Conduct initial market research',
						owner: 'agent',
						dependencies: [],
					},
					{
						id: '2',
						title: 'Detailed Analysis',
						detail: 'Analyze market findings',
						owner: 'agent',
						dependencies: ['1'],
					},
					{
						id: '3',
						title: 'Multi-step Process',
						detail: 'Process that depends on multiple previous steps',
						owner: 'agent',
						dependencies: ['1', '2'], // multiple dependencies
					},
				],
			}
			expect(() => sourcingPlanSchema.parse(complexDependencies)).not.toThrow()
		})

		it('should validate array fields can be empty', () => {
			const withEmptyArrays = {
				...validSourcingPlan,
				objectives: [], // objectives can be empty
				data_to_collect: [],
				tools_to_use: [],
				risks: [],
				success_metrics: [],
			}
			expect(() => sourcingPlanSchema.parse(withEmptyArrays)).not.toThrow()
		})

		it('should handle different owner values', () => {
			const differentOwners = {
				...validSourcingPlan,
				steps: [
					{
						id: '1',
						title: 'Human Task',
						detail: 'Task for human to complete',
						owner: 'human',
						dependencies: [],
					},
					{
						id: '2',
						title: 'System Task',
						detail: 'Automated system task',
						owner: 'system',
						dependencies: [],
					},
					{
						id: '3',
						title: 'Agent Task',
						detail: 'AI agent task',
						owner: 'agent',
						dependencies: [],
					},
				],
			}
			expect(() => sourcingPlanSchema.parse(differentOwners)).not.toThrow()
		})
	})
})