
import { useState, useCallback, useRef, useEffect } from 'react';
import { StyleAgent, StoryIdea, StoryLength, GeneratedStory } from '../types';
import { generateStoryIdeas, generateFullStory } from '../services/gemini';

interface UseStoryFlowProps {
  apiKey: string;
  saveToLibrary: (story: GeneratedStory) => void;
  onKeyError: () => void;
}

export function useStoryFlow({ apiKey, saveToLibrary, onKeyError }: UseStoryFlowProps) {
  // --- Refs ---
  const isMounted = useRef(true);
  const abortBatchController = useRef<AbortController | null>(null);

  // --- State ---
  const [step, setStep] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<string | null>(null);

  // --- Data State ---
  const [selectedAgent, setSelectedAgent] = useState<StyleAgent | null>(null);
  const [userDescription, setUserDescription] = useState('');
  const [numIdeas, setNumIdeas] = useState(3);
  const [generatedIdeas, setGeneratedIdeas] = useState<StoryIdea[]>([]);
  const [selectedIdeas, setSelectedIdeas] = useState<StoryIdea[]>([]);
  const [length, setLength] = useState<StoryLength>('Medium');
  const [customPrompt, setCustomPrompt] = useState('');
  const [finalStory, setFinalStory] = useState<GeneratedStory | null>(null);
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({});

  // --- Loading States ---
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [isWritingStory, setIsWritingStory] = useState(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleError = (err: any) => {
    const msg = err.message || "Unknown Error";
    // Check for specific rotation error or generic auth error
    if (msg.includes("AUTH_ERROR") || msg.includes("ALL_KEYS_EXHAUSTED")) {
      onKeyError();
    }
    if (isMounted.current) {
      setError(msg);
    }
  };

  const handleReset = useCallback(() => {
    if (abortBatchController.current) {
      abortBatchController.current.abort();
      abortBatchController.current = null;
    }
    setStep(1);
    setSelectedAgent(null);
    setGeneratedIdeas([]);
    setSelectedIdeas([]);
    setFinalStory(null);
    setError(null);
    setBatchStatus(null);
    setIsGeneratingIdeas(false);
    setIsWritingStory(false);
  }, []);

  // --- Steps ---

  const handleStyleSelect = useCallback((agent: StyleAgent) => {
    setSelectedAgent(agent);
    setStep(2);
  }, []);

  const handleSaveCustomPrompt = useCallback((prompt: string) => {
    if (!selectedAgent) return;
    setCustomPrompts(prev => ({ ...prev, [selectedAgent.id]: prompt }));
  }, [selectedAgent]);

  const handleGenerateIdeas = useCallback(async () => {
    if (!selectedAgent) return;
    
    if (!apiKey) {
      onKeyError();
      return;
    }

    setIsGeneratingIdeas(true);
    setError(null);
    try {
      const systemPromptOverride = customPrompts[selectedAgent.id];
      const ideas = await generateStoryIdeas(apiKey, selectedAgent, numIdeas, userDescription, systemPromptOverride);
      if (isMounted.current) {
        setGeneratedIdeas(ideas);
        setStep(3);
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      if (isMounted.current) setIsGeneratingIdeas(false);
    }
  }, [apiKey, selectedAgent, numIdeas, userDescription, customPrompts, onKeyError]);

  const handleIdeaToggle = useCallback((idea: StoryIdea) => {
    setSelectedIdeas(prev => {
      const exists = prev.find(i => i.id === idea.id);
      return exists ? prev.filter(i => i.id !== idea.id) : [...prev, idea];
    });
  }, []);

  const handleSelectAllIdeas = useCallback(() => {
    setSelectedIdeas(prev => prev.length === generatedIdeas.length ? [] : [...generatedIdeas]);
  }, [generatedIdeas]);

  const handleIdeaConfirm = useCallback(() => {
    if (selectedIdeas.length > 0) setStep(4);
  }, [selectedIdeas.length]);

  const handleBatchGenerate = useCallback(async () => {
    if (!selectedAgent || selectedIdeas.length === 0) return;

    if (!apiKey) {
      onKeyError();
      return;
    }

    abortBatchController.current = new AbortController();
    const { signal } = abortBatchController.current;

    setIsWritingStory(true);
    setError(null);
    const total = selectedIdeas.length;

    try {
      const systemPromptOverride = customPrompts[selectedAgent.id];
      for (let i = 0; i < total; i++) {
        if (signal.aborted) break;

        const idea = selectedIdeas[i];
        if (isMounted.current) setBatchStatus(`Đang viết kịch bản ${i + 1} / ${total}: "${idea.title}"...`);

        const story = await generateFullStory(apiKey, selectedAgent, idea, length, customPrompt, systemPromptOverride);
        
        if (signal.aborted) break;

        if (isMounted.current) {
          setFinalStory(story);
          saveToLibrary(story);
          setStep(5);
        }

        if (i < total - 1) {
          if (isMounted.current) setBatchStatus(`Đã xong kịch bản ${i + 1}. Đang nghỉ 3 giây...`);
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') handleError(err);
    } finally {
      if (isMounted.current) {
        setIsWritingStory(false);
        setBatchStatus(null);
        abortBatchController.current = null;
      }
    }
  }, [apiKey, selectedAgent, selectedIdeas, length, customPrompt, customPrompts, saveToLibrary, onKeyError]);

  const handleCancelBatch = useCallback(() => {
    if (abortBatchController.current) {
      abortBatchController.current.abort();
      if (isMounted.current) {
        setBatchStatus(null);
        setIsWritingStory(false);
      }
    }
  }, []);

  const handleBack = useCallback(() => {
    setStep(prev => Math.max(1, prev - 1));
  }, []);

  const handleLoadStory = useCallback((story: GeneratedStory, agents: StyleAgent[]) => {
    if (!selectedAgent && agents.length > 0) setSelectedAgent(agents[0]);
    setFinalStory(story);
    setStep(5);
  }, [selectedAgent]);

  const handleUpdateStory = useCallback((updatedStory: GeneratedStory) => {
    setFinalStory(updatedStory);
    saveToLibrary(updatedStory);
  }, [saveToLibrary]);

  return {
    step, error, batchStatus, selectedAgent, userDescription, numIdeas, generatedIdeas, selectedIdeas, length, customPrompt, finalStory, customPrompts, isGeneratingIdeas, isWritingStory,
    setUserDescription, setNumIdeas, setLength, setCustomPrompt,
    handleReset, handleStyleSelect, handleSaveCustomPrompt, handleGenerateIdeas, handleIdeaToggle, handleSelectAllIdeas, handleIdeaConfirm, handleBatchGenerate, handleCancelBatch, handleBack, handleLoadStory, handleUpdateStory
  };
}
