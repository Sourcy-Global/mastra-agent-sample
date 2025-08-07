import axios from 'axios'
import * as dotenv from 'dotenv'
import { retry } from './index.js'

// Load environment variables
dotenv.config()

// Types for the 1688 API
export interface Api1688SearchRequest {
	apiToken: string
	keyword: string
	page?: number
	page_size?: number
	sort?: 'default' | 'price_asc' | 'price_desc' | 'sales_desc' | 'newest'
	price_start?: string
	price_end?: string
}

export interface Api1688DetailRequest {
	apiToken: string
	item_id: string
}

export interface Api1688QuantityPrice {
	begin_num: string
	end_num: string
	price: string
}

export interface Api1688PriceInfo {
	sale_price: string
	origin_price: string
}

export interface Api1688SaleInfo {
	sale_quantity?: string
	sale_quantity_int?: number
	orders_count: number
}

export interface Api1688DeliveryInfo {
	area_from: string[]
}

export interface Api1688ShopScoreInfo {
	composite_new_score: string
	consultation_score: string
	dispute_score: string
	logistics_score: string
	return_score: string
}

export interface Api1688ShopInfo {
	login_id: string
	member_id: string
	biz_type: string
	company_name: string
	service_tags: string[]
	is_tp: boolean
	is_super_factory: boolean
	factory_inspection: boolean
	sore_info: Api1688ShopScoreInfo
}

export interface Api1688SearchItem {
	item_id: string
	product_url: string
	title: string
	img: string
	category_path: string[]
	price: string
	price_info: Api1688PriceInfo
	quantity_prices: Api1688QuantityPrice[]
	sale_info: Api1688SaleInfo
	type: string
	delivery_info: Api1688DeliveryInfo
	item_repurchase_rate: string
	goods_score: string
	tags: string[]
	shop_info: Api1688ShopInfo
}

export interface Api1688SearchResponse {
	code: number
	msg: string
	data: {
		page: number
		page_size: number
		total_count: number
		keyword: string
		sort: string
		price_start: string
		price_end: string
		items: Api1688SearchItem[]
	}
}

export interface Api1688ProductProp {
	[key: string]: string
}

export interface Api1688TieredPrice {
	beginAmount: string
	price: string
}

export interface Api1688TieredPriceInfo {
	begin_num: number
	prices: Api1688TieredPrice[]
}

export interface Api1688MixedBatch {
	mix_amount: number
	mix_begin: number
	mix_num: number
	shop_mix_num: number
}

export interface Api1688DetailShopInfo {
	shop_name: string
	shop_url: string
	seller_login_id: string
	seller_user_id: string
	seller_member_id: string
}

export interface Api1688DetailDeliveryInfo {
	location: string
	location_code: string
	delivery_fee: number
	unit_weight: number
	template_id: string
}

export interface Api1688SkuPriceRange {
	begin_num: number
	stock: number
	sku_param: Api1688TieredPrice[]
	mix_param: {
		mixNum: number
		mixAmount: number
		shopMixNum: number
		mixBegin: number
		supportMix: boolean
	}
}

export interface Api1688SkuPropValue {
	vid: string
	name: string
	imageUrl?: string
}

export interface Api1688SkuProp {
	pid: string
	prop_name: string
	values: Api1688SkuPropValue[]
}

export interface Api1688SkuPackageInfo {
	weight: number
	length: number
	width: number
	height: number
	volume: number
}

export interface Api1688Sku {
	skuid: string
	specid: string
	sale_price: string
	origin_price: string | null
	stock: number
	props_ids: string
	props_names: string
	sale_count: number
	package_info: Api1688SkuPackageInfo
}

export interface Api1688DetailResponse {
	code: number
	msg: string
	data: {
		item_id: string
		product_url: string
		title: string
		category_id: number
		root_category_id: number
		currency: string
		offer_unit: string
		product_props: Api1688ProductProp[]
		main_imgs: string[]
		video_url?: string
		detail_url: string
		sale_count: string
		sale_info: {
			sale_quantity_90days: number
		}
		price_info: {
			price: string
			price_min: string
			price_max: string
			origin_price_min: string | null
			origin_price_max: string | null
			discount_price: string
		}
		tiered_price_info: Api1688TieredPriceInfo
		mixed_batch: Api1688MixedBatch
		shop_info: Api1688DetailShopInfo
		delivery_info: Api1688DetailDeliveryInfo
		service_tags: string[]
		sku_price_scale: string
		sku_price_scale_original: string
		sku_price_range: Api1688SkuPriceRange
		sku_props: Api1688SkuProp[]
		skus: Api1688Sku[]
		is_sold_out: boolean
		stock: number
		promotions: any[]
	}
}

