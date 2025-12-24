'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ApiKey {
    id: string;
    key: string;
    name: string;
    usageCount: number;
    lastUsed: Date | null;
}

interface ApiKeyContextType {
    apiKeys: ApiKey[];
    activeKey: string | null;

    // Key management
    addKey: (key: string, name?: string) => void;
    removeKey: (id: string) => void;
    getNextKey: () => string | null; // Round-robin rotation

    // Modal state
    isModalOpen: boolean;
    openModal: () => void;
    closeModal: () => void;

    // Validation
    hasValidKey: boolean;
    handleKeyError: () => void; // Called when API returns auth error
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const STORAGE_KEY = 'gemini_api_keys';

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Load keys from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setApiKeys(parsed);
            } catch (e) {
                console.error('Failed to parse stored API keys', e);
            }
        }
    }, []);

    // Save keys to localStorage
    useEffect(() => {
        if (apiKeys.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(apiKeys));
        }
    }, [apiKeys]);

    // Show modal if no keys
    useEffect(() => {
        if (apiKeys.length === 0) {
            setIsModalOpen(true);
        }
    }, [apiKeys]);

    const addKey = useCallback((key: string, name?: string) => {
        const newKey: ApiKey = {
            id: Math.random().toString(36).substring(2, 9),
            key: key.trim(),
            name: name || `Key ${apiKeys.length + 1}`,
            usageCount: 0,
            lastUsed: null,
        };
        setApiKeys(prev => [...prev, newKey]);
    }, [apiKeys.length]);

    const removeKey = useCallback((id: string) => {
        setApiKeys(prev => prev.filter(k => k.id !== id));
    }, []);

    // Round-robin key rotation
    const getNextKey = useCallback((): string | null => {
        if (apiKeys.length === 0) return null;

        const key = apiKeys[currentKeyIndex];
        setCurrentKeyIndex(prev => (prev + 1) % apiKeys.length);

        // Update usage stats
        setApiKeys(prev => prev.map(k =>
            k.id === key.id
                ? { ...k, usageCount: k.usageCount + 1, lastUsed: new Date() }
                : k
        ));

        return key.key;
    }, [apiKeys, currentKeyIndex]);

    const handleKeyError = useCallback(() => {
        // Mark current key as potentially invalid and open modal
        setIsModalOpen(true);
    }, []);

    const value: ApiKeyContextType = {
        apiKeys,
        activeKey: apiKeys[currentKeyIndex]?.key || null,
        addKey,
        removeKey,
        getNextKey,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        hasValidKey: apiKeys.length > 0,
        handleKeyError,
    };

    return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>;
}

export function useApiKey() {
    const context = useContext(ApiKeyContext);
    if (context === undefined) {
        throw new Error('useApiKey must be used within an ApiKeyProvider');
    }
    return context;
}
