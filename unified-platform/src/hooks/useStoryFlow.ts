'use client';

import { useState, useEffect, useCallback } from 'react';
import { StyleAgent, StoryIdea, StoryLength, GeneratedStory } from '@/types/styles';
import { getAllStyleAgents } from '@/services/stylesService';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageInstruction, getLanguageLabel } from '@/types/language';
import { generateWithModelFallback } from '@/lib/gemini';

export type StoryStep = 1 | 2 | 3 | 4 | 5;

// Storage keys for Story Flow persistence
const STORAGE_KEYS = {
    currentStep: 'story_flow_step',
    selectedStyleId: 'story_flow_style_id',
    userInput: 'story_flow_input',
    numIdeas: 'story_flow_num_ideas',
    ideas: 'story_flow_ideas',
    selectedIdea: 'story_flow_selected_idea',
    storyLength: 'story_flow_length',
    customPrompt: 'story_flow_custom_prompt',
    generatedStory: 'story_flow_generated_story',
};

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
    const { getNextKey, hasValidKey, handleKeyError, markKeyInvalid } = useApiKey();
    const { language } = useLanguage();

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
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const savedStep = localStorage.getItem(STORAGE_KEYS.currentStep);
            if (savedStep) setCurrentStep(Number(savedStep) as StoryStep);

            const savedInput = localStorage.getItem(STORAGE_KEYS.userInput);
            if (savedInput) setUserInput(savedInput);

            const savedNumIdeas = localStorage.getItem(STORAGE_KEYS.numIdeas);
            if (savedNumIdeas) setNumIdeas(Number(savedNumIdeas));

            const savedIdeas = localStorage.getItem(STORAGE_KEYS.ideas);
            if (savedIdeas) setIdeas(JSON.parse(savedIdeas));

            const savedSelectedIdea = localStorage.getItem(STORAGE_KEYS.selectedIdea);
            if (savedSelectedIdea) setSelectedIdea(JSON.parse(savedSelectedIdea));

            const savedLength = localStorage.getItem(STORAGE_KEYS.storyLength);
            if (savedLength) setStoryLength(savedLength as StoryLength);

            const savedCustomPrompt = localStorage.getItem(STORAGE_KEYS.customPrompt);
            if (savedCustomPrompt) setCustomPrompt(savedCustomPrompt);

            const savedStory = localStorage.getItem(STORAGE_KEYS.generatedStory);
            if (savedStory) setGeneratedStory(JSON.parse(savedStory));
        } catch { /* ignore */ }
        setIsLoaded(true);
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        if (!isLoaded) return;
        try {
            localStorage.setItem(STORAGE_KEYS.currentStep, String(currentStep));
            localStorage.setItem(STORAGE_KEYS.userInput, userInput);
            localStorage.setItem(STORAGE_KEYS.numIdeas, String(numIdeas));
            localStorage.setItem(STORAGE_KEYS.ideas, JSON.stringify(ideas));
            if (selectedIdea) localStorage.setItem(STORAGE_KEYS.selectedIdea, JSON.stringify(selectedIdea));
            localStorage.setItem(STORAGE_KEYS.storyLength, storyLength);
            localStorage.setItem(STORAGE_KEYS.customPrompt, customPrompt);
            if (generatedStory) localStorage.setItem(STORAGE_KEYS.generatedStory, JSON.stringify(generatedStory));
        } catch { /* ignore */ }
    }, [isLoaded, currentStep, userInput, numIdeas, ideas, selectedIdea, storyLength, customPrompt, generatedStory]);

    // Fetch styles from Firestore
    useEffect(() => {
        const fetchStyles = async () => {
            setLoadingStyles(true);
            try {
                const fetchedStyles = await getAllStyleAgents();
                setStyles(fetchedStyles);

                // Restore selected style from localStorage
                const savedStyleId = localStorage.getItem(STORAGE_KEYS.selectedStyleId);
                if (savedStyleId) {
                    const style = fetchedStyles.find(s => s.id === savedStyleId);
                    if (style) setSelectedStyle(style);
                }
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

    // Generate ideas using Gemini with auto-retry
    const generateIdeas = useCallback(async () => {
        if (!selectedStyle || !userInput.trim() || !hasValidKey) {
            setError('Vui lòng chọn style và nhập ý tưởng');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const langInstruction = getLanguageInstruction(language);
            const langLabel = getLanguageLabel(language);

            const prompt = `${selectedStyle.systemPrompt}

# LANGUAGE SETTING
${langInstruction}

Based on the following description, create ${numIdeas} unique story ideas:
"${userInput}"

Return a JSON array with format:
[
  {
    "id": "idea_1",
    "title": "Short catchy title",
    "hook": "Compelling opening hook (1-2 sentences)",
    "summary": "Plot summary (3-4 sentences)",
    "conflict": "Main conflict",
    "tone": "Story tone (e.g., Serious, Humorous, Dramatic)"
  }
]

IMPORTANT: All text content MUST be in ${langLabel}.
Return ONLY the JSON array, no other text.`;

            const result = await generateWithModelFallback(
                getNextKey,
                markKeyInvalid,
                prompt,
                undefined,
                { maxRetries: 2, delayMs: 1500 }
            );

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
    }, [selectedStyle, userInput, numIdeas, language, hasValidKey, getNextKey, markKeyInvalid, handleKeyError]);

    // Generate full story
    const generateStory = useCallback(async () => {
        if (!selectedStyle || !selectedIdea || !hasValidKey) {
            setError('Vui lòng chọn đủ thông tin');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const langInstruction = getLanguageInstruction(language);
            const langLabel = getLanguageLabel(language);

            const lengthGuide = {
                Short: language === 'vi' ? '300-500 từ' : '300-500 words',
                Medium: language === 'vi' ? '800-1500 từ' : '800-1500 words',
                Long: language === 'vi' ? '2000-4000 từ' : '2000-4000 words',
                Epic: language === 'vi' ? '5000+ từ' : '5000+ words'
            };

            const prompt = `${selectedStyle.systemPrompt}

# LANGUAGE SETTING
${langInstruction}

${customPrompt ? `ADDITIONAL REQUIREMENTS: ${customPrompt}` : ''}

Write a complete story based on:
- Title: ${selectedIdea.title}
- Hook: ${selectedIdea.hook}
- Plot: ${selectedIdea.summary}
- Conflict: ${selectedIdea.conflict}
- Tone: ${selectedIdea.tone}
- Length: ${lengthGuide[storyLength]}

Write a detailed, engaging story with clear beginning, middle, and end.
Use vivid language and detailed descriptions.
IMPORTANT: The entire story MUST be written in ${langLabel}.

OUTPUT FORMAT:
# [Story Title]

[Story content...]`;

            const result = await generateWithModelFallback(
                getNextKey,
                markKeyInvalid,
                prompt,
                undefined,
                { maxRetries: 2, delayMs: 2000 }
            );

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
    }, [selectedStyle, selectedIdea, storyLength, customPrompt, language, hasValidKey, getNextKey, handleKeyError]);

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
