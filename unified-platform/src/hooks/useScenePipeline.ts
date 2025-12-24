'use client';

import { useState, useEffect, useCallback } from 'react';
import { StyleConfig, CharacterBible, PromptSnippet, Scene, PipelineStep, PipelineStatus, ScenePipelineJob } from '@/types/styles';
import { getAllStyleConfigs } from '@/services/stylesService';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageLabel } from '@/types/language';
import { generateWithRetry } from '@/lib/gemini';

interface UseScenePipelineReturn {
    // State
    styles: StyleConfig[];
    loadingStyles: boolean;
    selectedStyle: StyleConfig | null;
    voiceInput: string;
    useThinkingModel: boolean;
    currentJob: ScenePipelineJob | null;
    jobHistory: ScenePipelineJob[];
    error: string | null;

    // Actions
    selectStyle: (styleId: string) => void;
    setVoiceInput: (input: string) => void;
    setUseThinkingModel: (use: boolean) => void;
    startPipeline: () => Promise<void>;
    clearError: () => void;
    clearHistory: () => void;
    resetJob: () => void;
}

export function useScenePipeline(): UseScenePipelineReturn {
    const { getNextKey, hasValidKey, handleKeyError, markKeyInvalid } = useApiKey();
    const { language } = useLanguage();

    // Core state
    const [styles, setStyles] = useState<StyleConfig[]>([]);
    const [loadingStyles, setLoadingStyles] = useState(true);
    const [selectedStyle, setSelectedStyle] = useState<StyleConfig | null>(null);
    const [voiceInput, setVoiceInput] = useState('');
    const [useThinkingModel, setUseThinkingModel] = useState(false);
    const [currentJob, setCurrentJob] = useState<ScenePipelineJob | null>(null);
    const [jobHistory, setJobHistory] = useState<ScenePipelineJob[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Fetch styles from Firestore
    useEffect(() => {
        const fetchStyles = async () => {
            setLoadingStyles(true);
            try {
                const fetchedStyles = await getAllStyleConfigs();
                setStyles(fetchedStyles);
                if (fetchedStyles.length > 0) {
                    setSelectedStyle(fetchedStyles[0]);
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

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Clear history
    const clearHistory = useCallback(() => {
        setJobHistory([]);
    }, []);

    // Reset current job
    const resetJob = useCallback(() => {
        setCurrentJob(null);
        setVoiceInput('');
        setError(null);
    }, []);

    // Add log to current job
    const addLog = useCallback((message: string) => {
        setCurrentJob(prev => prev ? {
            ...prev,
            logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${message}`]
        } : null);
    }, []);

    // Update job step
    const updateJobStep = useCallback((step: PipelineStep, status: PipelineStatus) => {
        setCurrentJob(prev => prev ? {
            ...prev,
            currentStep: step,
            status
        } : null);
    }, []);

    // Clean JSON string by removing bad control characters
    const cleanJsonString = (str: string): string => {
        // Remove control characters except whitespace (tab, newline, carriage return)
        return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    };

    // Safe JSON parse with cleanup
    const safeJsonParse = (str: string): unknown | null => {
        try {
            const cleaned = cleanJsonString(str);
            return JSON.parse(cleaned);
        } catch {
            return null;
        }
    };

    // Parse voice segments from input (handles multiple formats)
    const parseVoiceSegments = (input: string): string[] => {
        const trimmedInput = input.trim();

        // Check if input looks like JSON
        const looksLikeJson = trimmedInput.startsWith('{') || trimmedInput.startsWith('[');

        if (looksLikeJson) {
            const parsed = safeJsonParse(trimmedInput);

            if (parsed) {
                // Handle { segments: [...] } or { data: [...] } structure
                if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                    const obj = parsed as Record<string, unknown>;
                    const segmentsArray = obj.segments || obj.data || obj.items || obj.voiceSegments;

                    if (Array.isArray(segmentsArray)) {
                        return segmentsArray
                            .map((item: unknown) => {
                                if (typeof item === 'string') return item;
                                if (typeof item === 'object' && item !== null) {
                                    const seg = item as Record<string, unknown>;
                                    return String(seg.text || seg.content || seg.voice || '');
                                }
                                return '';
                            })
                            .filter(text => text.trim().length > 0);
                    }
                }

                // Handle direct array: [{ text: "..." }, ...]
                if (Array.isArray(parsed)) {
                    return parsed
                        .map((item: unknown) => {
                            if (typeof item === 'string') return item;
                            if (typeof item === 'object' && item !== null) {
                                const seg = item as Record<string, unknown>;
                                return String(seg.text || seg.content || seg.voice || '');
                            }
                            return '';
                        })
                        .filter(text => text.trim().length > 0);
                }
            }

            // JSON parsing failed - don't fallback to line split for JSON input
            console.warn('Failed to parse JSON input, attempting text extraction...');
            // Try to extract text from malformed JSON using regex
            const textMatches = trimmedInput.match(/"text"\s*:\s*"([^"]+)"/g);
            if (textMatches && textMatches.length > 0) {
                return textMatches
                    .map(match => {
                        const valueMatch = match.match(/"text"\s*:\s*"([^"]+)"/);
                        return valueMatch ? valueMatch[1] : '';
                    })
                    .filter(Boolean);
            }
        }

        // Plain text input - split by newlines
        return trimmedInput
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    };

    // Start 3-step pipeline
    const startPipeline = useCallback(async () => {
        if (!selectedStyle || !voiceInput.trim() || !hasValidKey) {
            setError('Vui lòng chọn style và nhập voice data');
            return;
        }

        // Initialize job
        const newJob: ScenePipelineJob = {
            id: `job_${Date.now()}`,
            voiceData: voiceInput,
            styleId: selectedStyle.id,
            useThinkingModel,
            status: 'PROCESSING',
            currentStep: 'CHARACTER',
            scenes: [],
            logs: [],
            createdAt: new Date(),
        };

        setCurrentJob(newJob);
        addLog(`Starting pipeline with style: ${selectedStyle.label}`);

        const segments = parseVoiceSegments(voiceInput);
        addLog(`Parsed ${segments.length} voice segments`);

        try {
            // ========================================
            // STEP 1: Character Bible
            // ========================================
            updateJobStep('CHARACTER', 'PROCESSING');
            addLog('Step 1: Generating Character Bible...');

            const characterPrompt = `${selectedStyle.characterSystem}

Voice segments:
${segments.map((seg, i) => `[VS_${String(i + 1).padStart(3, '0')}] ${seg}`).join('\n')}

Generate the Character Bible JSON.`;

            const characterResult = await generateWithRetry(
                getNextKey,
                markKeyInvalid,
                characterPrompt,
                undefined,
                { maxRetries: 3, delayMs: 1500 }
            );

            if (!characterResult) {
                throw new Error('No response from Character Bible generation');
            }

            // Parse character bible
            const charJsonMatch = characterResult.match(/\{[\s\S]*"characters"[\s\S]*\}/);
            let characterBible: CharacterBible | undefined;

            if (charJsonMatch) {
                const cleanedJson = cleanJsonString(charJsonMatch[0]);
                characterBible = JSON.parse(cleanedJson) as CharacterBible;
                addLog(`✓ Generated ${characterBible.characters?.length || 0} characters`);
            } else {
                addLog('⚠ Could not parse Character Bible, continuing...');
            }

            setCurrentJob(prev => prev ? { ...prev, characterBible } : null);

            // ========================================
            // STEP 2: Prompt Snippets
            // ========================================
            updateJobStep('SNIPPET', 'PROCESSING');
            addLog('Step 2: Generating Prompt Snippets...');

            const snippetPrompt = `${selectedStyle.snippetSystem}

Character Bible:
${JSON.stringify(characterBible || { characters: [] }, null, 2)}

Generate the promptSnippet array for all characters.`;

            const snippetResult = await generateWithRetry(
                getNextKey,
                markKeyInvalid,
                snippetPrompt,
                undefined,
                { maxRetries: 3, delayMs: 1500 }
            );

            if (!snippetResult) {
                throw new Error('No response from Snippet generation');
            }

            // Parse snippets
            const snippetJsonMatch = snippetResult.match(/\[[\s\S]*\]/);
            let characterSnippets: PromptSnippet[] = [];

            if (snippetJsonMatch) {
                const cleanedJson = cleanJsonString(snippetJsonMatch[0]);
                characterSnippets = JSON.parse(cleanedJson) as PromptSnippet[];
                addLog(`✓ Generated ${characterSnippets.length} prompt snippets`);
            } else {
                addLog('⚠ Could not parse Snippets, continuing...');
            }

            setCurrentJob(prev => prev ? { ...prev, characterSnippets } : null);

            // ========================================
            // STEP 3: Scene Generation
            // ========================================
            updateJobStep('SCENE', 'PROCESSING');
            addLog('Step 3: Generating Scenes...');

            const allScenes: Scene[] = [];
            const batchSize = selectedStyle.sceneBatchSize || 5;

            // Process in batches
            for (let i = 0; i < segments.length; i += batchSize) {
                const batch = segments.slice(i, i + batchSize);
                addLog(`Processing scenes ${i + 1} to ${Math.min(i + batchSize, segments.length)}...`);

                const apiKey3 = getNextKey();
                if (!apiKey3) throw new Error('No API key available');

                const scenePrompt = `${selectedStyle.sceneSystem}

# LANGUAGE RULES FOR OUTPUT
- **imagePrompt**: MUST be in English (for AI image generation)
- **videoPrompt**: MUST be in English (for AI video generation)  
- **voiceOver**: MUST be in ${getLanguageLabel(language)} (user's selected language)
- All other fields: Keep as-is based on style template

Character Snippets:
${JSON.stringify(characterSnippets, null, 2)}

Voice segments to process:
${batch.map((seg, idx) => `[VS_${String(i + idx + 1).padStart(3, '0')}] ${seg}`).join('\n')}

Generate scene objects for each segment.`;

                const sceneResult = await generateWithRetry(
                    getNextKey,
                    markKeyInvalid,
                    scenePrompt,
                    undefined,
                    { maxRetries: 3, delayMs: 2000 }
                );

                if (sceneResult) {
                    const sceneJsonMatch = sceneResult.match(/\[[\s\S]*\]/);
                    if (sceneJsonMatch) {
                        const cleanedJson = cleanJsonString(sceneJsonMatch[0]);
                        const batchScenes = JSON.parse(cleanedJson) as Scene[];
                        allScenes.push(...batchScenes);
                        addLog(`✓ Generated ${batchScenes.length} scenes`);
                    }
                }

                // Delay between batches
                if (i + batchSize < segments.length) {
                    await new Promise(resolve => setTimeout(resolve, selectedStyle.sceneDelayMs || 2000));
                }
            }

            // ========================================
            // COMPLETE
            // ========================================
            const completedJob: ScenePipelineJob = {
                ...newJob,
                characterBible,
                characterSnippets,
                scenes: allScenes,
                status: 'COMPLETED',
                currentStep: 'DONE',
                completedAt: new Date(),
                logs: currentJob?.logs || newJob.logs,
            };

            completedJob.logs.push(`✅ Pipeline complete! Generated ${allScenes.length} scenes.`);

            setCurrentJob(completedJob);
            setJobHistory(prev => [completedJob, ...prev]);
            addLog(`✅ Pipeline complete! Generated ${allScenes.length} scenes.`);

        } catch (err) {
            console.error('Pipeline error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Pipeline failed';

            if (errorMessage.includes('API') || errorMessage.includes('key') || errorMessage.includes('auth')) {
                handleKeyError();
            }

            addLog(`❌ Error: ${errorMessage}`);
            updateJobStep(currentJob?.currentStep || 'CHARACTER', 'ERROR');

            setCurrentJob(prev => prev ? {
                ...prev,
                status: 'ERROR',
                error: errorMessage
            } : null);

            setError(errorMessage);
        }
    }, [selectedStyle, voiceInput, useThinkingModel, hasValidKey, getNextKey, handleKeyError, addLog, updateJobStep, currentJob?.logs, currentJob?.currentStep]);

    return {
        // State
        styles,
        loadingStyles,
        selectedStyle,
        voiceInput,
        useThinkingModel,
        currentJob,
        jobHistory,
        error,

        // Actions
        selectStyle,
        setVoiceInput,
        setUseThinkingModel,
        startPipeline,
        clearError,
        clearHistory,
        resetJob,
    };
}
