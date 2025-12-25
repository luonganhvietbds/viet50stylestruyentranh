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

// ==========================================
// Multi-Array Parser (Brace Stacking Algorithm)
// ==========================================

import { ReplaceRule } from '../types';

/**
 * Parse multiple JSON arrays from "dirty" text using brace stacking
 * This handles cases where JSON arrays are scattered in log files or mixed text
 */
export const safeParseMultiArrayV2 = (input: string): Record<string, unknown>[] => {
    const results: Record<string, unknown>[] = [];
    const cleaned = cleanJsonString(input);

    let i = 0;
    while (i < cleaned.length) {
        // Find start of array
        if (cleaned[i] === '[') {
            let braceCount = 1;
            let startIndex = i;
            let inString = false;
            let escapeNext = false;

            i++;

            // Find matching closing bracket
            while (i < cleaned.length && braceCount > 0) {
                const char = cleaned[i];

                if (escapeNext) {
                    escapeNext = false;
                    i++;
                    continue;
                }

                if (char === '\\' && inString) {
                    escapeNext = true;
                    i++;
                    continue;
                }

                if (char === '"' && !escapeNext) {
                    inString = !inString;
                }

                if (!inString) {
                    if (char === '[') braceCount++;
                    if (char === ']') braceCount--;
                }

                i++;
            }

            if (braceCount === 0) {
                // Found a complete array
                const arrayStr = cleaned.substring(startIndex, i);
                try {
                    const parsed = JSON.parse(arrayStr);
                    if (Array.isArray(parsed)) {
                        // Flatten: if array contains objects, add them
                        parsed.forEach(item => {
                            if (typeof item === 'object' && item !== null) {
                                results.push(item as Record<string, unknown>);
                            }
                        });
                    }
                } catch {
                    // Skip invalid JSON
                }
            }
        } else if (cleaned[i] === '{') {
            // Also try to parse single objects
            let braceCount = 1;
            let startIndex = i;
            let inString = false;
            let escapeNext = false;

            i++;

            while (i < cleaned.length && braceCount > 0) {
                const char = cleaned[i];

                if (escapeNext) {
                    escapeNext = false;
                    i++;
                    continue;
                }

                if (char === '\\' && inString) {
                    escapeNext = true;
                    i++;
                    continue;
                }

                if (char === '"' && !escapeNext) {
                    inString = !inString;
                }

                if (!inString) {
                    if (char === '{') braceCount++;
                    if (char === '}') braceCount--;
                }

                i++;
            }

            if (braceCount === 0) {
                const objStr = cleaned.substring(startIndex, i);
                try {
                    const parsed = JSON.parse(objStr);
                    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                        // Check if it has data/segments/items array inside
                        const obj = parsed as Record<string, unknown>;
                        if (Array.isArray(obj.segments)) {
                            (obj.segments as Record<string, unknown>[]).forEach(item => results.push(item));
                        } else if (Array.isArray(obj.data)) {
                            (obj.data as Record<string, unknown>[]).forEach(item => results.push(item));
                        } else if (Array.isArray(obj.items)) {
                            (obj.items as Record<string, unknown>[]).forEach(item => results.push(item));
                        } else {
                            results.push(obj);
                        }
                    }
                } catch {
                    // Skip
                }
            }
        } else {
            i++;
        }
    }

    return results;
};

// ==========================================
// Replacement Rules Pipeline
// ==========================================

/**
 * Apply a single replacement rule to text
 */
export const applyRule = (text: string, rule: ReplaceRule): string => {
    if (!rule.enabled || !rule.find) return text;

    try {
        if (rule.isRegex) {
            const regex = new RegExp(rule.find, 'g');
            return text.replace(regex, rule.replace);
        } else {
            // Literal replacement - escape special regex chars
            const escaped = rule.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escaped, 'g');
            return text.replace(regex, rule.replace);
        }
    } catch {
        return text; // Return original on error
    }
};

/**
 * Apply all replacement rules in pipeline order
 */
export const applyReplacementRules = (text: string, rules: ReplaceRule[]): string => {
    return rules.reduce((result, rule) => applyRule(result, rule), text);
};

/**
 * Apply rules with case-sensitive and whole-word options
 */
export const applyRuleAdvanced = (
    text: string,
    find: string,
    replace: string,
    options: { isRegex: boolean; caseSensitive: boolean; wholeWord: boolean }
): string => {
    if (!find) return text;

    try {
        let pattern = find;

        if (!options.isRegex) {
            // Escape special regex chars for literal search
            pattern = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        if (options.wholeWord) {
            pattern = `\\b${pattern}\\b`;
        }

        const flags = options.caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(pattern, flags);
        return text.replace(regex, replace);
    } catch {
        return text;
    }
};

// ==========================================
// Enhanced Data Analysis Functions
// ==========================================

import { FieldInfo, FieldType, DataAnalysis } from '../types';

/**
 * Detect the type of a value
 */
export const detectValueType = (value: unknown): FieldType => {
    if (value === null) return 'null';
    if (value === undefined) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'object') return 'object';
    return 'unknown';
};

/**
 * Check if a value is considered "empty"
 */
export const isEmptyValue = (value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
};

/**
 * Get a sample value (first non-empty)
 */