// Review API Types
export interface Api1688ReviewRequest {
	apiToken: string
	item_id: string
	page?: number
	sort_type?: 'default' | 'time_desc' | 'time_asc' | 'star_desc' | 'star_asc'
}

export interface Api1688ReviewItem {
	id: number
	feedback: string
	feedback_date: string
	rate_star: number
	sku_map: string
	user_nick: string
}

export interface Api1688ReviewResponse {
	code: number
	msg: string
	data: {
		item_id: string
		page: number
		page_size: number
		sort_type: string
		list: Api1688ReviewItem[]
	}
}

// Supplier Info API Types
export interface Api1688SupplierRequest {
	apiToken: string
	shop_url: string
	member_id: string
}

export interface Api1688ShopRating {
	title: string
	type: string
	score: string
}

export interface Api1688SupplierResponse {
	code: number
	msg: string
	data: {
		member_id: string
		seller_id: number
		company_id: number
		company_name: string
		contact_phone: string
		shop_url: string
		shop_logo: string
		shop_name: string
		chat_url: string
		location_str: string
		is_industry_brand: boolean
		is_factory: boolean
		is_super_factory: boolean
		is_flagship_shop: boolean
		is_tp: boolean
		tp_year: number
		favorite_count: number
		shop_ratings: Api1688ShopRating[]
	}
}

// Description Images API Types
export interface Api1688DescriptionRequest {
	apiToken: string
	item_id: string
}

export interface Api1688DescriptionResponse {
	code: number
	msg: string
	data: {
		item_id: string
		detail_imgs: string[]
		detail_html: string
	}
}

export interface Api1688Error {
	message: string
	status?: number
	details?: any
}

/**
 * 1688 API wrapper class
 */
export class Api1688 {
	private apiToken: string
	private baseUrl: string

	constructor() {
		this.apiToken = process.env.API_1688_TOKEN || ''
		this.baseUrl = process.env.API_1688_BASE_URL || 'http://api.tmapi.top'

		if (!this.apiToken) {
			throw new Error('API_1688_TOKEN environment variable is required')
		}
	}

