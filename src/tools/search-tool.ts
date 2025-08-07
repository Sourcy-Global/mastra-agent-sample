import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

import { alibabaAPI } from '@/api/alibaba.js'
import { api1688 } from '@/api/1688.js'
import { serperAPI } from '@/api/serper.js'

interface SearchResult {
	title: string
	link: string
	snippet: string
	position: number
	source: 'web' | 'shopping' | '1688' | '1688-en' | 'alibaba'
}

interface SearchResponse {
	query: string
	results: SearchResult[]
	totalResults: number
	searchType: 'web' | 'shopping' | '1688' | '1688-en' | 'alibaba'
	formattedSummary: string
	relatedQueries?: string[]
}

export const webSearchTool = createTool({
	id: 'web-search',
	description: 'Perform web search to find current information on any topic',
	inputSchema: z.object({
		query: z.string().describe('Search query to find information about'),
		maxResults: z
			.number()
			.optional()
			.default(10)
			.describe('Maximum number of results to return (default: 10)'),
	}),
	outputSchema: z.object({
		query: z.string(),
		results: z.array(
			z.object({
				title: z.string(),
				link: z.string(),
				snippet: z.string(),
				position: z.number(),
				source: z.enum(['web', 'shopping', '1688', '1688-en', 'alibaba']),
			})
		),
		totalResults: z.number(),
		searchType: z.enum(['web', 'shopping', '1688', '1688-en', 'alibaba']),
		formattedSummary: z.string(),
		relatedQueries: z.array(z.string()).optional(),
	}),
	execute: async ({ context }) => {
		return await performWebSearch(context.query, context.maxResults)
	},
})

export const shoppingSearchTool = createTool({
	id: 'shopping-search',
	description: 'Search for products and shopping information',
	inputSchema: z.object({
		query: z.string().describe('Product or shopping search query'),
		maxResults: z
			.number()
			.optional()
			.default(20)
			.describe('Maximum number of products to return (default: 20)'),
	}),
	outputSchema: z.object({
		query: z.string(),
		results: z.array(
			z.object({
				title: z.string(),
				link: z.string(),
				snippet: z.string(),
				position: z.number(),
				source: z.enum(['web', 'shopping', '1688', '1688-en', 'alibaba']),
			})
		),
		totalResults: z.number(),
		searchType: z.enum(['web', 'shopping', '1688', '1688-en', 'alibaba']),
		formattedSummary: z.string(),
		relatedQueries: z.array(z.string()).optional(),
	}),
	execute: async ({ context }) => {
		return await performShoppingSearch(context.query, context.maxResults)
	},
})

export const search1688Tool = createTool({
	id: '1688-search',
	description:
		'Search for products on 1688.com (Chinese B2B marketplace) in Chinese',
	inputSchema: z.object({
		query: z.string().describe('Product search query in Chinese or English'),
		page: z.number().optional().default(1).describe('Page number (default: 1)'),
		maxResults: z
			.number()
			.optional()
			.default(10)
			.describe('Maximum number of products to return (default: 10)'),
		sort: z
			.enum(['default', 'price_asc', 'price_desc', 'sales_desc', 'newest'])
			.optional()
			.default('default')
			.describe('Sort order for results'),
	}),
	outputSchema: z.object({
		query: z.string(),
		results: z.array(
			z.object({
				title: z.string(),
				link: z.string(),
				snippet: z.string(),
				position: z.number(),
				source: z.literal('1688'),
			})
		),
		totalResults: z.number(),
		searchType: z.literal('1688'),
		formattedSummary: z.string(),
	}),
	execute: async ({ context }) => {
		return await perform1688Search(
			context.query,
			context.page,
			context.maxResults,
			context.sort
		)
	},
})

