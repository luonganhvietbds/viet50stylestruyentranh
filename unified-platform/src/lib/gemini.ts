// Gemini AI Service with Auto Retry and Key Rotation
import { GoogleGenAI } from '@google/genai';

let genAIInstance: GoogleGenAI | null = null;
let currentApiKey: string | null = null;

// Error types that should trigger key rotation or retry
const ROTATABLE_ERRORS = [
    'API key expired',
    'API_KEY_INVALID',
    'RESOURCE_EXHAUSTED',
    'quota exceeded',
    'rate limit',
    'invalid api key',
    'suspended',
    'disabled',
    'overloaded',
    'UNAVAILABLE',
    '429',
    '403',
    '502',
    '503',
];

// Check if error should trigger key rotation
export const isRotatableError = (error: unknown): boolean => {
    const errorString = String(error).toLowerCase();
    return ROTATABLE_ERRORS.some(e => errorString.includes(e.toLowerCase()));
};

export const getGeminiClient = (apiKey: string): GoogleGenAI => {
    if (!genAIInstance || currentApiKey !== apiKey) {
        genAIInstance = new GoogleGenAI({ apiKey });
        currentApiKey = apiKey;
    }
    return genAIInstance;
};

export interface GenerateOptions {
    model?: string;
    systemInstruction?: string;
    temperature?: number;
}

// Basic generate without retry (for backwards compatibility)
export const generateContent = async (
    apiKey: string,
    prompt: string,
    options?: GenerateOptions
) => {
    const client = getGeminiClient(apiKey);
    const model = options?.model || 'gemini-2.5-flash';

    const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
            temperature: options?.temperature || 0.7,
            systemInstruction: options?.systemInstruction,
        },
    });

    return response.text;
};

export interface RetryConfig {
    maxRetries?: number;           // Maximum number of retries (default: 3)
    delayMs?: number;              // Delay between retries in ms (default: 1000)
    onKeyRotate?: (keyIndex: number, totalKeys: number) => void;  // Callback when key is rotated
    onRetry?: (attempt: number, error: string) => void;  // Callback on each retry
}

/**
 * Generate content with automatic retry and key rotation
 * 
 * @param getNextKey - Function that returns the next API key (from ApiKeyContext)
 * @param markKeyInvalid - Function to mark a key as invalid (optional)
 * @param prompt - The prompt to send to the AI
 * @param options - Generation options (model, temperature, etc.)
 * @param retryConfig - Configuration for retry behavior
 * @returns The generated text or throws if all retries fail
 */
export const generateWithRetry = async (
    getNextKey: () => string | null,
    markKeyInvalid: ((key: string) => void) | null,
    prompt: string,
    options?: GenerateOptions,
    retryConfig?: RetryConfig
): Promise<string | undefined> => {
    const maxRetries = retryConfig?.maxRetries ?? 3;
    const delayMs = retryConfig?.delayMs ?? 1000;

    let attempts = 0;
    let lastError: Error | null = null;
    const triedKeys = new Set<string>();

    while (attempts < maxRetries) {
        const apiKey = getNextKey();

        if (!apiKey) {
            throw new Error('No API keys available. Please add API keys in settings.');
        }

        // Avoid retrying with same key if we have multiple
        if (triedKeys.has(apiKey) && triedKeys.size < maxRetries) {
            // Already tried this key, try to get a different one
            continue;
        }

        triedKeys.add(apiKey);
        attempts++;

        try {
            const result = await generateContent(apiKey, prompt, options);
            return result;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            const isRotatable = isRotatableError(error);

            if (isRotatable) {
                // Mark this key as invalid
                if (markKeyInvalid) {
                    markKeyInvalid(apiKey);
                }

                // Notify about retry
                retryConfig?.onRetry?.(attempts, lastError.message);
                retryConfig?.onKeyRotate?.(attempts, maxRetries);

                // Delay before next attempt
                if (attempts < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            } else {
                // Non-rotatable error, throw immediately
                throw lastError;
            }
        }
    }

    // All retries exhausted
    throw new Error(
        `All ${maxRetries} API keys failed. Last error: ${lastError?.message || 'Unknown error'}`
    );
};

/**
 * Wrapper that creates a retry-enabled generate function
 * Use this to create a bound function with the key management already set up
 */
export const createRetryableGenerate = (
    getNextKey: () => string | null,
    markKeyInvalid?: (key: string) => void,
    retryConfig?: RetryConfig
) => {
    return async (prompt: string, options?: GenerateOptions) => {
        return generateWithRetry(
            getNextKey,
            markKeyInvalid || null,
            prompt,
            options,
            retryConfig
        );
    };
};

export const GEMINI_MODELS = {
    FLASH_25: 'gemini-2.5-flash',       // Recommended - better quota
    FLASH_20: 'gemini-2.0-flash',       // Legacy
    FLASH_15: 'gemini-1.5-flash',       // Fallback option
    PRO: 'gemini-1.5-pro',              // Higher quality
    FLASH_THINKING: 'gemini-2.0-flash-thinking-exp',
} as const;

// Fallback model chain - try each model in order
export const FALLBACK_MODELS = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash',
] as const;

/**
 * Generate with automatic model fallback
 * If one model fails with quota/overload, try the next model
 */
export const generateWithModelFallback = async (
    getNextKey: () => string | null,
    markKeyInvalid: ((key: string) => void) | null,
    prompt: string,
    options?: GenerateOptions,
    retryConfig?: RetryConfig
): Promise<string | undefined> => {
    let lastError: Error | null = null;
    const modelsToTry = options?.model ? [options.model] : [...FALLBACK_MODELS];

    for (const model of modelsToTry) {
        try {
            const result = await generateWithRetry(
                getNextKey,
                markKeyInvalid,
                prompt,
                { ...options, model },
                { ...retryConfig, maxRetries: 2 }
            );
            return result;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.warn(`Model ${model} failed, trying next...`, lastError.message);
            // Continue to next model
        }
    }

    throw new Error(
        `All models failed. Last error: ${lastError?.message || 'Unknown error'}`
    );
};

export interface ApiKeyTestResult {
    valid: boolean;
    model: string;
    error?: string;
    responseTime?: number;
}

/**
 * Test an API key by making a simple request
 * Returns the test result with validation status
 */
export const testApiKey = async (
    apiKey: string,
    model: string = 'gemini-2.5-flash'
): Promise<ApiKeyTestResult> => {
    const startTime = Date.now();

    try {
        const client = getGeminiClient(apiKey);

        await client.models.generateContent({
            model,
            contents: 'Say "OK" in one word.',
            config: {
                temperature: 0,
                maxOutputTokens: 10,
            },
        });

        return {
            valid: true,
            model,
            responseTime: Date.now() - startTime,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        return {
            valid: false,
            model,
            error: errorMessage,
            responseTime: Date.now() - startTime,
        };
    }
};

/**
 * Test multiple API keys in parallel
 */
export const testApiKeys = async (
    apiKeys: string[],
    model: string = 'gemini-2.5-flash'
): Promise<Map<string, ApiKeyTestResult>> => {
    const results = new Map<string, ApiKeyTestResult>();

    const tests = apiKeys.map(async (key) => {
        const result = await testApiKey(key, model);
        results.set(key, result);
    });

    await Promise.all(tests);
    return results;
};
