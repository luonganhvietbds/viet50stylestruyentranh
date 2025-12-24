
export type StoryStyleId = 
  | 'vietnamese-folklore'
  | 'norse'
  | 'egyptian'
  | 'cyberpunk-noir'
  | 'edo-samurai'
  | 'arabian-nights'
  | 'steampunk'
  | 'space-opera'
  | 'shonen-anime'
  | 'toy-story'
  | 'miniature-diorama'
  | 'stop-motion-clay'
  | 'borrowers-tiny'
  | 'plastic-action'
  | 'shrunk-kids'
  | 'micro-science';

export interface StyleAgent {
  id: StoryStyleId;
  name: string;
  tagline: string;
  description: string;
  iconName: string; // Mapping to Lucide icon
  colorClass: string; // Tailwind color class
  systemPrompt: string;
  template: string; // Default input template for this style
}

export interface StoryIdea {
  id: string;
  title: string;
  hook: string;
  summary: string;
  conflict: string;
  tone: string;
}

export type StoryLength = 'Short' | 'Medium' | 'Long' | 'Epic';

export interface StoryConfig {
  userDescription: string;
  numIdeas: number;
  selectedIdea: StoryIdea | null;
  length: StoryLength;
  customPrompt?: string; // Overrides or appends to system prompt
}

export interface GeneratedStory {
  id: string; // UUID
  createdAt: number; // Timestamp
  title: string;
  content: string; // Markdown content
  summary: string;
  wordCount: number;
  
  // Media Assets
  coverImage?: string; // Base64 image data
  coverVisualDescription?: string; // AI generated prompt for the cover image
}

// --- USER TYPES ---
export type UserRole = 'free' | 'silver' | 'gold' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  status: 'active' | 'banned';
  createdAt: string; // ISO Date string
  lastLoginAt?: string;
}

export interface TransactionRequest {
  id: string;
  uid: string;
  email: string;
  plan: 'silver' | 'gold';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
