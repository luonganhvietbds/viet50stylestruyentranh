// Voice AI Service - Gemini integration for segment suggestions
// Uses unified ApiKeyContext instead of localStorage

import { Segment, SuggestionType } from '@/lib/voice-editor/types';
import { generateContent } from '@/lib/gemini';

/**
 * Get AI suggestions for a segment with context
 * Returns 3 types: padding, contextual, optimization
 */
export async function getAdvancedSuggestions(
    apiKey: string,
    currentSegment: Segment,
    prevSegment: Segment | null,
    nextSegment: Segment | null,
    minSyllables: number,
    maxSyllables: number
): Promise<string[]> {
    try {
        const prompt = `
You are an expert multilingual voice-over script editor, fluent in both Vietnamese and English.
A user needs help refining a voice segment.

Here is the context:
- Previous Segment: "${prevSegment ? prevSegment.text : 'Not available'}"
- **Current Segment (to be improved): "${currentSegment.text}"** (Original syllable/word count: ${currentSegment.syllable_count})
- Next Segment: "${nextSegment ? nextSegment.text : 'Not available'}"

Your task is to provide exactly three distinct suggestions to improve the "Current Segment".

CRITICAL CONSTRAINTS FOR ALL SUGGESTIONS:
1.  **Language:** All suggestions MUST be in the same language as the "Current Segment".
2.  **Length:**
    - For Vietnamese text, the syllable count must be STRICTLY between ${minSyllables} and ${maxSyllables}.
    - For English text, the WORD count must be STRICTLY between ${minSyllables} and ${maxSyllables}.
3.  **Meaning:** The core meaning must be preserved or logically enhanced based on context.
4.  **Format:** The output MUST be a valid JSON array of strings, containing exactly three strings. Do not add any extra text or explanations outside the JSON array.

Provide the following three types of suggestions in this exact order:

1.  **Padding/Filler Suggestion:** Rewrite the segment by adding filler words to adjust the length and improve natural flow. Keep the original words and phrasing as intact as possible.
2.  **Contextual Rewrite Suggestion:** Rewrite the segment to create a smoother, more logical transition from the "Previous Segment" and into the "Next Segment".
3.  **General Optimization Suggestion:** Provide a general-purpose improved version of the segment. Focus on making it more concise, clear, and impactful, while respecting the length rules.

Example output for a VIETNAMESE input:
[
  "Đây là gợi ý thứ nhất có thêm các từ đệm.",
  "Đây là gợi ý thứ hai được viết lại theo ngữ cảnh của câu chuyện.",
  "Đây là gợi ý thứ ba được tối ưu hóa chung cho hay hơn."
]

Now, provide the three suggestions for the current segment, following all rules.
    `;

        const response = await generateContent(apiKey, prompt);

        if (!response) {
            return ["AI could not provide suggestions, please try again."];
        }

        // Parse JSON array from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const suggestions = JSON.parse(jsonMatch[0]);
            return Array.isArray(suggestions) && suggestions.length > 0
                ? suggestions
                : ["AI could not provide suggestions, please try again."];
        }

        return ["AI could not provide suggestions, please try again."];
    } catch (error) {
        console.error('Error getting AI suggestions:', error);
        return ["An error occurred while getting suggestions."];
    }
}

/**
 * Bulk fix multiple segments at once
 */
export async function bulkFixSegments(
    apiKey: string,
    segments: Segment[],
    minSyllables: number,
    maxSyllables: number
): Promise<Segment[]> {
    try {
        const prompt = `
You are an expert multilingual voice-over script editor, fluent in both Vietnamese and English. You will be given a JSON array of text segments.
Your task is to fix all of them according to these rules:
1.  **Language:** Respond in the same language as the input text for each segment. Do not translate.
2.  **Length:** Adjust the wording of each segment so that:
    - For Vietnamese text, its syllable count is STRICTLY between ${minSyllables} and ${maxSyllables}.
    - For English text, its WORD count is STRICTLY between ${minSyllables} and ${maxSyllables}.
    This is the highest priority.
3.  **Improve Flow:** Ensure a smooth, natural transition between the segments.
4.  **Fix Grammar:** Correct any grammatical errors or typos.
5.  **Preserve Meaning:** Maintain the original core meaning of the text.

The input is a JSON array of objects, each with a 'segment_id' and 'text'.
The output MUST be a valid JSON array with the exact same structure and 'segment_id's, containing the modified text. Do not add any extra text or explanations.

Input Segments:
${JSON.stringify(segments.map(s => ({ segment_id: s.segment_id, text: s.text })), null, 2)}
        `;

        const response = await generateContent(apiKey, prompt);

        if (!response) {
            return segments;
        }

        // Parse JSON array from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const fixedSegmentsData = JSON.parse(jsonMatch[0]) as { segment_id: string; text: string }[];

            // Merge results back into original segments
            const updatedSegments = segments.map(originalSegment => {
                const fixedData = fixedSegmentsData.find(fs => fs.segment_id === originalSegment.segment_id);
                if (fixedData) {
                    return {
                        ...originalSegment,
                        text: fixedData.text,
                    };
                }
                return originalSegment;
            });

            return updatedSegments;
        }

        return segments;
    } catch (error) {
        console.error('Bulk fix error:', error);
        return segments; // Return original segments on error
    }
}

