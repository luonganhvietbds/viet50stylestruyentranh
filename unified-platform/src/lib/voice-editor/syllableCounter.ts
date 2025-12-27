// Multi-language Syllable Counter for Voice Editor
// Supports: Vietnamese, English, Korean, Japanese

import { VoiceLanguage } from './types';

/**
 * Count syllables/units based on language
 * - Vietnamese: word count (space-separated)
 * - English: word count (space-separated)
 * - Korean: Hangul syllable blocks (U+AC00-D7A3)
 * - Japanese: mora count (Hiragana/Katakana characters)
 */
export const countSyllables = (text: string, language: VoiceLanguage = 'vi'): number => {
    if (!text) return 0;

    switch (language) {
        case 'ko':
            return countKoreanSyllables(text);
        case 'ja':
            return countJapaneseMora(text);
        default:
            // Vietnamese and English use word count
            return countWordBased(text);
    }
};

/**
 * Word-based counting for Vietnamese/English
 * Each whitespace-separated word = 1 unit
 */
const countWordBased = (text: string): number => {
    // Remove all punctuation before counting
    const cleanedText = text.replace(/[.,!?;:(){}[\]"']/g, '');
    const trimmedText = cleanedText.trim();

    if (trimmedText === '') return 0;

    // Each word (space-separated) = 1 syllable
    return trimmedText.split(/\s+/).length;
};

/**
 * Korean syllable counting
 * Each Hangul syllable block (가-힣) = 1 syllable
 * Also counts Latin words as 1 unit each
 */
const countKoreanSyllables = (text: string): number => {
    if (!text) return 0;

    let count = 0;
    const cleanedText = text.replace(/[.,!?;:(){}[\]"']/g, '').trim();

    if (cleanedText === '') return 0;

    // Hangul syllable block range: U+AC00 to U+D7A3
    const hangulRegex = /[\uAC00-\uD7A3]/g;
    const hangulMatches = cleanedText.match(hangulRegex);
    count += hangulMatches ? hangulMatches.length : 0;

    // Count non-Korean words (Latin, numbers) as separate units
    const nonKoreanText = cleanedText.replace(/[\uAC00-\uD7A3]/g, ' ').trim();
    const words = nonKoreanText.split(/\s+/).filter(w => w.length > 0);
    count += words.length;

    return count;
};

/**
 * Japanese mora counting
 * Each Hiragana/Katakana = 1 mora
 * Small kana (っ, ゃ, ゅ, ょ, etc.) counted separately
 * Kanji and Latin words counted as units
 */
const countJapaneseMora = (text: string): number => {
    if (!text) return 0;

    let count = 0;
    const cleanedText = text.replace(/[.,!?;:(){}[\]"'、。！？「」『』]/g, '').trim();

    if (cleanedText === '') return 0;

    // Count Hiragana characters (U+3040-U+309F)
    const hiraganaMatches = cleanedText.match(/[\u3040-\u309F]/g);
    count += hiraganaMatches ? hiraganaMatches.length : 0;

    // Count Katakana characters (U+30A0-U+30FF)
    const katakanaMatches = cleanedText.match(/[\u30A0-\u30FF]/g);
    count += katakanaMatches ? katakanaMatches.length : 0;

    // Count Kanji (U+4E00-U+9FAF) - approximate 2 mora per kanji
    const kanjiMatches = cleanedText.match(/[\u4E00-\u9FAF]/g);
    count += kanjiMatches ? kanjiMatches.length * 2 : 0;

    // Count non-Japanese words (Latin, numbers) as separate units
    const nonJapaneseText = cleanedText
        .replace(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, ' ')
        .trim();
    const words = nonJapaneseText.split(/\s+/).filter(w => w.length > 0);
    count += words.length;

    return count;
};

/**
 * Get the unit label for a language
 */
export const getUnitLabel = (language: VoiceLanguage): string => {
    switch (language) {
        case 'ko': return '음절';
        case 'ja': return 'モーラ';
        case 'en': return 'words';
        default: return 'âm tiết';
    }
};
