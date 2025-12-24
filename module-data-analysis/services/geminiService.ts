import { GoogleGenAI } from "@google/genai";
import { AIModelType } from "../types";

export const generateAIResponse = async (
  apiKey: string,
  prompt: string,
  modelType: AIModelType
): Promise<string> => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("AUTH_REQUIRED");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    let modelName = 'gemini-2.5-flash'; // Hardcoded default as requested
    let config = {};

    if (modelType === AIModelType.THINKING) {
      modelName = 'gemini-3-pro-preview';
      // Gemini 2.5 Flash doesn't support thinkingConfig, only 3-pro does in this context
      // but if user selected Thinking, we switch model.
      config = {
        thinkingConfig: { thinkingBudget: 16000 }, // Reduced budget for speed/stability
      };
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: config
    });

    if (!response.text) {
        throw new Error("No response text generated.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    
    // Normalize error messages for the UI
    const msg = error.message || '';
    
    // Check for 400/401/403 or specific strings indicating invalid key
    if (
        msg.includes('401') || 
        msg.includes('403') || 
        msg.includes('API key not valid') || 
        msg.includes('unauthenticated')
    ) {
        throw new Error("AUTH_INVALID");
    }

    throw new Error(msg || "Unknown Gemini API Error");
  }
};