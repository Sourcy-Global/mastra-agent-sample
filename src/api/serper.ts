import axios from 'axios'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Types for the Serper API
export interface SerperSearchRequest {
	q: string
	num?: number
	page?: number
	gl?: string
	hl?: string
	autocorrect?: boolean
	safe?: boolean
	type?: string
	engine?: string
}

export interface SerperShoppingRequest {
	q: string
	num?: number
	page?: number
	gl?: string
	hl?: string
}

export interface SerperSitelink {
	title: string
	link: string
}

export interface SerperSearchResult {
	title: string
	link: string
	snippet: string
	position: number
	sitelinks?: SerperSitelink[]
	date?: string
}

export interface SerperKnowledgeGraph {
	title: string
	description: string
	descriptionSource: string
	descriptionLink: string
	attributes: Record<string, string>
}

export interface SerperPeopleAlsoAsk {
	question: string
	snippet: string
	title: string
	link: string
}

export interface SerperRelatedSearch {
	query: string
}

export interface SerperShoppingProduct {
	title: string
	source: string
	link: string
	price: string
	imageUrl: string
	rating?: number
	ratingCount?: number
	productId: string
	position: number
}

export interface SerperSearchResponse {
	searchParameters: {
		q: string
		type: string
		num: number
		engine: string
	}
	knowledgeGraph?: SerperKnowledgeGraph
	organic: SerperSearchResult[]
	peopleAlsoAsk?: SerperPeopleAlsoAsk[]
	relatedSearches?: SerperRelatedSearch[]
	credits: number
}

export interface SerperShoppingResponse {
	searchParameters: {
		q: string
		type: string
		num: number
		page: number
		engine: string
	}
	shopping: SerperShoppingProduct[]
	credits: number
}

export interface SerperError {
	message: string
	status?: number
	details?: any
}

/**
 * Serper API wrapper class
 */
export class SerperAPI {
	private apiKey: string
	private baseUrl: string

	constructor() {
		this.apiKey = process.env.SERPER_API_KEY || ''
		this.baseUrl = process.env.SERPER_API_URL || 'https://google.serper.dev'

		if (!this.apiKey) {
			throw new Error('SERPER_API_KEY environment variable is required')
		}
	}

