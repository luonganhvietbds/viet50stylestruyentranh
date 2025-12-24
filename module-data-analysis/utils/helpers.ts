import { useState, useEffect } from 'react';
import FileSaver from 'file-saver';
import { Scene, ReplaceRule } from '../types';

// --- Storage Hook ---
export function usePersistentState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(error);
    }
  }, [key, state]);

  return [state, setState];
}

// --- Parsing Logic ---
export const safeParseMultiArrayV2 = (input: string): Scene[] => {
  const trimmed = input.trim();
  if (!trimmed) return [];

  // 1. Try simple parse first
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
    // If object, wrap in array
    if (typeof parsed === 'object' && parsed !== null) return [parsed];
  } catch (e) {
    // Continue to regex extraction
  }

  // 2. Regex Extraction for multiple arrays: [...] ... [...]
  const results: Scene[] = [];
  let braceStack = 0;
  let startIndex = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (inString) {
      if (char === '\\' && !escape) {
        escape = true;
      } else if (char === '"' && !escape) {
        inString = false;
      } else {
        escape = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === '[') {
      if (braceStack === 0) startIndex = i;
      braceStack++;
    } else if (char === ']') {
      braceStack--;
      if (braceStack === 0 && startIndex !== -1) {
        const jsonChunk = trimmed.substring(startIndex, i + 1);
        try {
          const parsed = JSON.parse(jsonChunk);
          if (Array.isArray(parsed)) {
            results.push(...parsed);
          }
        } catch (e) {
          console.warn("Failed to parse chunk:", jsonChunk.substring(0, 50) + "...");
        }
        startIndex = -1;
      }
    }
  }

  if (results.length === 0) {
    throw new Error("No valid JSON arrays found in input.");
  }

  return results;
};

export const detectKeys = (data: Scene[]): string[] => {
  const keys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(k => keys.add(k));
  });
  return Array.from(keys).sort();
};

// --- Regex & Replacement ---
export const applyReplacementRules = (text: string, rules: ReplaceRule[]): string => {
  let result = text;
  
  for (const rule of rules) {
    if (!rule.from) continue;

    try {
      let pattern: RegExp;
      let flags = 'g';
      if (!rule.caseSensitive) flags += 'i';

      if (rule.useRegex) {
        pattern = new RegExp(rule.from, flags);
      } else {
        // Escape regex special characters for literal search
        const escaped = rule.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (rule.wholeWord) {
          pattern = new RegExp(`\\b${escaped}\\b`, flags);
        } else {
          pattern = new RegExp(escaped, flags);
        }
      }
      result = result.replace(pattern, rule.to);
    } catch (e) {
      console.warn(`Invalid regex rule: ${rule.from}`, e);
    }
  }
  return result;
};

// --- Export ---
export const exportToCsv = (data: Scene[], keys: string[]) => {
  if (!data.length || !keys.length) return;

  // Header
  const header = ['#', ...keys].join(',');
  
  // Rows
  const rows = data.map((item, index) => {
    const rowData = keys.map(key => {
      let val = item[key];
      if (val === undefined || val === null) return '';
      // Escape double quotes by doubling them
      const stringVal = String(val).replace(/"/g, '""');
      // Wrap in quotes
      return `"${stringVal}"`;
    });
    return [`${index + 1}`, ...rowData].join(',');
  });

  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  FileSaver.saveAs(blob, 'export_data.csv');
};

export const saveTextFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  FileSaver.saveAs(blob, filename);
};

// --- Nested JSON Utilities ---
export const flattenObject = (obj: any, prefix = '', res: any = {}) => {
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      flattenObject(val, newKey, res);
    } else {
      res[newKey] = val;
    }
  }
  return res;
};

export const getDeepKeys = (data: Scene[]): string[] => {
  if (!data || data.length === 0) return [];
  const keys = new Set<string>();
  // Sample first 10 items to find keys
  data.slice(0, 10).forEach(item => {
    const flat = flattenObject(item);
    Object.keys(flat).forEach(k => keys.add(k));
  });
  return Array.from(keys).sort();
};

export const getDeepValue = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};