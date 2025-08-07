// Export all API-related functionality
export * from './serper.js'
export * from './1688.js'
export * from './alibaba.js'

/**
 * Retry function with exponential backoff and random jitter
 * @param fn - Function to retry
 * @param retries - Number of retries (default: 2)
 * @param delay - Initial delay in milliseconds (default: 5500)
 * @param backoff - Backoff multiplier (default: random between 1.1 and 2.5)
 * @returns Promise with the result of the function
 */
export default async function retry<ReturnType>(
	fn: () => Promise<ReturnType>,
	retries = 2,
	delay = 5500,
	backoff: number = Math.random() * (2.5 - 1.1) + 1.1 // Random number between 1.1 and 2.5
): Promise<ReturnType> {
	try {
		return await fn()
	} catch (error) {
		console.log('❌ Error in tmAPI call ...')
		if (retries > 0) {
			console.log(`Retrying after ${delay}ms | Attempts left: ${retries}`)
			await new Promise(res => setTimeout(res, delay))
			return retry(fn, retries - 1, delay * backoff, backoff)
		} else {
			return Promise.reject(error)
		}
	}
}

// Also export as a named export for easier importing
export { retry }
