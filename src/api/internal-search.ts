/**
 * Retrieves similar products based on vector embedding and optional filtering criteria.
 *
 * @param params - The search parameters
 * @param params.query - the search query
 * @param params.page - Page number for pagination (default: 0)
 * @param params.limit - Maximum number of results to return (default: 100)
 * @param params.priceMin - Minimum price filter
 * @param params.priceMax - Maximum price filter
 * @param params.productLabelKeys - Array of product label keys to filter by
 * @param params.moqMin - Minimum MOQ (Minimum Order Quantity) filter
 * @param params.moqMax - Maximum MOQ filter
 * @param params.leadTimeMin - Minimum lead time in days filter
 * @param params.leadTimeMax - Maximum lead time in days filter
 * @returns Promise resolving to either an array of similar products or a ModelError
 *
 * @remarks
 * The function performs a vector similarity search using HNSW index and applies various
 * filters including price, MOQ, lead time, and product labels. Results are deduplicated
 * at the product level, keeping the variant with the closest embedding distance.
 *
 * @throws ModelError
 * When database query fails or other errors occur during execution
 */

import { QueryTypes } from 'sequelize'

import db from '@/database/connect.js'
import { ControllerError } from '@/sourcy-models/errors/ControllerError.js'
import { ModelError } from '@/sourcy-models/errors/ModelError.js'
import { logQueryError } from '@/sourcy-models/logging/index.js'
import cohere from '@/utils/cohere.js'
import { getEmbeddings } from '@/utils/textToEmbedding.js'

export interface GetSimilarProductsParams {
	query: string
	page?: number
	limit?: number
	priceMin?: number
	priceMax?: number
	productLabelKeys?: string[]
	moqMin?: number
	moqMax?: number
	leadTimeMin?: number
	leadTimeMax?: number
	rerank?: boolean
	translated?: boolean
	categorized?: boolean
	botSearch?: boolean
}

export interface VectorQueryRes {
	product_id: number
	product_variant_id: number
	product: string
	link: string
	product_image: string
	price: number
	moq: number
	lead_time_days: number
	labels: string[]
	cos_dist: number
}

