
import { GoogleGenAI } from "@google/genai";
import { Scene, CharacterBible, PromptSnippet } from "../types";
import { withRetry } from "../utils/retry";
import { CharacterBibleSchema, PromptSnippetSchema, SceneBatchResultSchema } from "../utils/schemas";
import { z } from "zod";
import { useAppStore } from "../store";

const getClient = () => {
    // Get the currently active key from the rotated list
    const apiKey = useAppStore.getState().getApiKey();
    
    if (!apiKey) {
        useAppStore.getState().setApiKeyModalOpen(true);
        throw new Error("API Key is missing. Please add keys in Settings.");
    }
    return new GoogleGenAI({ apiKey });
}

/**
 * Handles API calls with advanced error handling and KEY ROTATION.
 * If a key quota is exhausted (429/403), it rotates to the next key and retries.
 */
async function handleApiCall<T>(call: () => Promise<T>): Promise<T> {
    const store = useAppStore.getState();
    const maxGlobalAttempts = Math.max(store.apiKeys.length * 2, 5); // Allow looping through all keys at least twice
    let attempt = 0;

    while (attempt < maxGlobalAttempts) {
        try {
            return await call();
        } catch (error: any) {
            attempt++;
            const msg = error.message || error.toString();
            const status = error.status || error.response?.status;

            // Check for Quota/Rate Limit Errors
            const isQuotaError = 
                status === 429 || 
                status === 403 || 
                msg.includes('429') || 
                msg.includes('403') || 
                msg.includes('quota') || 
                msg.includes('rate limit') ||
                msg.includes('resource exhausted');

            if (isQuotaError) {
                console.warn(`⚠️ Key exhausted (Quota/429). Rotating to next key... (Attempt ${attempt}/${maxGlobalAttempts})`);
                
                // Trigger rotation in store
                store.rotateApiKey();

                // Wait a moment before retrying to prevent rapid-fire switching if all keys are bad
                await new Promise(r => setTimeout(r, 1000));
                
                continue; // Retry loop with new key
            }

            // Check for Invalid Key (401) - Prompt user to fix
            if (msg.includes('401') || msg.includes('API key not valid') || msg.includes('API Key is missing')) {
                store.setApiKeyModalOpen(true);
                throw new Error("Authentication Failed: Invalid API Key. Please check your key list.");
            }

            // If it's another error, or we ran out of attempts, throw it up
            if (attempt >= maxGlobalAttempts) {
                throw new Error(`Failed after ${attempt} attempts. Last error: ${msg}`);
            }
            
            throw error;
        }
    }
    throw new Error("Unexpected end of retry loop.");
}

/**
 * Robust JSON parser that extracts JSON from Markdown and validates it against Schema.
 */
