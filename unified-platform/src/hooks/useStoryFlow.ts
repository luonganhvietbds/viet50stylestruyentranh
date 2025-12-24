'use client';

import { useState, useEffect, useCallback } from 'react';
import { StyleAgent, StoryIdea, StoryLength, GeneratedStory } from '@/types/styles';
import { getAllStyleAgents } from '@/services/stylesService';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { generateContent } from '@/lib/gemini';

export type StoryStep = 1 | 2 | 3 | 4 | 5;

interface UseStoryFlowReturn {
    // State
    currentStep: StoryStep;
    styles: StyleAgent[];
    loadingStyles: boolean;
    selectedStyle: StyleAgent | null;
    userInput: string;
    numIdeas: number;
    ideas: StoryIdea[];
    selectedIdea: StoryIdea | null;
    storyLength: StoryLength;
    customPrompt: string;
    generatedStory: GeneratedStory | null;
    isGenerating: boolean;
    error: string | null;

    // Actions
    setCurrentStep: (step: StoryStep) => void;
    selectStyle: (styleId: string) => void;
    setUserInput: (input: string) => void;
    setNumIdeas: (num: number) => void;
    generateIdeas: () => Promise<void>;
    selectIdea: (idea: StoryIdea) => void;
    setStoryLength: (length: StoryLength) => void;
    setCustomPrompt: (prompt: string) => void;
    generateStory: () => Promise<void>;
    reset: () => void;
    clearError: () => void;
}

