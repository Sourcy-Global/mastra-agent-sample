import { Agent } from '@mastra/core/agent'

// Common response processing utility - contains actual logic
export async function processAgentResponse<T>(
	config: {
		agent: Agent<any, any, any>
		schema: any
		fallback: T
		showOutput?: boolean
	},
	prompt: string
): Promise<T> {
	try {
		if (config.showOutput) {
			console.log('🤖 Agent processing:', prompt.substring(0, 100) + '...')
		}

		const response = await config.agent.generate(prompt, {
			output: config.schema,
		})

		if (config.showOutput) {
			console.log('✅ Agent response received')
		}

		return response as T
	} catch (error) {
		console.error('❌ Agent processing failed:', error)
		return config.fallback
	}
}
