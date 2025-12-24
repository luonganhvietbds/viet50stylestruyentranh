// Data Tools Types

export type TabType = 'import' | 'extract' | 'replace_json' | 'replace_text' | 'gemini' | 'prompt_format' | 'tvc_extract' | 'settings';

export interface Scene {
    [key: string]: unknown;
}

export interface ReplaceRule {
    id: string;
    find: string;
    replace: string;
    isRegex: boolean;
    enabled: boolean;
}

export interface AppSettings {
    joinSeparator: string;
}

export interface ParsedResult {
    data: Scene[];
    keys: string[];
}

// Enhanced Field Analysis Types

export type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null' | 'mixed' | 'unknown';

export interface FieldInfo {
    key: string;           // field name (e.g., "voiceOver")
    path: string;          // full path for nested (e.g., "metadata.author")
    type: FieldType;       // detected type
    arrayItemType?: FieldType; // if array, what type of items
    sampleValue: unknown;  // first non-null value found
    totalCount: number;    // how many rows have this field
    emptyCount: number;    // null/undefined/empty string/"" count
    filledCount: number;   // rows with actual data
    fillRate: number;      // percentage filled (0-100)
    isNested: boolean;     // whether this is a nested field
    depth: number;         // nesting depth (0 = top level)
    children?: FieldInfo[]; // nested fields for objects
}

export interface DataAnalysis {
    totalRows: number;
    totalFields: number;
    topLevelKeys: string[];
    allPaths: string[];    // all accessible paths including nested
    fields: FieldInfo[];
    analyzedAt: number;    // timestamp
}
