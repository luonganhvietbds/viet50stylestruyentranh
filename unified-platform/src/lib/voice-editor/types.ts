// Voice Editor Types

export interface Segment {
    segment_id: string;
    text: string;
    syllable_count: number;
    note: string;
    is_valid: boolean;
}

export interface Sentence {
    id: number;
    text: string;
}

export type SuggestionType = 'padding' | 'contextual' | 'optimization';

// Multi-language support for voice editor
export type VoiceLanguage = 'vi' | 'en' | 'ko' | 'ja';

export const VOICE_LANGUAGES = [
    { code: 'vi' as const, label: 'Tiếng Việt', flag: '🇻🇳', unit: 'âm tiết' },
    { code: 'en' as const, label: 'English', flag: '🇺🇸', unit: 'words' },
    { code: 'ko' as const, label: '한국어', flag: '🇰🇷', unit: '음절' },
    { code: 'ja' as const, label: '日本語', flag: '🇯🇵', unit: '文字' },
] as const;

// Japanese cinematic TTS defaults (8 seconds per segment)
// Reading speed: 3.8-4.2 chars/second for dramatic/samurai voice
export const JA_CINEMATIC_DEFAULTS = {
    min: 30,           // ✅ Optimal minimum
    max: 34,           // ✅ Optimal maximum
    warningLow: 26,    // ⚠️ Acceptable for pause/static scenes
    warningHigh: 37,   // ⚠️ Slightly fast but acceptable
} as const;

// Default syllable/character targets per language
export const LANGUAGE_DEFAULTS: Record<VoiceLanguage, { min: number; max: number }> = {
    vi: { min: 15, max: 22 },
    en: { min: 12, max: 18 },
    ko: { min: 15, max: 25 },
    ja: { min: JA_CINEMATIC_DEFAULTS.min, max: JA_CINEMATIC_DEFAULTS.max },
};

