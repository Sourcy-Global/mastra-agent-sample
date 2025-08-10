import { Agent } from '@mastra/core/agent'

export interface StreamOptions {
	showOutput?: boolean
	outputPrefix?: string
}

export class StreamHandler {
	static async processAgentStream(
		agent: Agent<any, any, any>,
		messages: any[],
		options: StreamOptions = {}
	): Promise<string> {
		const { showOutput = false, outputPrefix = '' } = options

		const response = await agent.stream(messages)
		let responseText = ''

		for await (const chunk of response.textStream) {
			if (showOutput) {
				process.stdout.write(outputPrefix + chunk)
			}
			responseText += chunk
		}

		return responseText
	}

	static async processAgentStreamWithCallback(
		agent: Agent<any, any, any>,
		messages: any[],
		onChunk?: (chunk: string) => void
	): Promise<string> {
		const response = await agent.stream(messages)
		let responseText = ''

		for await (const chunk of response.textStream) {
			if (onChunk) {
				onChunk(chunk)
			}
			responseText += chunk
		}

		return responseText
	}
}

// Common message builders
export const MessageBuilder = {
	userMessage: (content: string) => ({
		role: 'user' as const,
		content,
	}),

	systemMessage: (content: string) => ({
		role: 'system' as const,
		content,
	}),

	assistantMessage: (content: string) => ({
		role: 'assistant' as const,
		content,
	}),
}