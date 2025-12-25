// Voice Editor AI Service Functions - Multi-language Support

import { generateWithModelFallback } from '@/lib/gemini';
import { Segment, SuggestionType } from './types';
import { countSyllables } from './syllableCounter';

/**
 * Detect if text is primarily English or Vietnamese
 */
function detectLanguage(text: string): 'en' | 'vi' {
    // Check for Vietnamese-specific characters
    const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    const hasVietnamese = vietnameseChars.test(text);

    if (hasVietnamese) {
        return 'vi';
    }

    // Check ratio of ASCII vs non-ASCII characters
    const asciiLetters = text.match(/[a-zA-Z]/g) || [];
    const nonAsciiChars = text.match(/[^\x00-\x7F]/g) || [];

    if (asciiLetters.length > 0 && nonAsciiChars.length === 0) {
        return 'en';
    }

    return 'vi'; // Default to Vietnamese
}

// Bilingual suggestion prompts
const SUGGESTION_PROMPTS_VI: Record<SuggestionType, string> = {
    padding: `Bạn là chuyên gia xử lý ngôn ngữ tiếng Việt. Hãy thêm từ đệm vào câu dưới đây để đạt độ dài mục tiêu, GIỮ NGUYÊN Ý NGHĨA và nội dung chính.
CHỈ THÊM các từ nối như: "và", "thì", "mà", "để", "nên", "cũng", "đã", "đang", "rồi", "lại"...
KHÔNG thay đổi từ ngữ chính.`,

    contextual: `Bạn là chuyên gia xử lý ngôn ngữ tiếng Việt. Hãy thay thế từ đồng nghĩa hoặc thêm từ ngữ phù hợp ngữ cảnh để câu đạt độ dài mục tiêu.
Có thể thay đổi nhẹ cấu trúc câu nhưng GIỮ NGUYÊN Ý NGHĨA.`,

    optimization: `Bạn là chuyên gia xử lý ngôn ngữ tiếng Việt. Hãy viết lại câu dưới đây sao cho hay hơn, mượt hơn, và đạt độ dài mục tiêu.
Bạn có thể tự do sáng tạo nhưng phải GIỮ NGUYÊN Ý CHÍNH của câu.`
};

const SUGGESTION_PROMPTS_EN: Record<SuggestionType, string> = {
    padding: `You are an expert English language editor. Add filler words or phrases to the sentence below to reach the target word count while PRESERVING the original meaning.
ONLY ADD connectors like: "and", "also", "then", "so", "but", "yet", "however", "moreover", "in fact"...
DO NOT change the core words.`,

    contextual: `You are an expert English language editor. Replace words with synonyms or add contextually appropriate phrases to reach the target word count.
You may slightly restructure the sentence but PRESERVE the original meaning.`,

    optimization: `You are an expert English language editor. Rewrite the sentence below to make it more eloquent, smooth, and reach the target word count.
You have creative freedom but must PRESERVE the core meaning.`
};

/**
 * Get AI suggestion to fix a segment to target syllable/word count
 * Automatically detects language and responds in the same language
 */
