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
