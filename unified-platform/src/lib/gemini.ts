// Gemini AI Service
import { GoogleGenAI } from '@google/genai';

let genAIInstance: GoogleGenAI | null = null;
let currentApiKey: string | null = null;

export const getGeminiClient = (apiKey: string): GoogleGenAI => {
    if (!genAIInstance || currentApiKey !== apiKey) {
        genAIInstance = new GoogleGenAI({ apiKey });
        currentApiKey = apiKey;
    }
    return genAIInstance;
};

export const generateContent = async (
    apiKey: string,
    prompt: string,
    options?: {
        model?: string;
        systemInstruction?: string;
        temperature?: number;
    }
) => {
    const client = getGeminiClient(apiKey);
    const model = options?.model || 'gemini-2.0-flash';

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

export const GEMINI_MODELS = {
    FLASH: 'gemini-2.0-flash',
    PRO: 'gemini-1.5-pro',
    FLASH_THINKING: 'gemini-2.0-flash-thinking-exp',
} as const;
