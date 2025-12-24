'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { OutputLanguage, SUPPORTED_LANGUAGES } from '@/types/language';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
    // Optional custom class
    className?: string;
    // Show flags
    showFlags?: boolean;
    // Compact mode (just flags)
    compact?: boolean;
}

export function LanguageToggle({
    className = '',
    showFlags = true,
    compact = false
}: LanguageToggleProps) {
    const { language, setLanguage } = useLanguage();

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {!compact && (
                <Globe className="w-4 h-4 text-gray-400" />
            )}
            <div className="flex rounded-lg overflow-hidden border border-gray-600">
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`px-3 py-1.5 text-sm font-medium transition-all ${language === lang.code
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                        title={`${lang.nativeLabel} (${lang.label})`}
                    >
                        {showFlags && <span className="mr-1">{lang.flag}</span>}
                        {compact ? '' : lang.code.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Minimal version for tight spaces
export function LanguageToggleMinimal() {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'vi' ? 'en' : 'vi');
    };

    const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language);

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md border border-gray-600 transition-all"
            title="Click to toggle language / Nhấn để đổi ngôn ngữ"
        >
            <Globe className="w-3 h-3" />
            <span>{currentLang?.flag}</span>
            <span>{currentLang?.code.toUpperCase()}</span>
        </button>
    );
}

// Badge showing current language (read-only)
export function LanguageBadge() {
    const { language } = useLanguage();
    const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language);

    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-700 text-gray-300 rounded">
            {currentLang?.flag} {currentLang?.nativeLabel}
        </span>
    );
}

export default LanguageToggle;