/**
 * Merge two segments with AI rewriting
 */
export async function mergeSegmentsWithAI(
    apiKey: string,
    segment1: Segment,
    segment2: Segment,
    minSyllables: number,
    maxSyllables: number
): Promise<string> {
    try {
        const prompt = `
You are an expert multilingual copywriter, fluent in both Vietnamese and English. Your task is to merge two separate text segments into one single, coherent, and natural-sounding sentence.

Segment 1: "${segment1.text}"
Segment 2: "${segment2.text}"

CRITICAL CONSTRAINTS:
1.  **Language:** The merged text MUST be in the same language as the input segments. Do not translate.
2.  **Length:**
    - If the language is Vietnamese, the merged text's syllable count MUST be STRICTLY between ${minSyllables} and ${maxSyllables}.
    - If the language is English, the merged text's WORD count MUST be STRICTLY between ${minSyllables} and ${maxSyllables}.
3.  **Meaning:** Preserve the core meaning of both original segments.
4.  **Format:** The output must be a single string containing only the merged text. Do not add explanations or any other text.

Now, merge the two segments.
        `;

        const response = await generateContent(apiKey, prompt);

        if (!response) {
            return `${segment1.text} ${segment2.text}`;
        }

        const mergedText = response.trim();
        return mergedText || `${segment1.text} ${segment2.text}`;
    } catch (error) {
        console.error('Merge error:', error);
        return `${segment1.text} ${segment2.text}`; // Fallback on error
    }
}

/**
 * Get a single targeted suggestion based on type
 */
export async function getTargetedSuggestion(
    apiKey: string,
    currentSegment: Segment,
    prevSegment: Segment | null,
    nextSegment: Segment | null,
    suggestionType: SuggestionType,
    minSyllables: number,
    maxSyllables: number
): Promise<string> {
    try {
        let suggestionDescription = '';
        switch (suggestionType) {
            case 'padding':
                suggestionDescription = 'Rewrite the segment by adding filler words to adjust the length and improve natural flow. Crucially, the original words and phrasing must be kept as intact as possible. Only add words where necessary to meet length requirements.';
                break;
            case 'contextual':
                suggestionDescription = 'Rewrite the segment to create a smoother, more logical transition from the "Previous Segment" and into the "Next Segment". You have more creative freedom here to rephrase completely if it improves the overall narrative flow.';
                break;
            case 'optimization':
                suggestionDescription = 'Provide a general-purpose improved version of the segment. Focus on making it more concise, clear, and impactful, while respecting the length rules.';
                break;
        }

        const prompt = `
You are an expert multilingual voice-over script editor, fluent in both Vietnamese and English.
A user needs help refining a voice segment.

Here is the context:
- Previous Segment: "${prevSegment ? prevSegment.text : 'Not available'}"
- **Current Segment (to be improved): "${currentSegment.text}"**
- Next Segment: "${nextSegment ? nextSegment.text : 'Not available'}"

Your task is to provide ONE SINGLE suggestion based on the following instruction:
**Instruction: ${suggestionDescription}**

CRITICAL CONSTRAINTS:
1.  **Language:** The suggestion MUST be in the same language as the "Current Segment".
2.  **Length:**
    - If the language is Vietnamese, the suggested text's syllable count MUST be STRICTLY between ${minSyllables} and ${maxSyllables}.
    - If the language is English, the suggested text's WORD count MUST be STRICTLY between ${minSyllables} and ${maxSyllables}.
3.  **Meaning:** The core meaning must be preserved or logically enhanced based on context.
4.  **Format:** The output MUST be a single string containing only the suggested text. Do not add any extra text, explanations, or JSON formatting.

Now, provide the single suggestion.
    `;

        const response = await generateContent(apiKey, prompt);
        return response?.trim() || currentSegment.text;
    } catch (error) {
        console.error(`Error getting targeted suggestion for segment ${currentSegment.segment_id}:`, error);
        return currentSegment.text;
    }
}
