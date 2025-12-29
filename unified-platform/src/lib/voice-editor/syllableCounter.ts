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
            return countJapaneseCharacters(text);
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
 * Japanese character counting for cinematic TTS
 * 
 * SPEC: 30-34 characters = ~8 seconds (3.8-4.2 chars/sec reading speed)
 * 
 * Count as 1 character:
 * - Kanji (漢字): U+4E00-U+9FAF
 * - Hiragana (ひらがな): U+3040-U+309F  
 * - Katakana (カタカナ): U+30A0-U+30FF
 * - Prolonged sound mark (ー): part of Katakana range
 * 
 * DO NOT count:
 * - Punctuation: 、。「」『』！？
 * - Spaces and line breaks
 */
const countJapaneseCharacters = (text: string): number => {
    if (!text) return 0;

    let count = 0;

    // Remove punctuation, spaces, and line breaks
    // Keep only: Kanji, Hiragana, Katakana (includes ー)
    const cleanedText = text
        .replace(/[.,!?;:(){}[\]"'、。！？「」『』【】（）\s\n\r]/g, '')
        .trim();

    if (cleanedText === '') return 0;

    // Count Hiragana characters (U+3040-U+309F) - 1 char each
    const hiraganaMatches = cleanedText.match(/[\u3040-\u309F]/g);
    count += hiraganaMatches ? hiraganaMatches.length : 0;

    // Count Katakana characters (U+30A0-U+30FF) including ー - 1 char each
    const katakanaMatches = cleanedText.match(/[\u30A0-\u30FF]/g);
    count += katakanaMatches ? katakanaMatches.length : 0;

    // Count Kanji (U+4E00-U+9FAF) - 1 char each (NOT 2 mora)
    const kanjiMatches = cleanedText.match(/[\u4E00-\u9FAF]/g);
    count += kanjiMatches ? kanjiMatches.length : 0;

    // Note: Latin/numbers are excluded for pure Japanese cinematic TTS
    // If needed for mixed content, uncomment below:
    // const nonJapaneseText = cleanedText.replace(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, ' ').trim();
    // const words = nonJapaneseText.split(/\s+/).filter(w => w.length > 0);
    // count += words.length;

    return count;
};

/**
 * Get the unit label for a language
 */
export const getUnitLabel = (language: VoiceLanguage): string => {
    switch (language) {
        case 'ko': return '음절';
        case 'ja': return '文字';
        case 'en': return 'words';
        default: return 'âm tiết';
    }
};