	/**
	 * Perform a web search using Serper API
	 */
	async search(request: SerperSearchRequest): Promise<SerperSearchResponse> {
		try {
			const config = {
				method: 'post',
				maxBodyLength: Infinity,
				url: `${this.baseUrl}/search`,
				headers: {
					'X-API-KEY': this.apiKey,
					'Content-Type': 'application/json',
				},
				data: JSON.stringify(request),
			}

			const response = await axios.request(config)
			return response.data
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const serperError: SerperError = {
					message: error.response?.data?.message || error.message,
					status: error.response?.status,
					details: error.response?.data,
				}
				throw serperError
			}
			throw {
				message:
					error && typeof error === 'object' && 'message' in error
						? String(error.message)
						: 'Unknown error occurred',
			}
		}
	}

	/**
	 * Search for a specific query with default parameters
	 */
	async searchQuery(query: string, num = 10): Promise<SerperSearchResponse> {
		return this.search({
			q: query,
			num,
			page: 1,
			gl: 'us',
			hl: 'en',
			autocorrect: true,
			safe: true,
		})
	}

	/**
	 * Get search results as a formatted string for LLM consumption
	 */
	async getFormattedResults(query: string, num = 5): Promise<string> {
		try {
			const response = await this.searchQuery(query, num)

			let formattedResults = `Search Results for: "${query}"\n\n`

			// Add knowledge graph information if available
			if (response.knowledgeGraph) {
				formattedResults += 'Knowledge Graph:\n'
				formattedResults += `Title: ${response.knowledgeGraph.title}\n`
				formattedResults += `Description: ${response.knowledgeGraph.description}\n`
				formattedResults += `Source: ${response.knowledgeGraph.descriptionSource}\n`
				formattedResults += `Link: ${response.knowledgeGraph.descriptionLink}\n`

				if (Object.keys(response.knowledgeGraph.attributes).length > 0) {
					formattedResults += 'Attributes:\n'
					Object.entries(response.knowledgeGraph.attributes).forEach(
						([key, value]) => {
							formattedResults += `  ${key}: ${value}\n`
						}
					)
				}
				formattedResults += '\n'
			}

			if (response.organic && response.organic.length > 0) {
				formattedResults += 'Top Results:\n'
				response.organic.forEach(
					(result: SerperSearchResult, index: number) => {
						formattedResults += `${index + 1}. ${result.title}\n`
						formattedResults += `   URL: ${result.link}\n`
						formattedResults += `   Snippet: ${result.snippet}\n`
						if (result.date) {
							formattedResults += `   Date: ${result.date}\n`
						}
						if (result.sitelinks && result.sitelinks.length > 0) {
							formattedResults += `   Quick Links: ${result.sitelinks.map(sl => sl.title).join(', ')}\n`
						}
						formattedResults += '\n'
					}
				)
			}

			if (response.peopleAlsoAsk && response.peopleAlsoAsk.length > 0) {
				formattedResults += 'People Also Ask:\n'
				response.peopleAlsoAsk.forEach(
					(qa: SerperPeopleAlsoAsk, index: number) => {
						formattedResults += `${index + 1}. Q: ${qa.question}\n`
						formattedResults += `   A: ${qa.snippet}\n`
						formattedResults += `   Source: ${qa.title}\n\n`
					}
				)
			}

			if (response.relatedSearches && response.relatedSearches.length > 0) {
				formattedResults += 'Related Searches:\n'
				response.relatedSearches.forEach(
					(search: SerperRelatedSearch, index: number) => {
						formattedResults += `${index + 1}. ${search.query}\n`
					}
				)
			}

			return formattedResults
		} catch (error) {
			return `Error performing search for "${query}": ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`
		}
	}

	/**
	 * Perform a shopping search using Serper API
	 */
	async shopping(
		request: SerperShoppingRequest
	): Promise<SerperShoppingResponse> {
		try {
			const config = {
				method: 'post',
				maxBodyLength: Infinity,
				url: `${this.baseUrl}/shopping`,
				headers: {
					'X-API-KEY': this.apiKey,
					'Content-Type': 'application/json',
				},
				data: JSON.stringify(request),
			}

			const response = await axios.request(config)
			return response.data
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const serperError: SerperError = {
					message: error.response?.data?.message || error.message,
					status: error.response?.status,
					details: error.response?.data,
				}
				throw serperError
			}
			throw {
				message:
					error && typeof error === 'object' && 'message' in error
						? String(error.message)
						: 'Unknown error occurred',
			}
		}
	}

	/**
	 * Search for shopping products with default parameters
	 */
	async shoppingQuery(
		query: string,
		num = 20
	): Promise<SerperShoppingResponse> {
		return this.shopping({
			q: query,
			num,
			page: 1,
			gl: 'us',
			hl: 'en',
		})
	}

	/**
	 * Get shopping results as a formatted string for LLM consumption
	 */
	async getFormattedShoppingResults(
		query: string,
		num = 10
	): Promise<{ formattedResults: string; response: SerperShoppingResponse }> {
		try {
			const response = await this.shoppingQuery(query, num)

			let formattedResults = `Shopping Results for: "${query}"\n\n`

			if (response.shopping && response.shopping.length > 0) {
				formattedResults += 'Products:\n'
				response.shopping.forEach(
					(product: SerperShoppingProduct, index: number) => {
						formattedResults += `${index + 1}. ${product.title}\n`
						formattedResults += `   Price: ${product.price}\n`
						formattedResults += `   Source: ${product.source}\n`
						formattedResults += `   Link: ${product.link}\n`
						if (product.rating) {
							formattedResults += `   Rating: ${product.rating}/5 (${product.ratingCount} reviews)\n`
						}
						formattedResults += `   Product ID: ${product.productId}\n\n`
					}
				)
			}

			return { formattedResults, response }
		} catch (error) {
			return {
				formattedResults: `Error performing shopping search for "${query}": ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`,
				response: {
					shopping: [],
					credits: 0,
					searchParameters: {
						q: query,
						type: 'shopping',
						num,
						page: 1,
						engine: 'google',
					},
				},
			}
		}
	}
}

// Export a singleton instance
export const serperAPI = new SerperAPI()
