// Data Tools Utilities

/**
 * Detect all unique keys from an array of objects
 */
export const detectKeys = (data: Record<string, unknown>[]): string[] => {
    const keySet = new Set<string>();
    data.forEach(item => {
        Object.keys(item).forEach(key => keySet.add(key));
    });
    return Array.from(keySet);
};

/**
 * Custom hook for persistent state in localStorage
 */
export function usePersistentState<T>(
    key: string,
    defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = React.useState<T>(() => {
        if (typeof window === 'undefined') return defaultValue;
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch {
            return defaultValue;
        }
    });

    React.useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }, [key, state]);

    return [state, setState];
}

import React from 'react';

/**
 * Export data to CSV file
 */
export const exportToCsv = (data: Record<string, unknown>[], selectedKeys: string[]) => {
    if (data.length === 0 || selectedKeys.length === 0) return;

    const headers = selectedKeys.join(',');
    const rows = data.map(row =>
        selectedKeys.map(key => {
            const val = row[key];
            const str = typeof val === 'string' ? val : JSON.stringify(val) || '';
            // Escape quotes and wrap in quotes
            return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    saveTextFile(csv, 'export.csv');
};

/**
 * Save text content as a file
 */
export const saveTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
};

/**
 * Clean JSON string by removing bad control characters
 */
export const cleanJsonString = (str: string): string => {
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
};

/**
 * Safe JSON parse with cleanup
 */
export const safeJsonParse = <T = unknown>(str: string): T | null => {
    try {
        const cleaned = cleanJsonString(str);
        return JSON.parse(cleaned) as T;
    } catch {
        return null;
    }
};
