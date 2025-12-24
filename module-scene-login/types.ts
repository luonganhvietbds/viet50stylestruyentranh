
export interface CharacterBible {
  characters: any[];
  [key: string]: any;
}

export interface PromptSnippet {
  [key: string]: any;
}

export interface Scene {
  id?: string;
  scene: string | number; // Matches "001"
  segment_id: string; // Matches "VS_001"
  description: string;
  context?: string;
  subject?: string[]; // Enforce array in V2
  motion?: string;
  
  // Visuals
  camera: string;
  visualEffect: string;
  imagePrompt: string;
  videoPrompt: string;
  
  // Audio
  audioEffect: string;
  voiceOver?: string;
  
  // Feasibility
  feasibilityLevel: string;
  feasibilityNote?: string;

  // Metadata
  genre: string;
  style: string;
  theme: string;
  tone_mood: string;
  
  // Fallback
  [key: string]: any;
}

export interface ScriptJob {
  id: number;
  voiceData: string;
  styleId: string;
  useThinkingModel: boolean;

  // V2 Pipeline Status
  status: 'IDLE' | 'QUEUED' | 'PROCESSING' | 'ERROR' | 'COMPLETED';
  currentStep: 'CHARACTER' | 'SNIPPET' | 'SCENE' | 'DONE';

  characterBible?: CharacterBible;
  characterSnippet?: PromptSnippet[];
  scenes: Scene[];

  logs: string[];
  error?: string;
  createdAt: number;
}

export interface StyleConfig {
  id: string;
  label: string;
  description: string;

  // V2 Pipeline Keys
  characterSystem: string;
  snippetSystem: string;
  sceneSystem: string;

  dialogStyle: string;
  cinematicStyle: string;

  sceneBatchSize: number;
  sceneDelayMs: number;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  // Updated Role System
  role: 'free' | 'silver' | 'gold' | 'admin';
  createdAt?: number | string;
  updatedAt?: number | string;
}

// --- ADMIN DASHBOARD TYPES ---

export interface LogEntry {
  id: string;
  type: 'API' | 'AUTH' | 'ERROR' | 'BILLING' | 'SYSTEM';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  userId?: string;
  timestamp: number;
  details?: any;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  allowSignups: boolean;
  featureFlags: {
    thinkingMode: boolean;
    betaFeatures: boolean;
  };
}

export interface DashboardStats {
  totalUsers: number;
  activeJobs: number;
  revenue: number; // Monthly revenue
  serverHealth: number; // 0-100%
  dailySignups: number[];
  revenueTrend: number[];
}

export interface Transaction {
  id?: string;
  userId: string;
  userEmail: string;
  plan: 'silver' | 'gold';
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: any;
  updatedAt?: any;
}
