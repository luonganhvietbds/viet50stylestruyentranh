// Unified Style Types for Module 1 (Story Factory) & Module 2 (Scene Generator)

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// CORE TYPE: UnifiedStyle
// Links both StyleAgent (Module 1) and StyleConfig (Module 2)
// ============================================================================

export interface UnifiedStyle {
    // Core identity
    id: string;                  // kebab-case: "edo-samurai"
    sceneId: string;             // PascalCase: "EdoSamurai"
    name: string;                // Display name: "Samurai Edo"
    tagline: string;             // Short tagline: "Danh dự, Kiếm đạo, Tĩnh lặng"
    description: string;         // Full description
    iconName: string;            // Lucide icon name: "Sword"
    colorClass: string;          // Tailwind color: "text-red-500"

    // Module 1 - Story Factory prompts
    storySystemPrompt: string;   // AI system prompt for story writing
    storyTemplate: string;       // Default input template

    // Module 2 - Scene Generator (3-step pipeline)
    characterSystem: string;     // Step 1: Character Bible Creator prompt
    snippetSystem: string;       // Step 2: Prompt Snippet Generator prompt
    sceneSystem: string;         // Step 3: Scene Generator prompt
    dialogStyle: string;         // Dialog style description
    cinematicStyle: string;      // Cinematic style description
    sceneBatchSize: number;      // Batch size for scene generation (default: 5)
    sceneDelayMs: number;        // Delay between batches (default: 2000)

    // Metadata
    isActive: boolean;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
    createdBy: string;           // User UID who created this
}

// ============================================================================
// MODULE 1: StyleAgent (Story Factory)
// Simplified view for story writing module
// ============================================================================

export interface StyleAgent {
    id: string;
    name: string;
    tagline: string;
    description: string;
    iconName: string;
    colorClass: string;
    systemPrompt: string;
    template: string;
}

// ============================================================================
// MODULE 2: StyleConfig (Scene Generator)
// Full config for 3-step scene generation pipeline
// ============================================================================

export interface StyleConfig {
    id: string;           // PascalCase
    label: string;
    description: string;
    characterSystem: string;
    snippetSystem: string;
    sceneSystem: string;
    dialogStyle: string;
    cinematicStyle: string;
    sceneBatchSize: number;
    sceneDelayMs: number;
}

// ============================================================================
// SCENE GENERATION TYPES
// ============================================================================

export interface CharacterBible {
    characters: Character[];
}

export interface Character {
    uid: string;
    displayName: string;
    type: string;
    role: string;
    [key: string]: unknown;
}

export interface PromptSnippet {
    uid: string;
    slot: string;
    promptSnippet: string;
}

export interface Scene {
    scene: string;
    segment_id: string;
    description: string;
    context?: string;
    subject: string[];
    motion?: string;
    camera: string;
    visualEffect: string;
    audioEffect: string;
    voiceOver?: string;
    feasibilityLevel: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
    feasibilityNote?: string;
    imagePrompt: string;
    videoPrompt: string;
    genre: string;
    style: string;
    theme: string;
    tone_mood: string;
}

export type PipelineStep = 'IDLE' | 'CHARACTER' | 'SNIPPET' | 'SCENE' | 'DONE';
export type PipelineStatus = 'IDLE' | 'QUEUED' | 'PROCESSING' | 'ERROR' | 'COMPLETED';

export interface ScenePipelineJob {
    id: string;
    voiceData: string;
    styleId: string;
    useThinkingModel: boolean;
    status: PipelineStatus;
    currentStep: PipelineStep;
    characterBible?: CharacterBible;
    characterSnippets?: PromptSnippet[];
    scenes: Scene[];
    logs: string[];
    error?: string;
    createdAt: Date;
    completedAt?: Date;
}

// ============================================================================
// STORY GENERATION TYPES
// ============================================================================

export interface StoryIdea {
    id: string;
    title: string;
    hook: string;
    summary: string;
    conflict: string;
    tone: string;
}

export type StoryLength = 'Short' | 'Medium' | 'Long' | 'Epic';

export interface StoryLengthConfig {
    label: string;
    words: string;
    budget: number;
}

export const STORY_LENGTH_CONFIG: Record<StoryLength, StoryLengthConfig> = {
    Short: { label: 'Ngắn', words: '300-500', budget: 1000 },
    Medium: { label: 'Vừa', words: '800-1500', budget: 2000 },
    Long: { label: 'Dài', words: '2000-4000', budget: 4000 },
    Epic: { label: 'Đại Trường Ca', words: '5000+', budget: 8000 }
};