export function useStoryFlow(): UseStoryFlowReturn {
    const { getNextKey, hasValidKey, handleKeyError } = useApiKey();

    // Core state
    const [currentStep, setCurrentStep] = useState<StoryStep>(1);
    const [styles, setStyles] = useState<StyleAgent[]>([]);
    const [loadingStyles, setLoadingStyles] = useState(true);
    const [selectedStyle, setSelectedStyle] = useState<StyleAgent | null>(null);
    const [userInput, setUserInput] = useState('');
    const [numIdeas, setNumIdeas] = useState(5);
    const [ideas, setIdeas] = useState<StoryIdea[]>([]);
    const [selectedIdea, setSelectedIdea] = useState<StoryIdea | null>(null);
    const [storyLength, setStoryLength] = useState<StoryLength>('Medium');
    const [customPrompt, setCustomPrompt] = useState('');
    const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch styles from Firestore
    useEffect(() => {
        const fetchStyles = async () => {
            setLoadingStyles(true);
            try {
                const fetchedStyles = await getAllStyleAgents();
                setStyles(fetchedStyles);
            } catch (err) {
                console.error('Error fetching styles:', err);
                setError('Không thể tải danh sách styles');
            } finally {
                setLoadingStyles(false);
            }
        };

        fetchStyles();
    }, []);

    // Select style by ID
    const selectStyle = useCallback((styleId: string) => {
        const style = styles.find(s => s.id === styleId);
        if (style) {
            setSelectedStyle(style);
            setError(null);
        }
    }, [styles]);

    // Select idea
    const selectIdea = useCallback((idea: StoryIdea) => {
        setSelectedIdea(idea);
        setError(null);
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Reset all state
    const reset = useCallback(() => {
        setCurrentStep(1);
        setSelectedStyle(null);
        setUserInput('');
        setNumIdeas(5);
        setIdeas([]);
        setSelectedIdea(null);
        setStoryLength('Medium');
        setCustomPrompt('');
        setGeneratedStory(null);
        setError(null);
    }, []);

    // Generate ideas using Gemini
    const generateIdeas = useCallback(async () => {
        if (!selectedStyle || !userInput.trim() || !hasValidKey) {
            setError('Vui lòng chọn style và nhập ý tưởng');
            return;
        }

        const apiKey = getNextKey();
        if (!apiKey) {
            setError('Không tìm thấy API key. Vui lòng thêm API key.');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const prompt = `${selectedStyle.systemPrompt}

Dựa trên mô tả sau, hãy tạo ${numIdeas} ý tưởng truyện độc đáo:
"${userInput}"

Trả về JSON array với format:
[
  {
    "id": "idea_1",
    "title": "Tiêu đề ngắn gọn",
    "hook": "Câu mở đầu hấp dẫn (1-2 câu)",
    "summary": "Tóm tắt cốt truyện (3-4 câu)",
    "conflict": "Mâu thuẫn chính",
    "tone": "Tone giọng (ví dụ: Nghiêm túc, Hài hước, Kịch tính)"
  }
]

CHỈ trả về JSON array, không có text khác.`;

            const result = await generateContent(apiKey, prompt);

            if (!result) {
                throw new Error('Không nhận được kết quả từ AI');
            }

            // Parse JSON from response
            const jsonMatch = result.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsedIdeas = JSON.parse(jsonMatch[0]) as StoryIdea[];
                setIdeas(parsedIdeas);
                setCurrentStep(3);
            } else {
                throw new Error('Không thể parse kết quả từ AI');
            }
        } catch (err) {
            console.error('Error generating ideas:', err);
            const errorMessage = err instanceof Error ? err.message : 'Lỗi khi tạo ý tưởng';

            // Check if it's an API key error
            if (errorMessage.includes('API') || errorMessage.includes('key') || errorMessage.includes('auth')) {
                handleKeyError();
            }

            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    }, [selectedStyle, userInput, numIdeas, hasValidKey, getNextKey, handleKeyError]);

    // Generate full story
    const generateStory = useCallback(async () => {
        if (!selectedStyle || !selectedIdea || !hasValidKey) {
            setError('Vui lòng chọn đủ thông tin');
            return;
        }

        const apiKey = getNextKey();
        if (!apiKey) {
            setError('Không tìm thấy API key. Vui lòng thêm API key.');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const lengthGuide = {
                Short: '300-500 từ',
                Medium: '800-1500 từ',
                Long: '2000-4000 từ',
                Epic: '5000+ từ'
            };

            const prompt = `${selectedStyle.systemPrompt}

${customPrompt ? `YÊU CẦU BỔ SUNG: ${customPrompt}` : ''}

Viết một câu chuyện hoàn chỉnh dựa trên:
- Tiêu đề: ${selectedIdea.title}
- Hook: ${selectedIdea.hook}
- Cốt truyện: ${selectedIdea.summary}
- Mâu thuẫn: ${selectedIdea.conflict}
- Tone: ${selectedIdea.tone}
- Độ dài: ${lengthGuide[storyLength]}

Hãy viết câu chuyện chi tiết, hấp dẫn với mở bài, thân bài, kết bài rõ ràng.
Sử dụng ngôn ngữ sinh động, mô tả chi tiết.

OUTPUT FORMAT:
# [Tiêu đề truyện]

[Nội dung truyện...]`;

            const result = await generateContent(apiKey, prompt);

            if (!result) {
                throw new Error('Không nhận được kết quả từ AI');
            }

            // Extract title from markdown
            const titleMatch = result.match(/^# (.+)$/m);
            const title = titleMatch ? titleMatch[1] : selectedIdea.title;

            // Count words
            const wordCount = result.split(/\s+/).length;

            const story: GeneratedStory = {
                id: `story_${Date.now()}`,
                styleId: selectedStyle.id,
                createdAt: new Date(),
                title,
                content: result,
                summary: selectedIdea.summary,
                wordCount
            };

            setGeneratedStory(story);
            setCurrentStep(5);
        } catch (err) {
            console.error('Error generating story:', err);
            const errorMessage = err instanceof Error ? err.message : 'Lỗi khi tạo truyện';

            if (errorMessage.includes('API') || errorMessage.includes('key') || errorMessage.includes('auth')) {
                handleKeyError();
            }

            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    }, [selectedStyle, selectedIdea, storyLength, customPrompt, hasValidKey, getNextKey, handleKeyError]);

    return {
        // State
        currentStep,
        styles,
        loadingStyles,
        selectedStyle,
        userInput,
        numIdeas,
        ideas,
        selectedIdea,
        storyLength,
        customPrompt,
        generatedStory,
        isGenerating,
        error,

        // Actions
        setCurrentStep,
        selectStyle,
        setUserInput,
        setNumIdeas,
        generateIdeas,
        selectIdea,
        setStoryLength,
        setCustomPrompt,
        generateStory,
        reset,
        clearError,
    };
}
