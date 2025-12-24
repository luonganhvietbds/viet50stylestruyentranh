import { z } from 'zod';

// --- Shared Primitives ---

// V2 Validator: Enforce strict UID format "Character X"
const UidSchema = z.string().regex(/^Character [A-Z]$/, {
  message: "UID must be in format 'Character A', 'Character B', etc."
});

// Variant Schema (Defensive)
const VariantSchema = z.object({
  uid: UidSchema.or(z.string()), // Fallback string if strictly not met, but preferred regex
  context: z.string().optional(),
  preservedFeatures: z.record(z.string(), z.any()).optional(),
  changedFeatures: z.record(z.string(), z.any()).optional(),
}).passthrough();

// Base Character Schema
const BaseCharacterSchema = z.object({
  uid: UidSchema.or(z.string()),
  displayName: z.string().optional(),
  type: z.string().optional(),
  role: z.string().optional(),
  variants: z.array(VariantSchema).optional().default([]),
}).passthrough();

// 1. Character Bible Schema (Robust)
// Handles cases where AI returns { characters: [...] } OR just [...]
export const CharacterBibleSchema = z.preprocess(
  (val: any) => {
    // If it's a direct array, wrap it
    if (Array.isArray(val)) return { characters: val };
    
    // If it's an object but missing 'characters' key, try to find the array
    if (val && typeof val === 'object' && !val.characters) {
      const arrayKey = Object.keys(val).find(k => Array.isArray(val[k]));
      if (arrayKey) return { characters: val[arrayKey] };
    }
    
    return val;
  },
  z.object({
    characters: z.array(BaseCharacterSchema)
  }).passthrough()
);

// 2. Prompt Snippet Schema (Robust + V2 Validators)
const SnippetItemSchema = z.object({
  uid: z.string(),
  // V2 Validator: Check word count < 50 words
  promptSnippet: z.string().refine((val) => val.split(/\s+/).length <= 60, {
    message: "Prompt snippet should be concise (under 60 words)."
  }),
}).passthrough();

// Handles cases where AI returns [...] OR { snippets: [...] }
export const PromptSnippetSchema = z.preprocess(
  (val: any) => {
    // If it's a direct array, use it
    if (Array.isArray(val)) return val;
    
    // If it's an object, try to extract the array
    if (val && typeof val === 'object') {
       const arrayKey = Object.keys(val).find(k => Array.isArray(val[k]));
       if (arrayKey) return val[arrayKey];
    }
    return val;
  },
  z.array(SnippetItemSchema)
);

// 3. Scene Schema (Strict but flexible types)
export const SceneSchema = z.object({
  // Identification
  scene: z.union([z.string(), z.number()]).transform(v => String(v)).optional(),
  segment_id: z.string().optional(),
  id: z.any().optional(), // fallback

  // Core Content
  description: z.string().optional(),
  context: z.string().optional(),
  // V2 Validator: Enforce array of strings for subjects
  subject: z.preprocess((val) => {
      if (typeof val === 'string') return [val];
      return val;
  }, z.array(z.string()).optional()),
  
  // Directions
  motion: z.string().optional(),
  camera: z.string().optional(),
  visualEffect: z.string().optional(),
  audioEffect: z.string().optional(),
  voiceOver: z.string().optional(),
  
  // Prompts
  imagePrompt: z.string().optional(),
  videoPrompt: z.string().optional(),
  
  // Metadata
  feasibilityLevel: z.string().optional(),
  feasibilityNote: z.string().optional(),
  genre: z.string().optional(),
  style: z.string().optional(),
  theme: z.string().optional(),
  tone_mood: z.string().optional(),
}).passthrough();

// Batch Result: Normalizes output to always be Scene[]
export const SceneBatchResultSchema = z.preprocess(
  (val: any) => {
    if (Array.isArray(val)) return val;
    if (val && typeof val === 'object') {
       // Check common keys
       if (Array.isArray(val.scenes)) return val.scenes;
       if (Array.isArray(val.items)) return val.items;
       if (Array.isArray(val.data)) return val.data;
       
       // Fallback: Find first array
       const arrayKey = Object.keys(val).find(k => Array.isArray(val[k]));
       if (arrayKey) return val[arrayKey];
    }
    return val;
  },
  z.array(SceneSchema)
);