// Voice Editor AI Service Functions - Multi-language Support (VI/EN/KO/JA)

import { generateWithModelFallback } from '@/lib/gemini';
import { Segment, SuggestionType, VoiceLanguage } from './types';
import { countSyllables, getUnitLabel } from './syllableCounter';

// Suggestion prompts for all supported languages
const SUGGESTION_PROMPTS: Record<VoiceLanguage, Record<SuggestionType, string>> = {
    vi: {
        padding: `Bạn là chuyên gia xử lý ngôn ngữ tiếng Việt. Hãy thêm từ đệm vào câu dưới đây để đạt độ dài mục tiêu, GIỮ NGUYÊN Ý NGHĨA và nội dung chính.
CHỈ THÊM các từ nối như: "và", "thì", "mà", "để", "nên", "cũng", "đã", "đang", "rồi", "lại"...
KHÔNG thay đổi từ ngữ chính.`,
        contextual: `Bạn là chuyên gia xử lý ngôn ngữ tiếng Việt. Hãy thay thế từ đồng nghĩa hoặc thêm từ ngữ phù hợp ngữ cảnh để câu đạt độ dài mục tiêu.
Có thể thay đổi nhẹ cấu trúc câu nhưng GIỮ NGUYÊN Ý NGHĨA.`,
        optimization: `Bạn là chuyên gia xử lý ngôn ngữ tiếng Việt. Hãy viết lại câu dưới đây sao cho hay hơn, mượt hơn, và đạt độ dài mục tiêu.
Bạn có thể tự do sáng tạo nhưng phải GIỮ NGUYÊN Ý CHÍNH của câu.`
    },
    en: {
        padding: `You are an expert English language editor. Add filler words or phrases to the sentence below to reach the target word count while PRESERVING the original meaning.
ONLY ADD connectors like: "and", "also", "then", "so", "but", "yet", "however", "moreover", "in fact"...
DO NOT change the core words.`,
        contextual: `You are an expert English language editor. Replace words with synonyms or add contextually appropriate phrases to reach the target word count.
You may slightly restructure the sentence but PRESERVE the original meaning.`,
        optimization: `You are an expert English language editor. Rewrite the sentence below to make it more eloquent, smooth, and reach the target word count.
You have creative freedom but must PRESERVE the core meaning.`
    },
    ko: {
        padding: `당신은 한국어 전문 편집자입니다. 아래 문장에 접속사나 조사를 추가하여 목표 음절 수에 맞추세요. 원래 의미를 유지해야 합니다.
"그리고", "그래서", "하지만", "또한", "게다가", "그런데" 등의 연결어만 추가하세요.
핵심 단어는 변경하지 마세요.`,
        contextual: `당신은 한국어 전문 편집자입니다. 동의어로 대체하거나 문맥에 맞는 표현을 추가하여 목표 음절 수에 맞추세요.
문장 구조를 약간 변경할 수 있지만 원래 의미를 유지하세요.`,
        optimization: `당신은 한국어 전문 편집자입니다. 아래 문장을 더 자연스럽고 부드럽게 다시 작성하고 목표 음절 수에 맞추세요.
창의적으로 작성할 수 있지만 핵심 의미는 유지해야 합니다.`
    },
    ja: {
        padding: `あなたは日本語の映画ナレーション専門の編集者です。以下の文に助詞や接続詞を追加して、目標の文字数に調整してください。

【重要】映画的な語り（侍、ドラマ調）のため、読み速度は3.8〜4.2文字/秒です。
8秒の音声セグメント ≒ 30〜34文字が目標です。

追加できる接続語：「そして」「また」「しかし」「さらに」「それから」「やがて」「ついに」
核心的な言葉は変更しないでください。`,
        contextual: `あなたは日本語の映画ナレーション専門の編集者です。同義語に置き換えたり、文脈に合った表現を追加して目標の文字数（30〜34文字）に調整してください。

【重要】8秒の音声セグメントを想定しています。
文の構造を少し変更してもよいですが、元の意味と雰囲気を保持してください。`,
        optimization: `あなたは日本語の映画ナレーション専門の編集者です。以下の文をより自然でスムーズに書き直し、目標の文字数に合わせてください。

【目標】30〜34文字（8秒の音声セグメント）
【スタイル】映画的な語り、侍ドラマ調、重厚な雰囲気

創造的に書き直せますが、核心的な意味は保持してください。`
    }
};