	/**
	 * Search for products using 1688 API (Chinese)
	 */
	async search_CN(
		request: Omit<Api1688SearchRequest, 'apiToken'>
	): Promise<Api1688SearchResponse> {
		return retry(async () => {
			const config = {
				method: 'GET',
				url: `${this.baseUrl}/1688/search/items`,
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
	 * Search for products using 1688 API (English)
	 */
	async search_EN(
		request: Omit<Api1688SearchRequest, 'apiToken'>
	): Promise<Api1688SearchResponse> {
		return retry(async () => {
			const config = {
				method: 'GET',
				url: `${this.baseUrl}/en/search/items`,
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
	 * Search for products with default parameters (Chinese)
	 */
	async searchQuery_CN(
		keyword: string,
		page = 1,
		page_size = 20,
		sort:
			| 'default'
			| 'price_asc'
			| 'price_desc'
			| 'sales_desc'
			| 'newest' = 'default'
	): Promise<Api1688SearchResponse> {
		return this.search_CN({
			keyword,
			page,
			page_size,
			sort,
		})
	}

	/**
	 * Search for products with default parameters (English)
	 */
	async searchQuery_EN(
		keyword: string,
		page = 1,
		page_size = 20,
		sort:
			| 'default'
			| 'price_asc'
			| 'price_desc'
			| 'sales_desc'
			| 'newest' = 'default'
	): Promise<Api1688SearchResponse> {
		return this.search_EN({
			keyword,
			page,
			page_size,
			sort,
		})
	}

	/**
	 * Get search results as a formatted string for LLM consumption (Chinese)
	 */
	async getFormattedSearchResults_CN(
		keyword: string,
		page = 1,
		page_size = 10
	): Promise<string> {
		try {
			const response = await this.searchQuery_CN(keyword, page, page_size)

			let formattedResults = `1688 Search Results for: "${keyword}"\n\n`
			formattedResults += `Total Results: ${response.data.total_count}\n`
			formattedResults += `Page: ${response.data.page}/${Math.ceil(response.data.total_count / response.data.page_size)}\n\n`

			if (response.data.items && response.data.items.length > 0) {
				formattedResults += 'Products:\n'
				response.data.items.forEach(
					(item: Api1688SearchItem, index: number) => {
						formattedResults += `${index + 1}. ${item.title}\n`
						formattedResults += `   Item ID: ${item.item_id}\n`
						formattedResults += `   Price: ${item.price} CNY\n`
						formattedResults += `   Sale Price: ${item.price_info.sale_price} CNY\n`
						formattedResults += `   Product URL: ${item.product_url}\n`
						formattedResults += `   Image: ${item.img}\n`
						formattedResults += `   Shop: ${item.shop_info.company_name} (${item.shop_info.login_id})\n`
						formattedResults += `   Location: ${item.delivery_info.area_from.join(', ')}\n`
						formattedResults += `   Sales: ${item.sale_info.sale_quantity || 'N/A'} (${item.sale_info.orders_count} orders)\n`
						formattedResults += `   Rating: ${item.goods_score}/5\n`
						formattedResults += `   Tags: ${item.tags.join(', ')}\n`
						if (item.quantity_prices.length > 0) {
							formattedResults += `   Bulk Pricing:\n`
							item.quantity_prices.forEach(qp => {
								formattedResults += `     ${qp.begin_num}-${qp.end_num}: ${qp.price} CNY\n`
							})
						}
						formattedResults += '\n'
					}
				)
			} else {
				formattedResults += 'No products found.\n'
			}

			return formattedResults
		} catch (error) {
			return `Error performing 1688 search for "${keyword}": ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`
		}
	}

	/**
	 * Get product details using 1688 API
	 */
	async getDetail(
		request: Omit<Api1688DetailRequest, 'apiToken'>
	): Promise<Api1688DetailResponse> {
		return retry(async () => {
			const config = {
				method: 'GET',
				url: `${this.baseUrl}/1688/item_detail`,
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
	 * Get product details by item ID
	 */
	async getDetailByItemId(item_id: string): Promise<Api1688DetailResponse> {
		return this.getDetail({ item_id })
	}

	/**
	 * Get product details as a formatted string for LLM consumption
	 */
	async getFormattedDetailResults(item_id: string): Promise<string> {
		try {
			const response = await this.getDetailByItemId(item_id)

			let formattedResults = `1688 Product Details for Item ID: ${item_id}\n\n`

			const data = response.data
			formattedResults += `Title: ${data.title}\n`
			formattedResults += `Product URL: ${data.product_url}\n`
			formattedResults += `Category ID: ${data.category_id}\n`
			formattedResults += `Currency: ${data.currency}\n`
			formattedResults += `Unit: ${data.offer_unit}\n\n`

			// Price information
			formattedResults += 'Price Information:\n'
			formattedResults += `  Price: ${data.price_info.price} CNY\n`
			formattedResults += `  Price Range: ${data.price_info.price_min} - ${data.price_info.price_max} CNY\n`
			formattedResults += `  SKU Price Scale: ${data.sku_price_scale}\n\n`

			// Sales information
			formattedResults += 'Sales Information:\n'
			formattedResults += `  Total Sales: ${data.sale_count}\n`
			formattedResults += `  90-Day Sales: ${data.sale_info.sale_quantity_90days}\n`
			formattedResults += `  Stock: ${data.stock}\n\n`

			// Shop information
			formattedResults += 'Shop Information:\n'
			formattedResults += `  Shop Name: ${data.shop_info.shop_name}\n`
			formattedResults += `  Seller ID: ${data.shop_info.seller_login_id}\n`
			formattedResults += `  Shop URL: ${data.shop_info.shop_url}\n\n`

			// Delivery information
			formattedResults += 'Delivery Information:\n'
			formattedResults += `  Location: ${data.delivery_info.location}\n`
			formattedResults += `  Delivery Fee: ${data.delivery_info.delivery_fee} CNY\n`
			formattedResults += `  Unit Weight: ${data.delivery_info.unit_weight} kg\n\n`

			// Product properties
			if (data.product_props && data.product_props.length > 0) {
				formattedResults += 'Product Properties:\n'
				data.product_props.forEach(prop => {
					Object.entries(prop).forEach(([key, value]) => {
						formattedResults += `  ${key}: ${value}\n`
					})
				})
				formattedResults += '\n'
			}

			// Service tags
			if (data.service_tags && data.service_tags.length > 0) {
				formattedResults += `Service Tags: ${data.service_tags.join(', ')}\n\n`
			}

			// SKU information
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
					formattedResults += `     Price: ${sku.sale_price} CNY\n`
					formattedResults += `     Stock: ${sku.stock}\n`
					formattedResults += `     Weight: ${sku.package_info.weight} kg\n`
				})
				if (data.skus.length > 10) {
					formattedResults += `  ... and ${data.skus.length - 10} more variants\n`
				}
				formattedResults += '\n'
			}

			// Images
			if (data.main_imgs && data.main_imgs.length > 0) {
				formattedResults += `Main Images (${data.main_imgs.length}):\n`
				data.main_imgs.slice(0, 3).forEach((img, index) => {
					formattedResults += `  ${index + 1}. ${img}\n`
				})
				if (data.main_imgs.length > 3) {
					formattedResults += `  ... and ${data.main_imgs.length - 3} more images\n`
				}
				formattedResults += '\n'
			}

			// Video
			if (data.video_url) {
				formattedResults += `Video URL: ${data.video_url}\n\n`
			}

			return formattedResults
		} catch (error) {
			return `Error getting 1688 product details for item ID "${item_id}": ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`
		}
	}

	/**
	 * Search and get detailed information for products (Chinese)
	 */
	async searchWithDetails_CN(
		keyword: string,
		page = 1,
		page_size = 5
	): Promise<{ searchResults: string; details: string[] }> {
		try {
			const searchResponse = await this.searchQuery_CN(keyword, page, page_size)
			const searchResults = await this.getFormattedSearchResults_CN(
				keyword,
				page,
				page_size
			)

			const details: string[] = []

			// Get details for each product (limit to first 3 to avoid too many API calls)
			const itemsToDetail = searchResponse.data.items.slice(0, 3)
			for (const item of itemsToDetail) {
				try {
					const detailResult = await this.getFormattedDetailResults(
						item.item_id
					)
					details.push(detailResult)
				} catch (error) {
					details.push(
						`Error getting details for item ${item.item_id}: ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`
					)
				}
			}

			return { searchResults, details }
		} catch (error) {
			return {
				searchResults: `Error performing 1688 search for "${keyword}": ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`,
				details: [],
			}
		}
	}

	/**
	 * Get search results as a formatted string for LLM consumption (English)
	 */
	async getFormattedSearchResults_EN(
		keyword: string,
		page = 1,
		page_size = 10
	): Promise<string> {
		try {
			const response = await this.searchQuery_EN(keyword, page, page_size)

			let formattedResults = `1688 English Search Results for: "${keyword}"\n\n`
			formattedResults += `Total Results: ${response.data.total_count}\n`
			formattedResults += `Page: ${response.data.page}/${Math.ceil(response.data.total_count / response.data.page_size)}\n\n`

			if (response.data.items && response.data.items.length > 0) {
				formattedResults += 'Products:\n'
				response.data.items.forEach(
					(item: Api1688SearchItem, index: number) => {
						formattedResults += `${index + 1}. ${item.title}\n`
						formattedResults += `   Item ID: ${item.item_id}\n`
						formattedResults += `   Price: ${item.price} CNY\n`
						formattedResults += `   Sale Price: ${item.price_info.sale_price} CNY\n`
						formattedResults += `   Product URL: ${item.product_url}\n`
						formattedResults += `   Image: ${item.img}\n`
						formattedResults += `   Shop: ${item.shop_info.company_name} (${item.shop_info.login_id})\n`
						formattedResults += `   Location: ${item.delivery_info.area_from.join(', ')}\n`
						formattedResults += `   Sales: ${item.sale_info.sale_quantity || 'N/A'} (${item.sale_info.orders_count} orders)\n`
						formattedResults += `   Rating: ${item.goods_score}/5\n`
						formattedResults += `   Tags: ${item.tags.join(', ')}\n`
						if (item.quantity_prices.length > 0) {
							formattedResults += `   Bulk Pricing:\n`
							item.quantity_prices.forEach(qp => {
								formattedResults += `     ${qp.begin_num}-${qp.end_num}: ${qp.price} CNY\n`
							})
						}
						formattedResults += '\n'
					}
				)
			} else {
				formattedResults += 'No products found.\n'
			}

			return formattedResults
		} catch (error) {
			return `Error performing 1688 English search for "${keyword}": ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`
		}
	}

	/**
	 * Search and get detailed information for products (English)
	 */
	async searchWithDetails_EN(
		keyword: string,
		page = 1,
		page_size = 5
	): Promise<{ searchResults: string; details: string[] }> {
		try {
			const searchResponse = await this.searchQuery_EN(keyword, page, page_size)
			const searchResults = await this.getFormattedSearchResults_EN(
				keyword,
				page,
				page_size
			)

			const details: string[] = []

			// Get details for each product (limit to first 3 to avoid too many API calls)
			const itemsToDetail = searchResponse.data.items.slice(0, 3)
			for (const item of itemsToDetail) {
				try {
					const detailResult = await this.getFormattedDetailResults(
						item.item_id
					)
					details.push(detailResult)
				} catch (error) {
					details.push(
						`Error getting details for item ${item.item_id}: ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`
					)
				}
			}

			return { searchResults, details }
		} catch (error) {
			return {
				searchResults: `Error performing 1688 English search for "${keyword}": ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`,
				details: [],
			}
		}
	}

	/**
	 * Get product reviews using 1688 API
	 */
	async getReviews(
		item_id: string,
		page = 1,
		sort_type:
			| 'default'
			| 'time_desc'
			| 'time_asc'
			| 'star_desc'
			| 'star_asc' = 'default'
	): Promise<Api1688ReviewResponse> {
		return retry(async () => {
			const config = {
				method: 'GET',
				url: `${this.baseUrl}/1688/item/rating`,
				params: {
					apiToken: this.apiToken,
					item_id,
					page,
					sort_type,
				},
			}
			const response = await axios.request(config)
			return response.data
		})
	}

	async getFormattedReviews(
		item_id: string,
		page = 1,
		sort_type:
			| 'default'
			| 'time_desc'
			| 'time_asc'
			| 'star_desc'
			| 'star_asc' = 'default'
	): Promise<string> {
		try {
			const response = await this.getReviews(item_id, page, sort_type)
			let formatted = `Reviews for Item ID: ${item_id} (Page ${response.data.page}, Sort: ${response.data.sort_type})\n\n`
			if (response.data.list && response.data.list.length > 0) {
				response.data.list.forEach((review, idx) => {
					formatted += `${idx + 1}. [${review.rate_star}★] ${review.user_nick} (${review.feedback_date}):\n   ${review.feedback}\n   SKU: ${review.sku_map}\n\n`
				})
			} else {
				formatted += 'No reviews found.\n'
			}
			return formatted
		} catch (error) {
			return `Error getting reviews for item ${item_id}: ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`
		}
	}

	/**
	 * Get supplier/shop info using 1688 API
	 */
	async getSupplierInfo(
		shop_url: string,
		member_id: string
	): Promise<Api1688SupplierResponse> {
		return retry(async () => {
			const config = {
				method: 'GET',
				url: `${this.baseUrl}/1688/shop/shop_info`,
				params: {
					apiToken: this.apiToken,
					shop_url,
					member_id,
				},
			}
			const response = await axios.request(config)
			return response.data
		})
	}

	async getFormattedSupplierInfo(
		shop_url: string,
		member_id: string
	): Promise<string> {
		try {
			const response = await this.getSupplierInfo(shop_url, member_id)
			const d = response.data
			let formatted = `Supplier Info for Shop: ${d.shop_name}\n\n`
			formatted += `Company: ${d.company_name}\nPhone: ${d.contact_phone}\nShop URL: ${d.shop_url}\nLocation: ${d.location_str}\nFavorite Count: ${d.favorite_count}\nIndustry Brand: ${d.is_industry_brand}\nFactory: ${d.is_factory}\nSuper Factory: ${d.is_super_factory}\nFlagship: ${d.is_flagship_shop}\nTP: ${d.is_tp} (Years: ${d.tp_year})\n\nRatings:\n`
			d.shop_ratings.forEach(r => {
				formatted += `  ${r.title} (${r.type}): ${r.score}\n`
			})
			return formatted
		} catch (error) {
			return `Error getting supplier info: ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`
		}
	}

	/**
	 * Get product description images using 1688 API
	 */
	async getDescriptionImages(
		item_id: string
	): Promise<Api1688DescriptionResponse> {
		return retry(async () => {
			const config = {
				method: 'GET',
				url: `${this.baseUrl}/1688/item_desc`,
				params: {
					apiToken: this.apiToken,
					item_id,
				},
			}
			const response = await axios.request(config)
			return response.data
		})
	}

	async getFormattedDescriptionImages(item_id: string): Promise<string> {
		try {
			const response = await this.getDescriptionImages(item_id)
			let formatted = `Description Images for Item ID: ${item_id}\n\n`
			if (response.data.detail_imgs && response.data.detail_imgs.length > 0) {
				response.data.detail_imgs.slice(0, 10).forEach((img, idx) => {
					formatted += `${idx + 1}. ${img}\n`
				})
				if (response.data.detail_imgs.length > 10) {
					formatted += `... and ${response.data.detail_imgs.length - 10} more images\n`
				}
			} else {
				formatted += 'No description images found.\n'
			}
			return formatted
		} catch (error) {
			return `Error getting description images for item ${item_id}: ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`
		}
	}
}

// Export a singleton instance
export const api1688 = new Api1688()
