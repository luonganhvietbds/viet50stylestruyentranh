// Voice Editor AI Service Functions

import { generateWithModelFallback } from '@/lib/gemini';
import { Segment, SuggestionType } from './types';
import { countSyllables } from './syllableCounter';

// Suggestion prompt templates
const SUGGESTION_PROMPTS: Record<SuggestionType, string> = {
    padding: `Bạn là chuyên gia xử lý ngôn ngữ tiếng Việt. Hãy thêm từ đệm vào câu dưới đây để đạt độ dài mục tiêu, GIỮNGUYÊN Ý NGHĨA và nội dung chính.
CHỈ THÊM các từ nối như: "và", "thì", "mà", "để", "nên", "cũng", "đã", "đang", "rồi", "lại"...
KHÔNG thay đổi từ ngữ chính.`,

    contextual: `Bạn là chuyên gia xử lý ngôn ngữ tiếng Việt. Hãy thay thế từ đồng nghĩa hoặc thêm từ ngữ phù hợp ngữ cảnh để câu đạt độ dài mục tiêu.
Có thể thay đổi nhẹ cấu trúc câu nhưng GIỮ NGUYÊN Ý NGHĨA.`,

    optimization: `Bạn là chuyên gia xử lý ngôn ngữ tiếng Việt. Hãy viết lại câu dưới đây sao cho hay hơn, mượt hơn, và đạt độ dài mục tiêu.
Bạn có thể tự do sáng tạo nhưng phải GIỮ NGUYÊN Ý CHÍNH của câu.`
};

/**
 * Get AI suggestion to fix a segment to target syllable count
 */
export async function getVoiceSuggestion(
    text: string,
    type: SuggestionType,
    targetMin: number,
    targetMax: number,
    getNextKey: () => string | null,
    markKeyInvalid: ((key: string) => void) | null
): Promise<string> {
    const currentSyllables = countSyllables(text);
    const targetRange = `${targetMin}-${targetMax}`;

    const prompt = `${SUGGESTION_PROMPTS[type]}

CÂU GỐC (${currentSyllables} âm tiết): "${text}"

YÊU CẦU: Viết lại câu để đạt ${targetRange} âm tiết.

CHỈ TRẢ VỀ CÂU MỚI, KHÔNG giải thích gì thêm.`;

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
 * Merge two segments using AI
 */
export async function mergeSegmentsWithAI(
    text1: string,
    text2: string,
    targetMin: number,
    targetMax: number,
    getNextKey: () => string | null,
    markKeyInvalid: ((key: string) => void) | null
): Promise<string> {
    const prompt = `Bạn là chuyên gia xử lý ngôn ngữ tiếng Việt. Hãy gộp 2 câu dưới đây thành 1 câu mạch lạc, tự nhiên.

CÂU 1: "${text1}"
CÂU 2: "${text2}"

YÊU CẦU:
- Gộp thành 1 câu duy nhất
- Độ dài mục tiêu: ${targetMin}-${targetMax} âm tiết
- Giữ nguyên ý chính của cả 2 câu
- Câu mới phải mượt mà, tự nhiên

CHỈ TRẢ VỀ CÂU MỚI, KHÔNG giải thích.`;

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
            results.push({
                ...segment,
                text: newText,
                syllable_count: newSyllables,
                is_valid: newSyllables >= targetMin && newSyllables <= targetMax,
                note: `AI ${type}: ${segment.syllable_count} → ${newSyllables} âm`
            });

            onProgress?.(i + 1, invalidSegments.length);

            // Rate limiting delay
            if (i < invalidSegments.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
            }
        } catch (error) {
            // Keep original segment on error
            results.push({
                ...segment,
                note: `Lỗi AI: ${error instanceof Error ? error.message : 'Unknown'}`
            });
            onProgress?.(i + 1, invalidSegments.length);
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