// Merge prompts for all languages
const MERGE_PROMPTS: Record<VoiceLanguage, (text1: string, text2: string, min: number, max: number, unit: string) => string> = {
    vi: (text1, text2, min, max, unit) => `Bạn là chuyên gia xử lý ngôn ngữ tiếng Việt. Hãy gộp 2 câu dưới đây thành 1 câu mạch lạc, tự nhiên.

CÂU 1: "${text1}"
CÂU 2: "${text2}"

YÊU CẦU:
- Gộp thành 1 câu duy nhất
- Độ dài mục tiêu: ${min}-${max} ${unit}
- Giữ nguyên ý chính của cả 2 câu
- Câu mới phải mượt mà, tự nhiên

CHỈ TRẢ VỀ CÂU MỚI, KHÔNG giải thích.`,

    en: (text1, text2, min, max, unit) => `You are an expert English language editor. Merge the two sentences below into one coherent, natural sentence.

SENTENCE 1: "${text1}"
SENTENCE 2: "${text2}"

REQUIREMENTS:
- Merge into a single sentence
- Target length: ${min}-${max} ${unit}
- Preserve the main meaning of both sentences
- The new sentence must be smooth and natural

ONLY return the new sentence, NO explanations.`,

    ko: (text1, text2, min, max, unit) => `당신은 한국어 전문 편집자입니다. 아래 두 문장을 하나의 자연스러운 문장으로 합쳐주세요.

문장 1: "${text1}"
문장 2: "${text2}"

요구사항:
- 하나의 문장으로 합치기
- 목표 길이: ${min}-${max} ${unit}
- 두 문장의 핵심 의미 유지
- 새 문장은 자연스럽고 부드러워야 함

새 문장만 반환하세요. 설명 없이.`,

    ja: (text1, text2, min, max, unit) => `あなたは日本語の映画ナレーション専門の編集者です。以下の2つの文を1つの自然な文に統合してください。

文1: "${text1}"
文2: "${text2}"

要件:
- 1つの文に統合する
- 目標の長さ: ${min}-${max} ${unit}（8秒の音声セグメント）
- 両方の文の核心的な意味を保持
- 映画的な語り、重厚な雰囲気を維持

新しい文のみを返してください。説明は不要です。`
};

/**
 * Get AI suggestion to fix a segment to target syllable/word count
 * Uses the specified language for prompts and response
 */
export async function getVoiceSuggestion(
    text: string,
    type: SuggestionType,
    targetMin: number,
    targetMax: number,
    getNextKey: () => string | null,
    markKeyInvalid: ((key: string) => void) | null,
    language: VoiceLanguage = 'vi'
): Promise<string> {
    const currentCount = countSyllables(text, language);
    const targetRange = `${targetMin}-${targetMax}`;
    const unit = getUnitLabel(language);
    const prompts = SUGGESTION_PROMPTS[language];

    // Language-specific instruction labels
    const labels = {
        vi: { original: 'CÂU GỐC', requirement: 'YÊU CẦU', rewrite: 'Viết lại câu để đạt', onlyReturn: 'CHỈ TRẢ VỀ CÂU MỚI, KHÔNG giải thích gì thêm.' },
        en: { original: 'ORIGINAL SENTENCE', requirement: 'REQUIREMENT', rewrite: 'Rewrite to reach', onlyReturn: 'ONLY return the new sentence, NO explanations.' },
        ko: { original: '원문', requirement: '요구사항', rewrite: '다음 범위로 다시 작성하세요', onlyReturn: '새 문장만 반환하세요. 설명 없이.' },
        ja: { original: '原文', requirement: '要件', rewrite: '次の範囲で書き直してください', onlyReturn: '新しい文のみを返してください。説明は不要です。' }
    };

    const l = labels[language];
    const prompt = `${prompts[type]}

${l.original} (${currentCount} ${unit}): "${text}"

${l.requirement}: ${l.rewrite} ${targetRange} ${unit}.

${l.onlyReturn}`;

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
 * Merge two segments using AI - with language support
 */
export async function mergeSegmentsWithAI(
    text1: string,
    text2: string,
    targetMin: number,
    targetMax: number,
    getNextKey: () => string | null,
    markKeyInvalid: ((key: string) => void) | null,
    language: VoiceLanguage = 'vi'
): Promise<string> {
    const unit = getUnitLabel(language);
    const prompt = MERGE_PROMPTS[language](text1, text2, targetMin, targetMax, unit);

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
    onProgress?: (current: number, total: number) => void,
    language: VoiceLanguage = 'vi'
): Promise<Segment[]> {
    const results: Segment[] = [];
    const invalidSegments = segments.filter(s => !s.is_valid);
    const unit = getUnitLabel(language);

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
                    markKeyInvalid,
                    language
                );

                const newSyllables = countSyllables(newText, language);
                results.push({
                    ...segment,
                    text: newText,
                    syllable_count: newSyllables,
                    is_valid: newSyllables >= targetMin && newSyllables <= targetMax,
                    note: `AI ${type}: ${segment.syllable_count} → ${newSyllables} ${unit}`
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
