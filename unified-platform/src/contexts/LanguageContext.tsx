'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    OutputLanguage,
    LanguageConfig,
    DEFAULT_LANGUAGE,
    LANGUAGE_STORAGE_KEY
} from '@/types/language';

interface LanguageContextType {
    // Current output language
    language: OutputLanguage;

    // Set output language
    setLanguage: (lang: OutputLanguage) => void;

    // Get full language config (with forced English for image/video)
    getLanguageConfig: () => LanguageConfig;

    // Check if current language is Vietnamese
    isVietnamese: boolean;

    // Check if current language is English
    isEnglish: boolean;

    // Check if current language is Korean
    isKorean: boolean;

    // Check if current language is Japanese
    isJapanese: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    const [language, setLanguageState] = useState<OutputLanguage>(DEFAULT_LANGUAGE);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (stored === 'en' || stored === 'vi' || stored === 'ko' || stored === 'ja') {
                setLanguageState(stored);
            }
        } catch (error) {
            console.warn('Failed to load language preference:', error);
        }
        setIsInitialized(true);
    }, []);

    // Save to localStorage when language changes
    const setLanguage = useCallback((lang: OutputLanguage) => {
        setLanguageState(lang);
        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        } catch (error) {
            console.warn('Failed to save language preference:', error);
        }
    }, []);

    // Get full language config
    const getLanguageConfig = useCallback((): LanguageConfig => {
        return {
            outputLanguage: language,
            imagePromptLanguage: 'en', // Always English for AI image generation
            videoPromptLanguage: 'en', // Always English for AI video generation
        };
    }, [language]);

    const value: LanguageContextType = {
        language,
        setLanguage,
        getLanguageConfig,
        isVietnamese: language === 'vi',
        isEnglish: language === 'en',
        isKorean: language === 'ko',
        isJapanese: language === 'ja',
    };

    // Prevent hydration mismatch by not rendering until initialized
    if (!isInitialized) {
        return null;
    }

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage(): LanguageContextType {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// Export for conditional usage (doesn't throw)
export function useLanguageOptional(): LanguageContextType | null {
    const context = useContext(LanguageContext);
    return context ?? null;
}