const getSampleValue = (data: Record<string, unknown>[], path: string): unknown => {
    for (const row of data) {
        const value = getValueByPath(row, path);
        if (!isEmptyValue(value)) {
            // Truncate long strings for sample
            if (typeof value === 'string' && value.length > 100) {
                return value.substring(0, 100) + '...';
            }
            if (Array.isArray(value)) {
                return value.slice(0, 3);
            }
            return value;
        }
    }
    return null;
};

/**
 * Get value from object by dot-notation path
 */
export const getValueByPath = (obj: Record<string, unknown>, path: string): unknown => {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
        if (current === null || current === undefined) return undefined;
        if (typeof current !== 'object') return undefined;
        current = (current as Record<string, unknown>)[key];
    }

    return current;
};

/**
 * Detect array item type (if array contains consistent types)
 */
const detectArrayItemType = (data: Record<string, unknown>[], path: string): FieldType | undefined => {
    const types = new Set<FieldType>();

    for (const row of data) {
        const arr = getValueByPath(row, path);
        if (Array.isArray(arr) && arr.length > 0) {
            arr.slice(0, 10).forEach(item => {
                types.add(detectValueType(item));
            });
        }
    }

    if (types.size === 0) return undefined;
    if (types.size === 1) return Array.from(types)[0];
    return 'mixed';
};

/**
 * Analyze a single field across all rows
 */
const analyzeField = (
    data: Record<string, unknown>[],
    key: string,
    path: string,
    depth: number
): FieldInfo => {
    let totalCount = 0;
    let emptyCount = 0;
    const types = new Set<FieldType>();

    // Scan all rows
    for (const row of data) {
        const value = getValueByPath(row, path);
        if (value !== undefined) {
            totalCount++;
            if (isEmptyValue(value)) {
                emptyCount++;
            }
            types.add(detectValueType(value));
        }
    }

    // Determine final type
    let type: FieldType = 'unknown';
    if (types.size === 1) {
        type = Array.from(types)[0];
    } else if (types.size > 1) {
        // Remove null from consideration for type
        types.delete('null');
        if (types.size === 1) {
            type = Array.from(types)[0];
        } else {
            type = 'mixed';
        }
    }

    const filledCount = totalCount - emptyCount;
    const fillRate = data.length > 0 ? Math.round((filledCount / data.length) * 100) : 0;

    const fieldInfo: FieldInfo = {
        key,
        path,
        type,
        sampleValue: getSampleValue(data, path),
        totalCount,
        emptyCount,
        filledCount,
        fillRate,
        isNested: depth > 0,
        depth,
    };

    // For arrays, detect item type
    if (type === 'array') {
        fieldInfo.arrayItemType = detectArrayItemType(data, path);
    }

    return fieldInfo;
};

/**
 * Recursively collect all field paths from data
 */
const collectFieldPaths = (
    data: Record<string, unknown>[],
    maxDepth: number = 2,
    currentPath: string = '',
    currentDepth: number = 0
): string[] => {
    if (currentDepth > maxDepth) return [];

    const paths: string[] = [];
    const keySet = new Set<string>();

    // Collect all keys at this level
    for (const row of data) {
        const obj = currentPath ? getValueByPath(row, currentPath) : row;
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
            Object.keys(obj as Record<string, unknown>).forEach(k => keySet.add(k));
        }
    }

    // Process each key
    for (const key of keySet) {
        const fullPath = currentPath ? `${currentPath}.${key}` : key;
        paths.push(fullPath);

        // Check if this field contains objects (for recursion)
        let hasNestedObject = false;
        for (const row of data.slice(0, 10)) { // Sample first 10 rows
            const value = getValueByPath(row, fullPath);
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                hasNestedObject = true;
                break;
            }
        }

        if (hasNestedObject && currentDepth < maxDepth) {
            const nestedPaths = collectFieldPaths(data, maxDepth, fullPath, currentDepth + 1);
            paths.push(...nestedPaths);
        }
    }

    return paths;
};

/**
 * Main function: Analyze complete data structure
 */
export const analyzeDataStructure = (
    data: Record<string, unknown>[],
    maxDepth: number = 2
): DataAnalysis => {
    if (!data || data.length === 0) {
        return {
            totalRows: 0,
            totalFields: 0,
            topLevelKeys: [],
            allPaths: [],
            fields: [],
            analyzedAt: Date.now(),
        };
    }

    // Get all paths
    const allPaths = collectFieldPaths(data, maxDepth);

    // Separate top-level keys
    const topLevelKeys = allPaths.filter(p => !p.includes('.'));

    // Analyze each field
    const fields: FieldInfo[] = allPaths.map(path => {
        const key = path.includes('.') ? path.split('.').pop()! : path;
        const depth = path.split('.').length - 1;
        return analyzeField(data, key, path, depth);
    });

    // Sort: top-level first, then by fill rate
    fields.sort((a, b) => {
        if (a.depth !== b.depth) return a.depth - b.depth;
        return b.fillRate - a.fillRate;
    });

    return {
        totalRows: data.length,
        totalFields: fields.length,
        topLevelKeys,
        allPaths,
        fields,
        analyzedAt: Date.now(),
    };
};

/**
 * Get field info by path
 */
export const getFieldInfo = (analysis: DataAnalysis, path: string): FieldInfo | undefined => {
    return analysis.fields.find(f => f.path === path);
};

/**
 * Format field type for display
 */
export const formatFieldType = (field: FieldInfo): string => {
    if (field.type === 'array' && field.arrayItemType) {
        return `array<${field.arrayItemType}>`;
    }
    return field.type;
};
