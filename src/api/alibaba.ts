import axios from 'axios'
import * as dotenv from 'dotenv'
import { retry } from './index.js'

// Load environment variables
dotenv.config()

// Types for the Alibaba API
export interface AlibabaSearchRequest {
	apiToken: string
	keywords: string
	page?: number
	page_size?: number
	sort?: 'relevance' | 'price_asc' | 'price_desc' | 'sales_desc' | 'newest'
	price_start?: string
	price_end?: string
}

export interface AlibabaDetailRequest {
	apiToken: string
	url: string
}

export interface AlibabaPriceInfo {
	price_text: string
	price_min: string
	price_max: string
}

export interface AlibabaShopInfo {
	company_name: string
	company_id: string
	company_region: string
	seller_id: string
	member_id: string
	is_verified_supplier: boolean
	chat_url: string
}

export interface AlibabaSearchItem {
	item_id: string
	title: string
	img: string
	category_id: string
	price: string
	price_info: AlibabaPriceInfo
	comment_count: number
	shop_info: AlibabaShopInfo
	min_order_quantity: string
	unit: string
}

export interface AlibabaSearchResponse {
	code: number
	msg: string
	data: {
		page: number
		page_size: number
		total_count: number
		keywords: string
		sort: string
		filters: {
			price_start: string
			price_end: string
		}
		items: AlibabaSearchItem[]
	}
}

export interface AlibabaError {
	message: string
	status?: number
	details?: any
}

// Detail API Types
export interface AlibabaCategoryPath {
	id: string
	name: string
}

export interface AlibabaProductProp {
	key: string
	value: string
}

export interface AlibabaCustomizationOption {
	custom_type: string
	min_order_quantity: number
}

export interface AlibabaReviewInfo {
	rating_star: number | null
	review_count: number
}

export interface AlibabaShopRate {
	average_star: string
	scores: Array<{
		type: string
		score: string
	}>
}

export interface AlibabaDetailShopInfo {
	company_name: string
	company_id: number
	company_type: string
	company_region: string
	opening_years: string
	seller_id: number
	member_id: number
	login_id: string
	contact_name: string
	shop_url: string
	shop_rate: AlibabaShopRate
	response_time: string
	ontime_delivery_rate: string
	is_company_auth: boolean
	is_gold_supplier: boolean
	is_top_supplier: boolean
	is_dispatch_guaranteed: boolean
}

export interface AlibabaDeliveryInfo {
	area_from: string
	delivery_days: number
	unit_weight: string
	unit_size: string
}

export interface AlibabaSkuPropValue {
	name: string
	vid: string
	imageUrl: string
}

export interface AlibabaSkuProp {
	pid: string
	prop_name: string
	values: AlibabaSkuPropValue[]
}

export interface AlibabaSku {
	skuid: string
	sale_price: string
	origin_price: string
	sample_price: string
	stock: number
	props_ids: string
	props_names: string
}

export interface AlibabaDetailResponse {
	code: number
	msg: string
	data: {
		item_id: number
		title: string
		product_url: string
		category_path: AlibabaCategoryPath[]
		category_id: number
		currency: string
		product_props: AlibabaProductProp[]
		main_imgs: string[]
		video_url?: string
		price_info: {
			price_text: string
			price_min: string
			price_max: string
		}
		tiered_price_info: any | null
		comment_count: number
		customization_options: AlibabaCustomizationOption[]
		certifications: any[]
		review_info: AlibabaReviewInfo
		sales_count: string
		shop_info: AlibabaDetailShopInfo
		delivery_info: AlibabaDeliveryInfo
		sku_props: AlibabaSkuProp[]
		skus: AlibabaSku[]
		min_order_quantity: number
		unit: string
	}
}

/**
 * Alibaba API wrapper class
 */
export class AlibabaAPI {
	private apiToken: string
	private baseUrl: string

	constructor() {
		this.apiToken = process.env.API_1688_TOKEN || '' // Using same token as 1688
		this.baseUrl = process.env.API_1688_BASE_URL || 'http://api.tmapi.top'

		if (!this.apiToken) {
			throw new Error('API_1688_TOKEN environment variable is required')
		}
	}

	/**
	 * Search for products using Alibaba API
	 */
	async search(
		request: Omit<AlibabaSearchRequest, 'apiToken'>
	): Promise<AlibabaSearchResponse> {
		return retry(async () => {
			const config = {
				method: 'GET',
				url: `${this.baseUrl}/alibaba/search/items`,
				params: {
					apiToken: this.apiToken,
					...request,
				},
			}

			const response = await axios.request(config)
			return response.data
		})
	}

	/**
	 * Search for products with default parameters
	 */
	async searchQuery(
		keywords: string,
		page = 1,
		page_size = 20,
		sort:
			| 'relevance'
			| 'price_asc'
			| 'price_desc'
			| 'sales_desc'
			| 'newest' = 'relevance'
	): Promise<AlibabaSearchResponse> {
		return this.search({
			keywords,
			page,
			page_size,
			sort,
		})
	}

