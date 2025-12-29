// Segmentation Algorithm for Voice Segments
// Splits and merges text to achieve optimal syllable/character count per segment

import { countSyllables } from './syllableCounter';
import { Segment, VoiceLanguage } from './types';

export const createSegmentsFromSentences = (
    sentences: string[],
    minSyllables: number,
    maxSyllables: number,
    language: VoiceLanguage = 'vi'
): Segment[] => {
    const initialSegments: { text: string }[] = [];

    // For Japanese, we need character-based segmentation (no word splitting)
    const isJapanese = language === 'ja';

    for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) continue;

        if (isJapanese) {
            // Japanese: segment by character count, split at natural breaks (。、)
            let currentText = '';
            let charIndex = 0;

            while (charIndex < trimmedSentence.length) {
                currentText += trimmedSentence[charIndex];
                const currentCount = countSyllables(currentText, language);

                if (currentCount >= maxSyllables) {
                    // Find split point at natural break (。、) within last ~10 chars
                    let splitPos = currentText.length;
                    const searchStart = Math.max(0, currentText.length - 10);

                    for (let j = currentText.length - 1; j >= searchStart; j--) {
                        if (currentText[j] === '。' || currentText[j] === '、') {
                            splitPos = j + 1;
                            break;
                        }
                    }

                    const segmentText = currentText.substring(0, splitPos).trim();
                    if (countSyllables(segmentText, language) > 0) {
                        initialSegments.push({ text: segmentText });
                    }
                    currentText = currentText.substring(splitPos);
                }
                charIndex++;
            }

            if (countSyllables(currentText, language) > 0) {
                initialSegments.push({ text: currentText.trim() });
            }
        } else {
            // Non-Japanese: word-based segmentation (original logic)
            const words = trimmedSentence.split(/\s+/).filter(w => w);
            let currentSegmentText = "";

            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                const potentialSegment = (currentSegmentText + " " + word).trim();
                const syllableCount = countSyllables(potentialSegment, language);

                if (syllableCount > maxSyllables) {
                    let segmentToPush = currentSegmentText;
                    let nextSegmentStart = word;

                    // Try to find a better split point (comma, semicolon)
                    const lastCommaIndex = currentSegmentText.lastIndexOf(',');
                    const lastSemicolonIndex = currentSegmentText.lastIndexOf(';');
                    const splitIndex = Math.max(lastCommaIndex, lastSemicolonIndex);

                    if (splitIndex > 0 && countSyllables(currentSegmentText.substring(0, splitIndex + 1), language) >= minSyllables / 2) {
                        segmentToPush = currentSegmentText.substring(0, splitIndex + 1).trim();
                        nextSegmentStart = (currentSegmentText.substring(splitIndex + 1) + " " + word).trim();
                    }

                    if (countSyllables(segmentToPush, language) > 0) {
                        initialSegments.push({ text: segmentToPush });
                    }
                    currentSegmentText = nextSegmentStart;
                } else {
                    currentSegmentText = potentialSegment;
                }
            }

            if (countSyllables(currentSegmentText, language) > 0) {
                initialSegments.push({ text: currentSegmentText });
            }
        }
    }

    // Skip post-processing if too few segments
    if (initialSegments.length < 2) {
        return initialSegments.map((seg, index) => {
            const syllables = countSyllables(seg.text, language);
            return {
                segment_id: `VS_${String(index + 1).padStart(3, '0')}`,
                text: seg.text,
                note: '',
                syllable_count: syllables,
                is_valid: syllables >= minSyllables && syllables <= maxSyllables
            };
        });
    }

    // Post-processing: Merge segments that are too short
    const mergedSegments: { text: string }[] = [];
    let i = 0;

    while (i < initialSegments.length) {
        const current = initialSegments[i];

        if (countSyllables(current.text, language) < minSyllables && (i + 1 < initialSegments.length)) {
            const next = initialSegments[i + 1];
            const combinedText = isJapanese
                ? (current.text + next.text).trim()
                : (current.text + " " + next.text).trim();

            if (countSyllables(combinedText, language) <= maxSyllables) {
                mergedSegments.push({ text: combinedText });
                i += 2; // Skip next segment as it's merged
            } else {
                mergedSegments.push(current);
                i++;
            }
        } else {
            mergedSegments.push(current);
            i++;
        }
    }

    return mergedSegments.map((seg, index) => {
        const syllables = countSyllables(seg.text, language);
        return {
            segment_id: `VS_${String(index + 1).padStart(3, '0')}`,
            text: seg.text,
            note: '',
            syllable_count: syllables,
            is_valid: syllables >= minSyllables && syllables <= maxSyllables
        };
    });
};

// Create segments keeping original sentences (1 sentence = 1 segment)
export const createSegmentsFromOriginal = (
    sentences: string[],
    minSyllables: number,
    maxSyllables: number,
    language: VoiceLanguage = 'vi'
): Segment[] => {
    return sentences.map((sentence, index) => {
        const text = sentence.trim();
        const syllables = countSyllables(text, language);
        return {
            segment_id: `VS_${String(index + 1).padStart(3, '0')}`,
            text,
            note: '',
            syllable_count: syllables,
            is_valid: syllables >= minSyllables && syllables <= maxSyllables
        };
    });
};
