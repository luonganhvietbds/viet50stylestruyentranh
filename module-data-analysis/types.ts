
export interface Scene {
  [key: string]: any;
}

export interface GroupedData {
  [key: string]: string[];
}

export interface ParsedResult {
  data: Scene[];
  keys: string[];
}

export enum AIModelType {
  FAST = 'FAST',
  THINKING = 'THINKING'
}

export interface ReplaceRule {
  id: string;
  from: string;
  to: string;
  useRegex: boolean;
  caseSensitive: boolean;
  wholeWord?: boolean;
}

export interface AppSettings {
  joinSeparator: string;
  apiKey: string;
}

export type TabType = 'settings' | 'import' | 'extract' | 'replace_json' | 'replace_text' | 'gemini' | 'prompt_format' | 'tvc_extract';