export async function getVoiceSuggestion(
    text: string,
    type: SuggestionType,
    targetMin: number,
    targetMax: number,
    getNextKey: () => string | null,
    markKeyInvalid: ((key: string) => void) | null
): Promise<string> {
    const lang = detectLanguage(text);
    const currentCount = countSyllables(text);
    const targetRange = `${targetMin}-${targetMax}`;

    const prompts = lang === 'vi' ? SUGGESTION_PROMPTS_VI : SUGGESTION_PROMPTS_EN;
    const countUnit = lang === 'vi' ? 'âm tiết' : 'words';

    const prompt = `${prompts[type]}

${lang === 'vi' ? 'CÂU GỐC' : 'ORIGINAL SENTENCE'} (${currentCount} ${countUnit}): "${text}"

${lang === 'vi' ? 'YÊU CẦU' : 'REQUIREMENT'}: ${lang === 'vi' ? 'Viết lại câu để đạt' : 'Rewrite to reach'} ${targetRange} ${countUnit}.

${lang === 'vi' ? 'CHỈ TRẢ VỀ CÂU MỚI, KHÔNG giải thích gì thêm.' : 'ONLY return the new sentence, NO explanations.'}`;

    const result = await generateWithModelFallback(
        getNextKey,
        markKeyInvalid,
        prompt,
        undefined,
        { maxRetries: 2, delayMs: 1000 }
    );

    // Clean up response - remove quotes and extra whitespace
    return result?.trim().replace(/^["']|["']$/g, '') || text;
}

/**
 * Merge two segments using AI - with language detection
 */
export async function mergeSegmentsWithAI(
    text1: string,
    text2: string,
    targetMin: number,
    targetMax: number,
    getNextKey: () => string | null,
    markKeyInvalid: ((key: string) => void) | null
): Promise<string> {
    const lang = detectLanguage(text1 + ' ' + text2);
    const countUnit = lang === 'vi' ? 'âm tiết' : 'words';

    const prompt = lang === 'vi'
        ? `Bạn là chuyên gia xử lý ngôn ngữ tiếng Việt. Hãy gộp 2 câu dưới đây thành 1 câu mạch lạc, tự nhiên.

CÂU 1: "${text1}"
CÂU 2: "${text2}"

YÊU CẦU:
- Gộp thành 1 câu duy nhất
- Độ dài mục tiêu: ${targetMin}-${targetMax} ${countUnit}
- Giữ nguyên ý chính của cả 2 câu
- Câu mới phải mượt mà, tự nhiên

CHỈ TRẢ VỀ CÂU MỚI, KHÔNG giải thích.`
        : `You are an expert English language editor. Merge the two sentences below into one coherent, natural sentence.

SENTENCE 1: "${text1}"
SENTENCE 2: "${text2}"

REQUIREMENTS:
- Merge into a single sentence
- Target length: ${targetMin}-${targetMax} ${countUnit}
- Preserve the main meaning of both sentences
- The new sentence must be smooth and natural

ONLY return the new sentence, NO explanations.`;

    const result = await generateWithModelFallback(
        getNextKey,
        markKeyInvalid,
        prompt,
        undefined,
        { maxRetries: 2, delayMs: 1000 }
    );

    return result?.trim().replace(/^["']|["']$/g, '') || `${text1} ${text2}`;
}

/**
 * Bulk fix multiple segments with AI
 */
export async function bulkFixSegments(
    segments: Segment[],
    type: SuggestionType,
    targetMin: number,
    targetMax: number,
    getNextKey: () => string | null,
    markKeyInvalid: ((key: string) => void) | null,
    onProgress?: (current: number, total: number) => void
): Promise<Segment[]> {
    const results: Segment[] = [];
    const invalidSegments = segments.filter(s => !s.is_valid);

    for (let i = 0; i < invalidSegments.length; i++) {
        const segment = invalidSegments[i];
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount <= maxRetries) {
            try {
                const newText = await getVoiceSuggestion(
                    segment.text,
                    type,
                    targetMin,
                    targetMax,
                    getNextKey,
                    markKeyInvalid
                );

                const newSyllables = countSyllables(newText);
                const lang = detectLanguage(segment.text);
                results.push({
                    ...segment,
                    text: newText,
                    syllable_count: newSyllables,
                    is_valid: newSyllables >= targetMin && newSyllables <= targetMax,
                    note: `AI ${type}: ${segment.syllable_count} → ${newSyllables} ${lang === 'vi' ? 'âm' : 'words'}`
                });

                onProgress?.(i + 1, invalidSegments.length);
                break; // Success, exit retry loop

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown';

                // Check for rate limit errors (429)
                if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                    retryCount++;
                    if (retryCount <= maxRetries) {
                        // Exponential backoff: 5s, 10s, 20s
                        const backoffMs = 5000 * Math.pow(2, retryCount - 1);
                        console.log(`Rate limited, waiting ${backoffMs}ms before retry ${retryCount}/${maxRetries}...`);
                        await new Promise(resolve => setTimeout(resolve, backoffMs));
                        continue;
                    }
                }

                // Keep original segment on error
                results.push({
                    ...segment,
                    note: `Lỗi AI: ${errorMessage}`
                });
                onProgress?.(i + 1, invalidSegments.length);
                break;
            }
        }

        // Rate limiting delay between segments - increased to 2-3 seconds
        if (i < invalidSegments.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
        }
    }

    // Merge results back with valid segments
    const validSegments = segments.filter(s => s.is_valid);
    const allSegments = [...validSegments, ...results];

    // Sort by original segment_id
    return allSegments.sort((a, b) => {
        const idA = parseInt(a.segment_id.replace('VS_', ''));
        const idB = parseInt(b.segment_id.replace('VS_', ''));
        return idA - idB;
    });
}
