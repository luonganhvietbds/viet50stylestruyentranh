
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { z } from "zod";
import { StoryIdea, StyleAgent, StoryLength, GeneratedStory } from '../types';
import { LENGTH_CONFIG } from '../data/agents';

// --- Validation Schemas (Outputs) ---
const StoryIdeaSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  hook: z.string(),
  summary: z.string(),
  conflict: z.string(),
  tone: z.string(),
});

const StoryIdeasResponseSchema = z.array(StoryIdeaSchema);

const GeneratedStorySchema = z.object({
  title: z.string(),
  summary: z.string(),
  content: z.string(),
  wordCount: z.number().int(),
  coverVisualDescription: z.string().optional(),
});

// --- Validation Schemas (Inputs) ---
const GenerateIdeasInputSchema = z.object({
  numIdeas: z.number().min(1).max(20, "Số lượng ý tưởng không hợp lệ"),
  userDescription: z.string().max(5000, "Mô tả quá dài, vui lòng rút gọn dưới 5000 ký tự").optional(),
});

const GenerateStoryInputSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  summary: z.string(),
  conflict: z.string(),
  tone: z.string(),
});

// --- Utilities ---

/**
 * Clean JSON string
 */
const cleanJsonString = (str: string) => {
  if (!str) return "";
  const jsonMatch = str.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
};

/**
 * Parse Raw Key Input into Array
 */
const parseApiKeys = (input: string): string[] => {
  if (!input) return [];
  // Split by newline or comma, trim, filter empty or too short keys
  return input.split(/[\n,]/)
    .map(k => k.trim())
    .filter(k => k.length > 20 && k.startsWith('AIza'));
};

/**
 * Execute with Key Rotation
 * Tự động thử lần lượt các key trong danh sách nếu gặp lỗi Quota hoặc Auth.
 */
async function executeWithKeyRotation<T>(
  rawKeyInput: string, 
  operation: (ai: GoogleGenAI) => Promise<T>
): Promise<T> {
  const keys = parseApiKeys(rawKeyInput);
  
  if (keys.length === 0) {
    throw new Error("AUTH_ERROR: Không tìm thấy API Key hợp lệ nào.");
  }

  let lastError: any = null;

  // Loop through keys
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    try {
      const ai = new GoogleGenAI({ apiKey });
      // console.log(`Attempting with Key #${i + 1} (${apiKey.substring(0, 8)}...)`);
      return await operation(ai);
    } catch (error: any) {
      lastError = error;
      const msg = (error?.toString() || '').toLowerCase();
      const status = error?.status || 0;

      // Identify retriable errors (Quota 429, Auth 401/403, NotFound 404 - maybe model name is wrong but key is fine, but usually we don't rotate on 404 unless it's region specific)
      // Note: 404 on Model is NOT fixed by rotating keys usually, but if it's region based, maybe.
      // However, we strictly rotate on Quota/Auth here.
      const isQuotaError = msg.includes("429") || msg.includes("quota") || msg.includes("resource_exhausted") || status === 429;
      const isAuthError = msg.includes("401") || msg.includes("403") || msg.includes("api key") || msg.includes("permission denied");

      if (isQuotaError || isAuthError) {
        console.warn(`Key #${i + 1} failed (Quota/Auth). Switching to next key... Error: ${msg}`);
        continue; // Try next key
      }

      // If it's a model error (404) or parsing error, throw immediately (don't rotate, as it is a code/config issue)
      throw error; 
    }
  }

  // If we get here, all keys failed
  console.error("All API keys exhausted.");
  throw new Error("ALL_KEYS_EXHAUSTED: Tất cả API Key đều bị lỗi hoặc hết hạn mức (Quota). Vui lòng cập nhật danh sách Key mới.");
}

// --- API Functions ---

