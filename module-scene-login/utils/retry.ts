/**
 * Executes a promise-returning function with exponential backoff retry logic.
 * 
 * @param fn The async function to execute
 * @param retries Maximum number of retries (default: 3)
 * @param delayMs Initial delay in milliseconds (default: 1000)
 * @param backoffFactor Factor to multiply delay by after each failure (default: 2)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
  backoffFactor = 2
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Determine if the error is retryable.
    // We generally retry on network errors or 5xx server errors.
    // We also retry on 429 (Too Many Requests).
    // We avoid retrying on 400-499 (Client Errors) unless it's 429.
    
    // Check for standard fetch status or common error messages
    const status = error?.status || error?.response?.status;
    const isRetryable =
      retries > 0 &&
      (
        !status || // Network error often has no status
        status === 429 || 
        status >= 500 || 
        error.message?.includes('fetch failed') ||
        error.message?.includes('network')
      );

    if (isRetryable) {
      console.warn(`[Retry] Operation failed. Retrying in ${delayMs}ms... (${retries} attempts left). Error: ${error.message}`);
      
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      
      return withRetry(fn, retries - 1, delayMs * backoffFactor, backoffFactor);
    }

    // If not retryable or retries exhausted, throw the error
    throw error;
  }
}