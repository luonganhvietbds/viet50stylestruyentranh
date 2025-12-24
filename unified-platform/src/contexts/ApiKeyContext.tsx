'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface ApiKey {
    id: string;
    key: string;
    name: string;
    usageCount: number;
    lastUsed: Date | null;
    isInvalid?: boolean;           // NEW: Track if key is known to be invalid
    lastError?: string;            // NEW: Last error message for this key
    invalidatedAt?: Date | null;   // NEW: When the key was invalidated
}

interface ApiKeyContextType {
    apiKeys: ApiKey[];
    activeKey: string | null;
    validKeyCount: number;         // NEW: Count of valid (non-invalid) keys

    // Key management
    addKey: (key: string, name?: string) => void;
    removeKey: (id: string) => void;
    getNextKey: () => string | null;          // Round-robin rotation (skips invalid keys)
    markKeyInvalid: (key: string, error?: string) => void;  // NEW: Mark a key as invalid
    resetInvalidKeys: () => void;             // NEW: Reset all invalid flags

    // Modal state
    isModalOpen: boolean;
    openModal: () => void;
    closeModal: () => void;

    // Validation
    hasValidKey: boolean;
    handleKeyError: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const STORAGE_KEY = 'gemini_api_keys';

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const currentKeyIndexRef = useRef(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Calculate valid key count
    const validKeyCount = apiKeys.filter(k => !k.isInvalid).length;

    // Load keys from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Reset invalid flags on load (give keys another chance)
                const resetKeys = parsed.map((k: ApiKey) => ({
                    ...k,
                    isInvalid: false,
                    lastError: undefined,
                    invalidatedAt: null
                }));
                setApiKeys(resetKeys);
            } catch (e) {
                console.error('Failed to parse stored API keys', e);
            }
        }
    }, []);

    // Save keys to localStorage (without invalid status - persisted fresh each session)
    useEffect(() => {
        if (apiKeys.length > 0) {
            // Save without volatile fields
            const toSave = apiKeys.map(k => ({
                id: k.id,
                key: k.key,
                name: k.name,
                usageCount: k.usageCount,
                lastUsed: k.lastUsed
            }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        }
    }, [apiKeys]);

    // Show modal if no valid keys
    useEffect(() => {
        if (validKeyCount === 0 && apiKeys.length > 0) {
            // All keys invalid, show modal
            setIsModalOpen(true);
        } else if (apiKeys.length === 0) {
            setIsModalOpen(true);
        }
    }, [apiKeys.length, validKeyCount]);

    const addKey = useCallback((key: string, name?: string) => {
        const trimmedKey = key.trim();

        // Check if key already exists
        const exists = apiKeys.some(k => k.key === trimmedKey);
        if (exists) {
            console.warn('API key already exists');
            return;
        }

        const newKey: ApiKey = {
            id: Math.random().toString(36).substring(2, 9),
            key: trimmedKey,
            name: name || `Key ${apiKeys.length + 1}`,
            usageCount: 0,
            lastUsed: null,
            isInvalid: false,
        };
        setApiKeys(prev => [...prev, newKey]);
    }, [apiKeys]);

    const removeKey = useCallback((id: string) => {
        setApiKeys(prev => prev.filter(k => k.id !== id));
    }, []);

    // Mark a key as invalid (called when API returns error)
    const markKeyInvalid = useCallback((key: string, error?: string) => {
        setApiKeys(prev => prev.map(k =>
            k.key === key
                ? {
                    ...k,
                    isInvalid: true,
                    lastError: error || 'Key invalid or expired',
                    invalidatedAt: new Date()
                }
                : k
        ));
        console.warn(`API key marked as invalid: ${key.substring(0, 10)}...`, error);
    }, []);

    // Reset all invalid keys (give them another chance)
    const resetInvalidKeys = useCallback(() => {
        setApiKeys(prev => prev.map(k => ({
            ...k,
            isInvalid: false,
            lastError: undefined,
            invalidatedAt: null
        })));
    }, []);

    // Round-robin key rotation, skipping invalid keys
    const getNextKey = useCallback((): string | null => {
        const validKeys = apiKeys.filter(k => !k.isInvalid);

        if (validKeys.length === 0) {
            // No valid keys, try all keys (maybe they recovered)
            if (apiKeys.length > 0) {
                console.warn('No valid keys, attempting with first available key');
                return apiKeys[0].key;
            }
            return null;
        }

        // Get next valid key using round-robin
        const keyIndex = currentKeyIndexRef.current % validKeys.length;
        const key = validKeys[keyIndex];
        currentKeyIndexRef.current = (currentKeyIndexRef.current + 1) % validKeys.length;

        // Update usage stats
        setApiKeys(prev => prev.map(k =>
            k.id === key.id
                ? { ...k, usageCount: k.usageCount + 1, lastUsed: new Date() }
                : k
        ));

        return key.key;
    }, [apiKeys]);

    const handleKeyError = useCallback(() => {
        // Show modal when all keys fail
        setIsModalOpen(true);
    }, []);

    const value: ApiKeyContextType = {
        apiKeys,
        activeKey: apiKeys.find(k => !k.isInvalid)?.key || null,
        validKeyCount,
        addKey,
        removeKey,
        getNextKey,
        markKeyInvalid,
        resetInvalidKeys,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        hasValidKey: validKeyCount > 0,
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
