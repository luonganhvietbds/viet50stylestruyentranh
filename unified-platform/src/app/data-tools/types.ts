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