export const search1688EnglishTool = createTool({
	id: '1688-search-english',
	description:
		'Search for products on 1688.com (Chinese B2B marketplace) in English',
	inputSchema: z.object({
		query: z.string().describe('Product search query in English'),
		page: z.number().optional().default(1).describe('Page number (default: 1)'),
		maxResults: z
			.number()
			.optional()
			.default(10)
			.describe('Maximum number of products to return (default: 10)'),
		sort: z
			.enum(['default', 'price_asc', 'price_desc', 'sales_desc', 'newest'])
			.optional()
			.default('default')
			.describe('Sort order for results'),
	}),
	outputSchema: z.object({
		query: z.string(),
		results: z.array(
			z.object({
				title: z.string(),
				link: z.string(),
				snippet: z.string(),
				position: z.number(),
				source: z.literal('1688-en'),
			})
		),
		totalResults: z.number(),
		searchType: z.literal('1688-en'),
		formattedSummary: z.string(),
	}),
	execute: async ({ context }) => {
		return await perform1688EnglishSearch(
			context.query,
			context.page,
			context.maxResults,
			context.sort
		)
	},
})

export const searchAlibabaTool = createTool({
	id: 'alibaba-search',
	description:
		'Search for products on Alibaba.com (International B2B marketplace)',
	inputSchema: z.object({
		query: z.string().describe('Product search query'),
		page: z.number().optional().default(1).describe('Page number (default: 1)'),
		maxResults: z
			.number()
			.optional()
			.default(10)
			.describe('Maximum number of products to return (default: 10)'),
		sort: z
			.enum(['relevance', 'price_asc', 'price_desc', 'sales_desc', 'newest'])
			.optional()
			.default('relevance')
			.describe('Sort order for results'),
	}),
	outputSchema: z.object({
		query: z.string(),
		results: z.array(
			z.object({
				title: z.string(),
				link: z.string(),
				snippet: z.string(),
				position: z.number(),
				source: z.literal('alibaba'),
			})
		),
		totalResults: z.number(),
		searchType: z.literal('alibaba'),
		formattedSummary: z.string(),
	}),
	execute: async ({ context }) => {
		return await performAlibabaSearch(
			context.query,
			context.page,
			context.maxResults,
			context.sort
		)
	},
})

async function performWebSearch(
	query: string,
	maxResults = 10
): Promise<SearchResponse> {
	try {
		const response = await serperAPI.searchQuery(query, maxResults)

		const results: SearchResult[] =
			response.organic?.map(result => ({
				title: result.title,
				link: result.link,
				snippet: result.snippet,
				position: result.position,
				source: 'web' as const,
			})) || []

		const formattedSummary = await serperAPI.getFormattedResults(
			query,
			maxResults
		)

		const relatedQueries =
			response.relatedSearches?.map(search => search.query) || []

		return {
			query,
			results,
			totalResults: results.length,
			searchType: 'web',
			formattedSummary,
			relatedQueries,
		}
	} catch (error) {
		const errorMessage =
			error && typeof error === 'object' && 'message' in error
				? String(error.message)
				: 'Unknown search error'

		return {
			query,
			results: [],
			totalResults: 0,
			searchType: 'web',
			formattedSummary: `Error performing web search for "${query}": ${errorMessage}`,
			relatedQueries: [],
		}
	}
}

async function performShoppingSearch(
	query: string,
	maxResults = 20
): Promise<SearchResponse> {
	try {
		const { response } = await serperAPI.getFormattedShoppingResults(
			query,
			maxResults
		)

		const results: SearchResult[] =
			response.shopping?.map(product => ({
				title: product.title,
				link: product.link,
				snippet: `${product.price} - ${product.source}${
					product.rating ? ` (${product.rating}⭐)` : ''
				}`,
				position: product.position,
				source: 'shopping' as const,
			})) || []

		const formattedSummary = (
			await serperAPI.getFormattedShoppingResults(query, maxResults)
		).formattedResults

		return {
			query,
			results,
			totalResults: results.length,
			searchType: 'shopping',
			formattedSummary,
		}
	} catch (error) {
		const errorMessage =
			error && typeof error === 'object' && 'message' in error
				? String(error.message)
				: 'Unknown shopping search error'

		return {
			query,
			results: [],
			totalResults: 0,
			searchType: 'shopping',
			formattedSummary: `Error performing shopping search for "${query}": ${errorMessage}`,
		}
	}
}

