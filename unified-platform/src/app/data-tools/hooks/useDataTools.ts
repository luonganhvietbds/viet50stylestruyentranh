'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Scene, AppSettings, ReplaceRule } from '../types';
import { detectKeys } from '../utils/helpers';

const DEFAULT_SETTINGS: AppSettings = {
    joinSeparator: '\n\n',
};

export function useDataTools() {
    // Core data state
    const [sceneData, setSceneData] = useState<Scene[]>([]);
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [jsonRules, setJsonRules] = useState<ReplaceRule[]>([]);

    // Selected keys for extraction
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

    // Gemini context (data passed from Extract to Gemini)
    const [geminiContext, setGeminiContext] = useState<string>('');

    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const storedData = localStorage.getItem('data_tools_data');
            if (storedData) setSceneData(JSON.parse(storedData));

            const storedSettings = localStorage.getItem('data_tools_settings');
            if (storedSettings) setSettings(JSON.parse(storedSettings));

            const storedRules = localStorage.getItem('data_tools_rules');
            if (storedRules) setJsonRules(JSON.parse(storedRules));

            const storedKeys = localStorage.getItem('data_tools_selected_keys');
            if (storedKeys) setSelectedKeys(new Set(JSON.parse(storedKeys)));
        } catch (e) {
            console.warn('Failed to load from localStorage:', e);
        }
    }, []);

    // Save to localStorage when state changes
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('data_tools_data', JSON.stringify(sceneData));
        } catch (e) {
            console.warn('Failed to save data:', e);
        }
    }, [sceneData]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('data_tools_settings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }, [settings]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('data_tools_rules', JSON.stringify(jsonRules));
        } catch (e) {
            console.warn('Failed to save rules:', e);
        }
    }, [jsonRules]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('data_tools_selected_keys', JSON.stringify(Array.from(selectedKeys)));
        } catch (e) {
            console.warn('Failed to save selected keys:', e);
        }
    }, [selectedKeys]);

    // Auto-detect available keys
    const availableKeys = useMemo(() => detectKeys(sceneData), [sceneData]);

    // Import data (append)
    const importData = useCallback((newData: Scene[]) => {
        setSceneData(prev => [...prev, ...newData]);
    }, []);

    // Replace all data
    const replaceData = useCallback((newData: Scene[]) => {
        setSceneData(newData);
    }, []);

    // Toggle key selection
    const toggleKey = useCallback((key: string) => {
        setSelectedKeys(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    }, []);

    // Select all / Deselect all
    const selectAllKeys = useCallback(() => {
        setSelectedKeys(new Set(availableKeys));
    }, [availableKeys]);

    const deselectAllKeys = useCallback(() => {
        setSelectedKeys(new Set());
    }, []);

    // Get column data (all values for a specific key)
    const getColumnData = useCallback((key: string): string => {
        return sceneData
            .map(item => item[key])
            .filter(val => val !== undefined && val !== null)
            .map(val => typeof val === 'string' ? val : JSON.stringify(val))
            .join(settings.joinSeparator);
    }, [sceneData, settings.joinSeparator]);

    // Get merged data for selected keys (interleaved)
    const getMergedData = useCallback((): string => {
        if (sceneData.length === 0 || selectedKeys.size === 0) return '';
        const keys = Array.from(selectedKeys);
        return sceneData.map(item => {
            return keys
                .map(k => item[k])
                .filter(val => val !== undefined && val !== null)
                .map(val => typeof val === 'string' ? val : JSON.stringify(val))
                .join(' ');
        }).join(settings.joinSeparator);
    }, [sceneData, selectedKeys, settings.joinSeparator]);

    // Clear project
    const clearProject = useCallback(() => {
        setSceneData([]);
        setSelectedKeys(new Set());
        setGeminiContext('');

        // Clear localStorage
        const keysToRemove = [
            'data_tools_data',
            'data_tools_selected_keys',
        ];
        keysToRemove.forEach(k => localStorage.removeItem(k));
    }, []);

    // Update settings
    const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    // Add replace rule
    const addRule = useCallback((rule: Omit<ReplaceRule, 'id'>) => {
        setJsonRules(prev => [...prev, { ...rule, id: `rule_${Date.now()}` }]);
    }, []);

    // Update rule
    const updateRule = useCallback((id: string, updates: Partial<ReplaceRule>) => {
        setJsonRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    }, []);

    // Remove rule
    const removeRule = useCallback((id: string) => {
        setJsonRules(prev => prev.filter(r => r.id !== id));
    }, []);

    return {
        // Data
        sceneData,
        importData,
        replaceData,

        // Keys
        availableKeys,
        selectedKeys,
        toggleKey,
        selectAllKeys,
        deselectAllKeys,

        // Extraction
        getColumnData,
        getMergedData,

        // Settings
        settings,
        updateSettings,

        // Rules
        jsonRules,
        addRule,
        updateRule,
        removeRule,

        // Gemini
        geminiContext,
        setGeminiContext,

        // Actions
        clearProject,
    };
}

export type DataToolsHook = ReturnType<typeof useDataTools>;
