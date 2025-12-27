// Language Types for Story/Scene Generation

export type OutputLanguage = 'vi' | 'en' | 'ko' | 'ja';

export interface LanguageConfig {
    // User-selected language for voice/dialog/story content
    outputLanguage: OutputLanguage;

    // Always English for AI image generation
    imagePromptLanguage: 'en';

    // Always English for AI video generation
    videoPromptLanguage: 'en';
}

export interface LanguageLabels {
    code: OutputLanguage;
    label: string;
    flag: string;
    nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageLabels[] = [
    { code: 'vi', label: 'Vietnamese', flag: '🇻🇳', nativeLabel: 'Tiếng Việt' },
    { code: 'en', label: 'English', flag: '🇺🇸', nativeLabel: 'English' },
    { code: 'ko', label: 'Korean', flag: '🇰🇷', nativeLabel: '한국어' },
    { code: 'ja', label: 'Japanese', flag: '🇯🇵', nativeLabel: '日本語' },
];

export const DEFAULT_LANGUAGE: OutputLanguage = 'vi';

// Language storage key
export const LANGUAGE_STORAGE_KEY = 'unified_output_language';

/**
 * Get language prompt instruction for AI
 */
export function getLanguageInstruction(lang: OutputLanguage): string {
    switch (lang) {
        case 'vi':
            return `OUTPUT_LANGUAGE = "vi"

Write in 100% Vietnamese.
Use restrained, literary Vietnamese.
Avoid modern expressions, slang, or contemporary phrasing.
Maintain a calm, contemplative tone.`;
        case 'en':
            return `OUTPUT_LANGUAGE = "en"

Write in literary English.
Avoid modern slang or contemporary idioms.
Maintain a classical, understated tone.
Do NOT over-dramatize or sensationalize.`;
        case 'ko':
            return `OUTPUT_LANGUAGE = "ko"

Write in 100% Korean (한국어).
Use literary, eloquent Korean.
Avoid modern slang or internet expressions.
Maintain a refined, elegant tone.
Use appropriate honorific levels.`;
        case 'ja':
            return `OUTPUT_LANGUAGE = "ja"

Write in 100% Japanese (日本語).
Use literary Japanese with proper grammar.
Avoid modern slang or internet expressions.
Maintain a refined, contemplative tone.
Use proper keigo (敬語) when appropriate.`;
        default:
            return getLanguageInstruction('vi');
    }
}

/**
 * Get short language label for prompts
 */
export function getLanguageLabel(lang: OutputLanguage): string {
    switch (lang) {
        case 'vi': return 'Vietnamese';
        case 'en': return 'English';
        case 'ko': return 'Korean';
        case 'ja': return 'Japanese';
        default: return 'Vietnamese';
    }
}
