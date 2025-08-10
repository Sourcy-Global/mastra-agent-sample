import { describe, it, expect } from 'vitest'
import { searchAgent } from '../../agents/search-agent'

describe('Search Agent', () => {
	it('should be configured with correct name', () => {
		expect(searchAgent.name).toBe('Search Agent')
	})

	it('should have search tools available', () => {
		expect(searchAgent.tools).toHaveProperty('search1688Tool')
		expect(searchAgent.tools).toHaveProperty('search1688EnglishTool')
		expect(searchAgent.tools).toHaveProperty('searchAlibabaTool')
	})

	it('should have appropriate instructions', () => {
		expect(searchAgent.instructions).toContain('search assistant')
		expect(searchAgent.instructions).toContain('sourcing products')
		expect(searchAgent.instructions).toContain('1688')
		expect(searchAgent.instructions).toContain('Alibaba')
	})

	it('should have a model configured', () => {
		expect(searchAgent.model).toBeDefined()
	})

	describe('instruction content', () => {
		it('should mention searching for current information', () => {
			expect(searchAgent.instructions).toContain(
				'most current and relevant information'
			)
		})

		it('should mention both 1688 and Alibaba search capabilities', () => {
			expect(searchAgent.instructions).toContain('1688 (Chinese/English)')
			expect(searchAgent.instructions).toContain('Alibaba')
		})

		it('should emphasize providing sources and links', () => {
			expect(searchAgent.instructions).toContain('relevant links and sources')
		})

		it('should mention suggesting alternative search terms', () => {
			expect(searchAgent.instructions).toContain('alternative search terms')
		})

		it('should emphasize keeping responses informative but concise', () => {
			expect(searchAgent.instructions).toContain('informative but concise')
		})
	})

	describe('search capabilities mentioned in instructions', () => {
		it('should list 1688 search capability', () => {
			expect(searchAgent.instructions).toContain(
				'Search 1688'
			)
		})

		it('should list comprehensive search results', () => {
			expect(searchAgent.instructions).toContain('comprehensive and relevant search results')
		})

		it('should mention sourcing focus', () => {
			expect(searchAgent.instructions).toContain('sourcing products')
		})
	})
})