	/**
	 * Get search results as a formatted string for LLM consumption
	 */
	async getFormattedSearchResults(
		keywords: string,
		page = 1,
		page_size = 10
	): Promise<string> {
		try {
			const response = await this.searchQuery(keywords, page, page_size)

			let formattedResults = `Alibaba Search Results for: "${keywords}"\n\n`
			formattedResults += `Total Results: ${response.data.total_count}\n`
			formattedResults += `Page: ${response.data.page}/${Math.ceil(response.data.total_count / response.data.page_size)}\n`
			formattedResults += `Sort: ${response.data.sort}\n\n`

			if (response.data.items && response.data.items.length > 0) {
				formattedResults += 'Products:\n'
				response.data.items.forEach(
					(item: AlibabaSearchItem, index: number) => {
						formattedResults += `${index + 1}. ${item.title}\n`
						formattedResults += `   Item ID: ${item.item_id}\n`
						formattedResults += `   Price: ${item.price} USD\n`
						formattedResults += `   Price Range: ${item.price_info.price_text}\n`
						formattedResults += `   Image: ${item.img}\n`
						formattedResults += `   Category ID: ${item.category_id}\n`
						formattedResults += `   Shop: ${item.shop_info.company_name} (${item.shop_info.company_id})\n`
						formattedResults += `   Seller ID: ${item.shop_info.seller_id}\n`
						formattedResults += `   Member ID: ${item.shop_info.member_id}\n`
						formattedResults += `   Verified Supplier: ${item.shop_info.is_verified_supplier}\n`
						formattedResults += `   Region: ${item.shop_info.company_region}\n`
						formattedResults += `   Min Order: ${item.min_order_quantity} ${item.unit}\n`
						formattedResults += `   Comments: ${item.comment_count}\n`
						formattedResults += '\n'
					}
				)
			} else {
				formattedResults += 'No products found.\n'
			}

			return formattedResults
		} catch (error) {
			return `Error performing Alibaba search for "${keywords}": ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`
		}
	}

	/**
	 * Search and get detailed information for products
	 */
	async searchWithDetails(
		keywords: string,
		page = 1,
		page_size = 5
	): Promise<{ searchResults: string }> {
		try {
			const searchResults = await this.getFormattedSearchResults(
				keywords,
				page,
				page_size
			)

			return { searchResults }
		} catch (error) {
			return {
				searchResults: `Error performing Alibaba search for "${keywords}": ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`,
			}
		}
	}

	/**
	 * Get product details using Alibaba API
	 */
	async getDetail(
		request: Omit<AlibabaDetailRequest, 'apiToken'>
	): Promise<AlibabaDetailResponse> {
		return retry(async () => {
			const config = {
				method: 'POST',
				url: `${this.baseUrl}/alibaba/item_detail_by_url`,
				params: {
					apiToken: this.apiToken,
				},
				headers: {
					'Content-Type': 'application/json',
				},
				data: {
					url: request.url,
				},
			}

			const response = await axios.request(config)
			return response.data
		})
	}

	/**
	 * Get product details by product URL
	 */
	async getDetailByUrl(productUrl: string): Promise<AlibabaDetailResponse> {
		return this.getDetail({ url: productUrl })
	}

