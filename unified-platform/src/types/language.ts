// Language Types for Story/Scene Generation

export type OutputLanguage = 'en' | 'vi';

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
        default:
            return getLanguageInstruction('vi');
    }
}

/**
 * Get short language label for prompts
 */
export function getLanguageLabel(lang: OutputLanguage): string {
    return lang === 'vi' ? 'Vietnamese' : 'English';
}