export interface GeneratedStory {
    id: string;
    styleId: string;
    createdAt: Date;
    title: string;
    content: string;
    summary: string;
    wordCount: number;
    coverImage?: string;
    coverVisualDescription?: string;
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Convert UnifiedStyle to StyleAgent for Module 1
 */
export function toStyleAgent(style: UnifiedStyle): StyleAgent {
    return {
        id: style.id,
        name: style.name,
        tagline: style.tagline,
        description: style.description,
        iconName: style.iconName,
        colorClass: style.colorClass,
        systemPrompt: style.storySystemPrompt,
        template: style.storyTemplate,
    };
}

/**
 * Convert UnifiedStyle to StyleConfig for Module 2
 */
export function toStyleConfig(style: UnifiedStyle): StyleConfig {
    return {
        id: style.sceneId,
        label: style.name,
        description: style.description,
        characterSystem: style.characterSystem,
        snippetSystem: style.snippetSystem,
        sceneSystem: style.sceneSystem,
        dialogStyle: style.dialogStyle,
        cinematicStyle: style.cinematicStyle,
        sceneBatchSize: style.sceneBatchSize,
        sceneDelayMs: style.sceneDelayMs,
    };
}

/**
 * Convert kebab-case to PascalCase
 */
export function toPascalCase(str: string): string {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

/**
 * Convert PascalCase to kebab-case
 */
export function toKebabCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .toLowerCase();
}

/**
 * Create empty UnifiedStyle template
 */
export function createEmptyStyle(): Omit<UnifiedStyle, 'createdAt' | 'updatedAt'> {
    return {
        id: '',
        sceneId: '',
        name: '',
        tagline: '',
        description: '',
        iconName: 'Sparkles',
        colorClass: 'text-purple-400',
        storySystemPrompt: '',
        storyTemplate: '',
        characterSystem: '',
        snippetSystem: '',
        sceneSystem: '',
        dialogStyle: '',
        cinematicStyle: '',
        sceneBatchSize: 5,
        sceneDelayMs: 2000,
        isActive: true,
        createdBy: '',
    };
}

// ============================================================================
// ICON MAPPING
// ============================================================================

export const AVAILABLE_ICONS = [
    'Scroll', 'Axe', 'Pyramid', 'Cpu', 'Sword', 'Moon', 'Settings', 'Rocket',
    'Zap', 'Gamepad2', 'Box', 'Fingerprint', 'Leaf', 'Shield', 'Minimize2',
    'Microscope', 'Sparkles', 'BookOpen', 'Video', 'Mic', 'Database', 'Star',
    'Heart', 'Flame', 'Snowflake', 'Sun', 'CloudRain', 'Wind', 'Mountain',
    'Trees', 'Waves', 'Ghost', 'Skull', 'Crown', 'Gem', 'Wand2', 'Music'
] as const;

export type IconName = typeof AVAILABLE_ICONS[number];

// ============================================================================
// COLOR MAPPING
// ============================================================================

export const AVAILABLE_COLORS = [
    { value: 'text-red-400', label: 'Đỏ', bg: 'bg-red-400' },
    { value: 'text-red-500', label: 'Đỏ đậm', bg: 'bg-red-500' },
    { value: 'text-orange-400', label: 'Cam', bg: 'bg-orange-400' },
    { value: 'text-orange-500', label: 'Cam đậm', bg: 'bg-orange-500' },
    { value: 'text-amber-400', label: 'Hổ phách', bg: 'bg-amber-400' },
    { value: 'text-yellow-400', label: 'Vàng', bg: 'bg-yellow-400' },
    { value: 'text-lime-400', label: 'Vàng chanh', bg: 'bg-lime-400' },
    { value: 'text-green-400', label: 'Xanh lá', bg: 'bg-green-400' },
    { value: 'text-emerald-400', label: 'Ngọc lục bảo', bg: 'bg-emerald-400' },
    { value: 'text-teal-300', label: 'Xanh ngọc', bg: 'bg-teal-300' },
    { value: 'text-cyan-400', label: 'Xanh lơ', bg: 'bg-cyan-400' },
    { value: 'text-sky-300', label: 'Xanh da trời', bg: 'bg-sky-300' },
    { value: 'text-blue-500', label: 'Xanh dương', bg: 'bg-blue-500' },
    { value: 'text-indigo-400', label: 'Chàm', bg: 'bg-indigo-400' },
    { value: 'text-purple-400', label: 'Tím', bg: 'bg-purple-400' },
    { value: 'text-fuchsia-500', label: 'Hồng tím', bg: 'bg-fuchsia-500' },
    { value: 'text-pink-400', label: 'Hồng', bg: 'bg-pink-400' },
] as const;
