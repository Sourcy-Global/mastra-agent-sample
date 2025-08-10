export const commonSearchStrategies = {
	marketResearch: {
		keywords: ['trends', 'market report', 'consumer insights', '2024', 'analysis'],
		instructions: `
			- Use specific product category keywords plus trend-related terms
			- Search for "2024 trends", "market report", "consumer insights"
			- Look for industry publications and expert opinions
			- Research both B2C and B2B perspectives
			- Include sustainability and social responsibility angles
			- Search for regulatory and compliance trends
		`,
	},
	productSpecification: {
		keywords: ['specifications', 'standards', 'materials', 'manufacturing', 'quality'],
		instructions: `
			- Search for product categories, standards, and specifications
			- Research common materials and manufacturing methods
			- Look for industry standards and compliance requirements
			- Find market trends and consumer preferences
			- Search both general web and product-specific sources
		`,
	},
	competitiveAnalysis: {
		keywords: ['brands', 'competitors', 'market share', 'positioning', 'pricing'],
		instructions: `
			- Identify key brands and their market positioning
			- Analyze differentiation strategies and unique selling propositions
			- Study successful product launches and innovations
			- Research brand messaging and marketing approaches
		`,
	},
	supplierResearch: {
		keywords: ['suppliers', 'manufacturers', 'sourcing', 'wholesale', 'B2B'],
		instructions: `
			- Search for manufacturers and suppliers
			- Research production capabilities and capacity
			- Look for quality certifications and compliance
			- Find pricing information and minimum order quantities
		`,
	},
} as const

export type SearchStrategy = keyof typeof commonSearchStrategies

export const getSearchStrategy = (strategy: SearchStrategy) => {
	return commonSearchStrategies[strategy]
}

export const generateSearchInstructions = (strategies: SearchStrategy[]) => {
	const selectedStrategies = strategies.map(strategy => commonSearchStrategies[strategy])
	
	return `
		Research Methodology and Search Strategy:
		${selectedStrategies.map(strategy => strategy.instructions).join('\n')}
		
		Quality Standards:
		- Conduct at least 5-8 different searches for comprehensive coverage
		- Cross-reference findings across multiple sources
		- Focus on recent data (last 12-24 months)
		- Balance quantitative data with qualitative insights
		- Provide specific examples and evidence for each trend
		- Identify both opportunities and risks
	`
}