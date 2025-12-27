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
    { code: 'ja' as const, label: '日本語', flag: '🇯🇵', unit: 'モーラ' },
] as const;