	/**
	 * Get product details as a formatted string for LLM consumption
	 */
	async getFormattedDetailResults(productUrl: string): Promise<string> {
		try {
			const response = await this.getDetailByUrl(productUrl)

			let formattedResults = `Alibaba Product Details for URL: ${productUrl}\n\n`

			const data = response.data
			formattedResults += `Title: ${data.title}\n`
			formattedResults += `Product URL: ${data.product_url}\n`
			formattedResults += `Item ID: ${data.item_id}\n`
			formattedResults += `Category ID: ${data.category_id}\n`
			formattedResults += `Currency: ${data.currency}\n\n`

			// Category path
			if (data.category_path && data.category_path.length > 0) {
				formattedResults += 'Category Path:\n'
				data.category_path.forEach(cat => {
					formattedResults += `  ${cat.name} (ID: ${cat.id})\n`
				})
				formattedResults += '\n'
			}

			// Price information
			formattedResults += 'Price Information:\n'
			formattedResults += `  Price Text: ${data.price_info.price_text}\n`
			formattedResults += `  Price Range: ${data.price_info.price_min} - ${data.price_info.price_max} ${data.currency}\n\n`

			// Sales information
			formattedResults += 'Sales Information:\n'
			formattedResults += `  Sales Count: ${data.sales_count || 'N/A'}\n`
			formattedResults += `  Comment Count: ${data.comment_count}\n`
			formattedResults += `  Min Order Quantity: ${data.min_order_quantity} ${data.unit}\n\n`

			// Shop information
			formattedResults += 'Shop Information:\n'
			formattedResults += `  Company Name: ${data.shop_info.company_name}\n`
			formattedResults += `  Company ID: ${data.shop_info.company_id}\n`
			formattedResults += `  Company Type: ${data.shop_info.company_type}\n`
			formattedResults += `  Region: ${data.shop_info.company_region}\n`
			formattedResults += `  Opening Years: ${data.shop_info.opening_years}\n`
			formattedResults += `  Seller ID: ${data.shop_info.seller_id}\n`
			formattedResults += `  Member ID: ${data.shop_info.member_id}\n`
			formattedResults += `  Login ID: ${data.shop_info.login_id}\n`
			formattedResults += `  Contact: ${data.shop_info.contact_name}\n`
			formattedResults += `  Shop URL: ${data.shop_info.shop_url}\n`
			formattedResults += `  Response Time: ${data.shop_info.response_time}\n`
			formattedResults += `  On-time Delivery Rate: ${data.shop_info.ontime_delivery_rate}\n`
			formattedResults += `  Company Auth: ${data.shop_info.is_company_auth}\n`
			formattedResults += `  Gold Supplier: ${data.shop_info.is_gold_supplier}\n`
			formattedResults += `  Top Supplier: ${data.shop_info.is_top_supplier}\n`
			formattedResults += `  Dispatch Guaranteed: ${data.shop_info.is_dispatch_guaranteed}\n\n`

			// Shop ratings
			formattedResults += 'Shop Ratings:\n'
			formattedResults += `  Average Star: ${data.shop_info.shop_rate.average_star}\n`
			data.shop_info.shop_rate.scores.forEach(score => {
				formattedResults += `  ${score.type}: ${score.score}\n`
			})
			formattedResults += '\n'

			// Delivery information
			formattedResults += 'Delivery Information:\n'
			formattedResults += `  Area From: ${data.delivery_info.area_from || 'N/A'}\n`
			formattedResults += `  Delivery Days: ${data.delivery_info.delivery_days}\n`
			formattedResults += `  Unit Weight: ${data.delivery_info.unit_weight} kg\n`
			formattedResults += `  Unit Size: ${data.delivery_info.unit_size}\n\n`

			// Product properties
			if (data.product_props && data.product_props.length > 0) {
				formattedResults += 'Product Properties:\n'
				data.product_props.forEach(prop => {
					formattedResults += `  ${prop.key}: ${prop.value}\n`
				})
				formattedResults += '\n'
			}

			// Customization options
			if (data.customization_options && data.customization_options.length > 0) {
				formattedResults += 'Customization Options:\n'
				data.customization_options.forEach(option => {
					formattedResults += `  ${option.custom_type}: Min Order ${option.min_order_quantity}\n`
				})
				formattedResults += '\n'
			}

			// Review information
			formattedResults += 'Review Information:\n'
			formattedResults += `  Rating Star: ${data.review_info.rating_star || 'N/A'}\n`
			formattedResults += `  Review Count: ${data.review_info.review_count}\n\n`

			// SKU properties
			if (data.sku_props && data.sku_props.length > 0) {
				formattedResults += 'SKU Properties:\n'
				data.sku_props.forEach(prop => {
					formattedResults += `  ${prop.prop_name}: ${prop.values.map(v => v.name).join(', ')}\n`
				})
				formattedResults += '\n'
			}

			// SKU variants
			if (data.skus && data.skus.length > 0) {
				formattedResults += 'SKU Variants:\n'
				data.skus.slice(0, 10).forEach((sku, index) => {
					// Limit to first 10 SKUs
					formattedResults += `  ${index + 1}. ${sku.props_names}\n`
					formattedResults += `     Sale Price: ${sku.sale_price} ${data.currency}\n`
					formattedResults += `     Origin Price: ${sku.origin_price} ${data.currency}\n`
					formattedResults += `     Sample Price: ${sku.sample_price} ${data.currency}\n`
					formattedResults += `     Stock: ${sku.stock}\n`
				})
				if (data.skus.length > 10) {
					formattedResults += `  ... and ${data.skus.length - 10} more variants\n`
				}
				formattedResults += '\n'
			}

			// Images
			if (data.main_imgs && data.main_imgs.length > 0) {
				formattedResults += `Main Images (${data.main_imgs.length}):\n`
				data.main_imgs.slice(0, 5).forEach((img, index) => {
					formattedResults += `  ${index + 1}. ${img}\n`
				})
				if (data.main_imgs.length > 5) {
					formattedResults += `  ... and ${data.main_imgs.length - 5} more images\n`
				}
				formattedResults += '\n'
			}

			// Video
			if (data.video_url) {
				formattedResults += `Video URL: ${data.video_url}\n\n`
			}

			return formattedResults
		} catch (error) {
			return `Error getting Alibaba product details for URL "${productUrl}": ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`
		}
	}
}

// Export a singleton instance
export const alibabaAPI = new AlibabaAPI()
