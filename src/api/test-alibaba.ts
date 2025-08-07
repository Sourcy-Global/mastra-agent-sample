import { alibabaAPI } from './alibaba.js'

async function testAlibabaAPI() {
	try {
		console.log('Testing Alibaba API...')

		// Test basic search
		const searchResults = await alibabaAPI.getFormattedSearchResults(
			'clothes women',
			1,
			5
		)
		console.log('Search Results:')
		console.log(searchResults)

		// Test raw search response
		const rawResponse = await alibabaAPI.searchQuery('clothes women', 1, 3)
		console.log('\nRaw Response Structure:')
		console.log(JSON.stringify(rawResponse, null, 2))

		// Test product detail API
		console.log('\nTesting Product Detail API...')
		const detailUrl =
			'https://www.alibaba.com/product-detail/Waterproof-IP65-18X20W-RGBWA-UV-LED_1601282281473.html'
		const detailResults = await alibabaAPI.getFormattedDetailResults(detailUrl)
		console.log('Detail Results:')
		console.log(detailResults)

		// Test raw detail response
		const rawDetailResponse = await alibabaAPI.getDetailByUrl(detailUrl)
		console.log('\nRaw Detail Response Structure:')
		console.log(JSON.stringify(rawDetailResponse, null, 2))
	} catch (error) {
		console.error('Error testing Alibaba API:', error)
	}
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	void testAlibabaAPI()
}