async function perform1688Search(
	query: string,
	page = 1,
	maxResults = 10,
	sort:
		| 'default'
		| 'price_asc'
		| 'price_desc'
		| 'sales_desc'
		| 'newest' = 'default'
): Promise<{
	query: string
	results: Array<{
		title: string
		link: string
		snippet: string
		position: number
		source: '1688'
	}>
	totalResults: number
	searchType: '1688'
	formattedSummary: string
}> {
	try {
		const response = await api1688.searchQuery_CN(query, page, maxResults, sort)

		const results =
			response.data.items?.map((item, index) => ({
				title: item.title,
				link: item.product_url,
				snippet: `${item.price} CNY - ${item.shop_info.company_name} | MOQ: ${
					item.sale_info.sale_quantity || 'N/A'
				}`,
				position: index + 1,
				source: '1688' as const,
			})) || []

		const formattedSummary = await api1688.getFormattedSearchResults_CN(
			query,
			page,
			maxResults
		)

		return {
			query,
			results,
			totalResults: results.length,
			searchType: '1688',
			formattedSummary,
		}
	} catch (error) {
		const errorMessage =
			error && typeof error === 'object' && 'message' in error
				? String(error.message)
				: 'Unknown 1688 search error'

		return {
			query,
			results: [],
			totalResults: 0,
			searchType: '1688',
			formattedSummary: `Error performing 1688 search for "${query}": ${errorMessage}`,
		}
	}
}

async function perform1688EnglishSearch(
	query: string,
	page = 1,
	maxResults = 10,
	sort:
		| 'default'
		| 'price_asc'
		| 'price_desc'
		| 'sales_desc'
		| 'newest' = 'default'
): Promise<{
	query: string
	results: Array<{
		title: string
		link: string
		snippet: string
		position: number
		source: '1688-en'
	}>
	totalResults: number
	searchType: '1688-en'
	formattedSummary: string
}> {
	try {
		const response = await api1688.searchQuery_EN(query, page, maxResults, sort)

		const results =
			response.data.items?.map((item, index) => ({
				title: item.title,
				link: item.product_url,
				snippet: `${item.price} CNY - ${item.shop_info.company_name} | MOQ: ${
					item.sale_info.sale_quantity || 'N/A'
				}`,
				position: index + 1,
				source: '1688-en' as const,
			})) || []

		const formattedSummary = await api1688.getFormattedSearchResults_EN(
			query,
			page,
			maxResults
		)

		return {
			query,
			results,
			totalResults: results.length,
			searchType: '1688-en',
			formattedSummary,
		}
	} catch (error) {
		const errorMessage =
			error && typeof error === 'object' && 'message' in error
				? String(error.message)
				: 'Unknown 1688 English search error'

		return {
			query,
			results: [],
			totalResults: 0,
			searchType: '1688-en',
			formattedSummary: `Error performing 1688 English search for "${query}": ${errorMessage}`,
		}
	}
}

async function performAlibabaSearch(
	query: string,
	page = 1,
	maxResults = 10,
	sort:
		| 'relevance'
		| 'price_asc'
		| 'price_desc'
		| 'sales_desc'
		| 'newest' = 'relevance'
): Promise<{
	query: string
	results: Array<{
		title: string
		link: string
		snippet: string
		position: number
		source: 'alibaba'
	}>
	totalResults: number
	searchType: 'alibaba'
	formattedSummary: string
}> {
	try {
		const response = await alibabaAPI.searchQuery(query, page, maxResults, sort)

		const results =
			response.data.items?.map((item, index) => ({
				title: item.title,
				link: `https://www.alibaba.com/product-detail/${item.item_id}.html`,
				snippet: `${item.price} USD - ${item.shop_info.company_name} | MOQ: ${item.min_order_quantity} ${item.unit}`,
				position: index + 1,
				source: 'alibaba' as const,
			})) || []

		const formattedSummary = await alibabaAPI.getFormattedSearchResults(
			query,
			page,
			maxResults
		)

		return {
			query,
			results,
			totalResults: results.length,
			searchType: 'alibaba',
			formattedSummary,
		}
	} catch (error) {
		const errorMessage =
			error && typeof error === 'object' && 'message' in error
				? String(error.message)
				: 'Unknown Alibaba search error'

		return {
			query,
			results: [],
			totalResults: 0,
			searchType: 'alibaba',
			formattedSummary: `Error performing Alibaba search for "${query}": ${errorMessage}`,
		}
	}
}