export async function getSimilarProducts({
	query,
	page = 0,
	limit = 20,
	priceMin,
	priceMax,
	productLabelKeys,
	moqMin,
	moqMax,
	leadTimeMin,
	leadTimeMax,
	rerank = false,
	translated = false,
	categorized = false,
	botSearch = false,
}: GetSimilarProductsParams): Promise<VectorQueryRes[] | ModelError> {
	try {
		if (query.length === 0) {
			const modelError = new ModelError('No query provided')
			logQueryError(
				'productVectorStore',
				getSimilarProducts.name,
				modelError.error
			)
			return modelError
		}

		const embedding = await getEmbeddings(query.trim())

		const input = {
			embedding,
			priceMin,
			priceMax,
			productLabelKeys:
				productLabelKeys?.map(label => db.sequelizeConnection.escape(label)) ??
				[],
			moqMin,
			moqMax,
			leadTimeMin,
			leadTimeMax,
			limit: limit ?? 100,
		}

		const labelKeysCondition = input.productLabelKeys.length
			? `pl.label_key in (${input.productLabelKeys.join(',')})`
			: 'true'

		let moqCondition = 'true'
		if (input.moqMin !== undefined && input.moqMax !== undefined) {
			moqCondition = 'pv.moq >= $moqMin and pv.moq <= $moqMax'
		} else if (input.moqMin !== undefined) {
			moqCondition = 'pv.moq >= $moqMin'
		} else if (input.moqMax !== undefined) {
			moqCondition = 'pv.moq <= $moqMax'
		}

		let leadTimeCondition = 'true'
		if (input.leadTimeMin !== undefined && input.leadTimeMax !== undefined) {
			leadTimeCondition =
				'pv.lead_time_days >= $leadTimeMin and pv.lead_time_days <= $leadTimeMax'
		} else if (input.leadTimeMin !== undefined) {
			leadTimeCondition = 'pv.lead_time_days >= $leadTimeMin'
		} else if (input.leadTimeMax !== undefined) {
			leadTimeCondition = 'pv.lead_time_days <= $leadTimeMax'
		}

		let priceCondition = 'true'
		if (input.priceMin !== undefined && input.priceMax !== undefined) {
			priceCondition = 'pv.price >= $priceMin and pv.price <= $priceMax'
		} else if (input.priceMin !== undefined) {
			priceCondition = 'pv.price >= $priceMin'
		} else if (input.priceMax !== undefined) {
			priceCondition = 'pv.price <= $priceMax'
		}

		let productLabelKeysCondition = 'true'
		if (input.productLabelKeys.length) {
			productLabelKeysCondition = 'pl.labels is not null'
		}

		let productTitleCondition = 'true'
		if (translated) {
			productTitleCondition = 'p.title_translated is not null'
		}

		let categorizedCondition = 'true'
		if (categorized) {
			categorizedCondition = 'p.taxonomy_id is not null'
		}

		let botSearchCondition = 'true'
		if (botSearch) {
			botSearchCondition = `
      pv.price > 0
      and pv.weight_per_unit_kg is not null
      and pv.length_cm is not null
      and pv.width_cm is not null
      and pv.height_cm is not null
      `
		}

		await db.sequelizeConnection.query(
			`set hnsw.ef_search = ${Math.max(100, input.limit * 2)};`,
			{
				type: QueryTypes.RAW,
			}
		)

		const queryRes = (await db.sequelizeConnection.query(
			`
      with product_limit as (
        select
            product_id,
            embedding <=> $embedding::vector AS cos_dist
        from public.vector_test
        where model = 'product'
        order by 2
        limit $limit
    )
    , pl as (
        select
            product_id,
            array_agg(label_key) as labels
        from public.product_labels pl
        where ${labelKeysCondition}
        group by 1
    )
    , vectors as (
        select
            pvs.product_id,
            pvs.product_variant_id,
            coalesce(p.title_translated, p.title) as product,
            coalesce(pv.product_variant_key_translated, pv.product_variant_key) as variant,
            p.link,
            p.supplier_id,
            coalesce(pv.images[1], p.image_urls_clean[1] ,p.image_urls[1]) as product_image,
            case
                when pv.images[1] is not null then 'variant'
                when p.image_urls_clean[1] is not null then 'product - clean'
                when p.image_urls[1] is not null then 'product - raw'
                else 'n/a'
            end as image_source,
            pv.price,
            pv.moq,
            pv.lead_time_days,
            pl.labels,
            pvs.embedding_raw,
            pvs.embedding <=> $embedding::vector AS cos_dist,
            COALESCE(psm.final_score, 0) as final_score
        from public.product_vector_store pvs
        join public.products p
            on pvs.product_id = p.product_id
        join public.product_variants pv
            on pvs.product_variant_id = pv.product_variant_id
        join product_limit c
            on pvs.product_id = c.product_id
        left join pl
            on pvs.product_id = pl.product_id
        left join product_search_metrics psm
            on pvs.product_id = psm.product_id
        where pvs.model = 'product'
            and (${botSearchCondition})
            --UI Filters
            and (${priceCondition})
            and (${moqCondition})
            and (${leadTimeCondition})
            and (${productLabelKeysCondition})
            and (${productTitleCondition})
            and (${categorizedCondition})
    )
    , dedupe as (
        select
            *,
            row_number() over (partition by product_id order by cos_dist) as rn
        from vectors
    )
    select
        product_id,
        product_variant_id,
        product,
        variant,
        link,
        supplier_id,
        product_image,
        image_source,
        price,
        moq,
        lead_time_days,
        labels,
        cos_dist,
        final_score
    from dedupe d
    where d.rn = 1
    order by d.final_score desc, d.cos_dist
    offset $offset
    limit $limit;`,
			{
				bind: {
					embedding: JSON.stringify(embedding),
					priceMin: input.priceMin,
					priceMax: input.priceMax,
					moqMin: input.moqMin,
					moqMax: input.moqMax,
					leadTimeMin: input.leadTimeMin,
					leadTimeMax: input.leadTimeMax,
					offset: page * input.limit,
					limit: input.limit,
				},
				type: QueryTypes.SELECT,
			}
		)) as unknown as VectorQueryRes[]

		if (rerank) {
			let reorderedResponse: VectorQueryRes[]

			try {
				const rerankedProducts = await cohere.reRank(
					query,
					queryRes.map(vector => vector.product.toString()),
					limit
				)

				if (rerankedProducts instanceof ControllerError) {
					return new ModelError(rerankedProducts.error)
				}

				// Reorder the response array based on the indexes returned by rerankedProducts
				reorderedResponse = rerankedProducts.map(p => queryRes[p.index])
			} catch (error) {
				// if reranking fails, return the original response
				console.log('Reranking failed, returning original response...')
				console.log(error)
				reorderedResponse = queryRes
			}

			return reorderedResponse
		}

		return queryRes
	} catch (error) {
		const modelError = new ModelError(error)
		logQueryError(
			'productVectorStore',
			getSimilarProducts.name,
			modelError.error
		)
		return modelError
	}
}
