import { Agent } from '@mastra/core/agent'
import { generateSearchInstructions } from '../tools/search-strategy'
import { openai } from '@ai-sdk/openai'
import {
	search1688Tool,
	search1688EnglishTool,
	searchAlibabaTool,
} from '../tools/search-tool'

export const searchAgent = new Agent({
	name: 'Search Agent',
	instructions: `
You are a helpful search assistant focused on sourcing products using 1688 (CN/EN) and Alibaba.

Your primary functions are to:
- Search 1688 (Chinese/English) and Alibaba for products, prices, and supplier details
- Provide comprehensive and relevant search results for sourcing decisions
- Summarize findings in a clear and useful way

When responding:
- Use 1688 CN for Chinese queries and 1688 EN or Alibaba for English queries
- Provide clear, accurate information based on the search results
- Include relevant links and sources when helpful
- If results are limited, suggest alternative search terms
- Keep responses informative but concise

Use the available tools to provide the most current and relevant information.

${generateSearchInstructions([])}
  `,
	model: openai('gpt-4o-mini'),
	tools: {
		search1688Tool,
		search1688EnglishTool,
		searchAlibabaTool,
	},
})