export const generateStoryIdeas = async (
  rawApiKey: string,
  agent: StyleAgent,
  numIdeas: number,
  userDescription: string,
  systemPromptOverride?: string
): Promise<StoryIdea[]> => {
  
  // 1. Validate Input
  GenerateIdeasInputSchema.parse({ numIdeas, userDescription });

  return executeWithKeyRotation(rawApiKey, async (ai) => {
    const effectiveSystemPrompt = systemPromptOverride || agent.systemPrompt;
    const prompt = `
      ROLE: You are the "${agent.name}" Story Agent.
      CORE IDENTITY & STYLE: ${effectiveSystemPrompt}
      TAGLINE: ${agent.tagline}

      TASK: Generate exactly ${numIdeas} unique story concepts based on the user's input.
      USER INPUT: "${userDescription ? userDescription : 'Create stories fitting your specific style and archetype.'}"

      STRICT OUTPUT RULES:
      1. LANGUAGE: VIETNAMESE (Tiếng Việt) 100%.
      2. FORMAT: JSON Array ONLY.
      3. FIELDS:
         - "hook": Catchy logline.
         - "summary": Plot outline (~50 words).
         - "conflict": Main tension.
         - "tone": Atmosphere keywords.
    `;

    const schema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          hook: { type: Type.STRING },
          summary: { type: Type.STRING },
          conflict: { type: Type.STRING },
          tone: { type: Type.STRING },
        },
        required: ['title', 'hook', 'summary', 'conflict', 'tone']
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const cleanedText = cleanJsonString(text);
    let rawData;
    try {
      rawData = JSON.parse(cleanedText);
    } catch (e) {
      throw new Error("Failed to parse AI response.");
    }

    const validatedData = StoryIdeasResponseSchema.parse(rawData);
    return validatedData.map(idea => ({
      ...idea,
      id: idea.id || crypto.randomUUID()
    }));
  });
};

export const generateFullStory = async (
  rawApiKey: string,
  agent: StyleAgent,
  idea: StoryIdea,
  length: StoryLength,
  customPrompt: string,
  systemPromptOverride?: string
): Promise<GeneratedStory> => {
  
  GenerateStoryInputSchema.parse(idea);

  return executeWithKeyRotation(rawApiKey, async (ai) => {
    const lengthSettings = LENGTH_CONFIG[length];
    const effectiveSystemPrompt = systemPromptOverride || agent.systemPrompt;

    const fullPrompt = `
      ROLE: You are the ${agent.name} Agent.
      CORE INSTRUCTIONS: ${effectiveSystemPrompt}
      
      TASK: Write a complete story in VIETNAMESE.
      
      STORY MANIFEST:
      - Title: ${idea.title}
      - Concept: ${idea.summary}
      - Conflict: ${idea.conflict}
      - Tone: ${idea.tone}
      
      SPECS:
      - Length: ~${lengthSettings.words} words.
      - Format: Markdown.
      - Structure: Intro -> Inciting Incident -> Rising Action -> Climax -> Resolution.
      
      DIRECTOR'S NOTES: ${customPrompt || 'None'}
      
      REQUIRED JSON OUTPUT:
      - title, summary, content (markdown), wordCount, coverVisualDescription (English image prompt).
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        summary: { type: Type.STRING },
        content: { type: Type.STRING },
        wordCount: { type: Type.INTEGER },
        coverVisualDescription: { type: Type.STRING }
      },
      required: ['title', 'summary', 'content', 'wordCount', 'coverVisualDescription']
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Sử dụng model ổn định thay vì model thinking-exp dễ bị lỗi 404
      contents: fullPrompt,
      config: {
        // thinkingConfig: { thinkingBudget: 1024 }, // Thinking config chỉ dành cho model 2.5 thinking
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const cleanedText = cleanJsonString(text);
    let rawData;
    try {
      rawData = JSON.parse(cleanedText);
    } catch (e) {
      throw new Error("Failed to parse story data.");
    }
    
    const storyData = GeneratedStorySchema.parse(rawData);

    return {
      ...storyData,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
  });
};

export const generateCoverImage = async (rawApiKey: string, story: GeneratedStory, agent: StyleAgent): Promise<string> => {
  
  return executeWithKeyRotation(rawApiKey, async (ai) => {
    const promptText = story.coverVisualDescription 
      ? `Create a masterpiece book cover. VISUAL DESCRIPTION: ${story.coverVisualDescription}. ART STYLE: ${agent.name}. NO TEXT.`
      : `High quality book cover for "${story.title}". Style: ${agent.name}. NO TEXT.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: promptText }] },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('image')) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated.");
  });
};