function parseAndValidate<T>(text: string, schema: z.ZodType<T>, contextMsg: string): T {
  if (!text) throw new Error(`Empty response received for ${contextMsg}`);

  // 1. Clean Markdown
  let cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

  // 2. Smart Extraction
  const firstOpenBrace = cleanText.indexOf('{');
  const firstOpenBracket = cleanText.indexOf('[');
  
  let startIndex = -1;
  let endIndex = -1;

  if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
      startIndex = firstOpenBrace;
      endIndex = cleanText.lastIndexOf('}');
  } else if (firstOpenBracket !== -1) {
      startIndex = firstOpenBracket;
      endIndex = cleanText.lastIndexOf(']');
  }

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      cleanText = cleanText.substring(startIndex, endIndex + 1);
  }
  
  // 3. Attempt Parse
  let json;
  try {
    json = JSON.parse(cleanText);
  } catch (e) {
    throw new Error(`Failed to parse JSON for ${contextMsg}. \nFragment: ${cleanText.substring(0, 50)}...`);
  }

  // 4. Validate Schema (Defensive)
  const result = schema.safeParse(json);
  if (!result.success) {
    const errorDetails = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Schema validation failed for ${contextMsg}: ${errorDetails}`);
  }

  return result.data;
}

interface AgentParams {
  input?: any;
  system: string;
  useThinking: boolean;
}

// PIPELINE V2 STEP 1: Character Extraction
export async function runCharacterAgent({ input, system, useThinking }: AgentParams): Promise<CharacterBible> {
  return handleApiCall(() => withRetry(async () => {
    const ai = getClient();
    // Enforce gemini-2.5-flash for stability as requested
    const modelName = "gemini-2.5-flash";
    
    const config: any = {
      responseMimeType: "application/json",
      systemInstruction: system,
    };

    const response = await ai.models.generateContent({
      model: modelName,
      contents: typeof input === 'string' ? input : JSON.stringify(input),
      config: config
    });

    return parseAndValidate(response.text || "", CharacterBibleSchema, "Character Bible Agent") as unknown as CharacterBible;
  }));
}

// PIPELINE V2 STEP 2: Prompt Snippet Generation
export async function runSnippetAgent({ input, system, useThinking }: AgentParams): Promise<PromptSnippet[]> {
  return handleApiCall(() => withRetry(async () => {
    const ai = getClient();
    // Enforce gemini-2.5-flash for stability as requested
    const modelName = "gemini-2.5-flash";

    const config: any = {
      responseMimeType: "application/json",
      systemInstruction: system
    };

    const response = await ai.models.generateContent({
      model: modelName,
      contents: JSON.stringify(input),
      config: config
    });

    return parseAndValidate(response.text || "", PromptSnippetSchema, "Snippet Generator Agent") as unknown as PromptSnippet[];
  }));
}

// PIPELINE V2 STEP 3: Scene Generation
interface SceneAgentParams {
  segments: any[];
  characterSnippet: any;
  system: string;
  useThinking: boolean;
}

export async function runSceneAgent({ segments, characterSnippet, system, useThinking }: SceneAgentParams): Promise<Scene[]> {
  return handleApiCall(() => withRetry(async () => {
    const ai = getClient();
    // Enforce gemini-2.5-flash for stability as requested
    const modelName = "gemini-2.5-flash";
    
    const config: any = {
      responseMimeType: "application/json",
      systemInstruction: system
    };

    const content = `
      INPUT CONTEXT:
      1. Character/Visual Prompts: 
      ${JSON.stringify(characterSnippet)}

      2. Voice Segments to Visualize:
      ${JSON.stringify(segments, null, 2)}
      
      TASK:
      - Generate exactly ${segments.length} scene objects.
      - Field "segment_id" in output MUST match "id" from input segments.
      - Ensure visual continuity.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: content,
      config: config
    });

    // Validated and Normalized by Zod Schema (Always returns Scene[])
    const scenes = parseAndValidate(response.text || "", SceneBatchResultSchema, "Scene Generator Agent");
    
    if (!Array.isArray(scenes)) {
       throw new Error("Critical Error: Normalized scenes data is not an array.");
    }

    // Alignment Logic
    const segmentMap = new Map(segments.map(s => [s.id, s]));

    return scenes.map((s: any, idx: number) => {
      let matchingSegment = segmentMap.get(s.segment_id);

      // Fallback alignment by index if ID mismatch
      if (!matchingSegment && segments[idx]) {
        matchingSegment = segments[idx];
      }

      const finalId = matchingSegment ? matchingSegment.id : s.segment_id || `UNKNOWN_${Date.now()}_${idx}`;

      return {
        ...s,
        id: s.id || finalId,
        segment_id: finalId, 
        
        // Defaults
        scene: s.scene || idx + 1,
        description: s.description || "",
        camera: s.camera || "Medium Shot",
        visualEffect: s.visualEffect || "None",
        audioEffect: s.audioEffect || "None",
        imagePrompt: s.imagePrompt || s.description || "Scene visualization",
        videoPrompt: s.videoPrompt || s.imagePrompt || "Scene visualization",
        feasibilityLevel: s.feasibilityLevel || "Medium",
        
        genre: s.genre || "General",
        style: s.style || "Standard",
        theme: s.theme || "General",
        tone_mood: s.tone_mood || "Neutral",
      };
    });
  }));
}
