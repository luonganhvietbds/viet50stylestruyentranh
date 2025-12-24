
import { create } from 'zustand';
import { ScriptJob, StyleConfig, AppUser } from './types';
import { STYLES } from './constants';

interface AppState {
  styles: StyleConfig[];
  selectedStyleId: string;
  scriptJobs: ScriptJob[];
  isProcessingQueue: boolean;
  
  // API Key State
  apiKeys: string[];
  activeKeyIndex: number;
  isApiKeyModalOpen: boolean;
  
  // Auth State
  user: AppUser | null;
  isLoadingAuth: boolean;
  isAuthModalOpen: boolean;
  isPricingModalOpen: boolean;
  
  // Admin State
  isAdminView: boolean;
  
  // Verification State
  isVerificationPending: boolean;
  verificationEmail: string | null;

  setStyles: (data: StyleConfig[]) => void;
  setSelectedStyle: (id: string) => void;
  
  addJob: (voiceData: string, useThinkingModel: boolean) => void;
  updateJob: (id: number, data: Partial<ScriptJob>) => void;
  addLog: (id: number, msg: string) => void;
  setProcessingQueue: (isProcessing: boolean) => void;
  deleteJob: (id: number) => void;
  
  getSelectedStyle: () => StyleConfig | undefined;

  // API Key Actions
  setApiKeys: (keys: string[]) => void;
  getApiKey: () => string;
  rotateApiKey: () => void;
  setApiKeyModalOpen: (isOpen: boolean) => void;

  // Auth Actions
  setUser: (user: AppUser | null) => void;
  setLoadingAuth: (isLoading: boolean) => void;
  setAuthModalOpen: (isOpen: boolean) => void;
  setPricingModalOpen: (isOpen: boolean) => void;
  setVerificationPending: (pending: boolean, email?: string | null) => void;
  
  // Admin Actions
  setAdminView: (isOpen: boolean) => void;
}

// Helper to initialize keys from local storage (handles migration from single key to array)
const loadKeysFromStorage = (): string[] => {
  const storedKeys = localStorage.getItem('gemini_api_keys');
  if (storedKeys) {
    try {
      return JSON.parse(storedKeys);
    } catch (e) {
      return [];
    }
  }
  
  // Backward compatibility: Migration from single key
  const singleKey = localStorage.getItem('gemini_api_key');
  if (singleKey) {
    const keys = [singleKey];
    localStorage.setItem('gemini_api_keys', JSON.stringify(keys));
    localStorage.removeItem('gemini_api_key'); // Cleanup
    return keys;
  }

  return [];
};

export const useAppStore = create<AppState>((set, get) => ({
  styles: STYLES,
  selectedStyleId: STYLES[0].id,
  scriptJobs: [],
  isProcessingQueue: false,
  
  // Initialize from localStorage
  apiKeys: loadKeysFromStorage(),
  activeKeyIndex: 0,
  isApiKeyModalOpen: false,
  
  user: null,
  isLoadingAuth: true, // Default to loading
  isAuthModalOpen: false,
  isPricingModalOpen: false,
  
  isAdminView: false,
  
  isVerificationPending: false,
  verificationEmail: null,

  setStyles: (data) => set({ styles: data }),
  setSelectedStyle: (id) => set({ selectedStyleId: id }),

  getSelectedStyle: () => {
    const id = get().selectedStyleId;
    return get().styles.find(s => s.id === id);
  },

  setApiKeys: (keys) => {
    localStorage.setItem('gemini_api_keys', JSON.stringify(keys));
    set({ apiKeys: keys, activeKeyIndex: 0, isApiKeyModalOpen: false });
  },

  getApiKey: () => {
    const { apiKeys, activeKeyIndex } = get();
    if (apiKeys.length === 0) return '';
    // Ensure index is safe
    const safeIndex = activeKeyIndex % apiKeys.length;
    return apiKeys[safeIndex];
  },

  rotateApiKey: () => {
    const { apiKeys, activeKeyIndex } = get();
    if (apiKeys.length <= 1) return; // No rotation needed
    
    const nextIndex = (activeKeyIndex + 1) % apiKeys.length;
    console.log(`🔄 Rotating API Key: [${activeKeyIndex}] -> [${nextIndex}] (Total: ${apiKeys.length})`);
    set({ activeKeyIndex: nextIndex });
  },

  setApiKeyModalOpen: (isOpen) => set({ isApiKeyModalOpen: isOpen }),

  addJob: (voiceData, useThinkingModel) => {
    const job: ScriptJob = {
      id: Date.now(),
      voiceData,
      styleId: get().selectedStyleId,
      useThinkingModel,
      status: 'IDLE',
      currentStep: 'CHARACTER',
      logs: ['Job created. Waiting in queue...'],
      scenes: [],
      createdAt: Date.now()
    };

    set({ scriptJobs: [job, ...get().scriptJobs] });
  },

  updateJob: (id, data) => {
    set({
      scriptJobs: get().scriptJobs.map(j => j.id === id ? { ...j, ...data } : j)
    });
  },

  deleteJob: (id) => {
    set({
      scriptJobs: get().scriptJobs.filter(j => j.id !== id)
    });
  },

  addLog: (id, msg) => {
    const timestamp = new Date().toLocaleTimeString();
    set({
      scriptJobs: get().scriptJobs.map(j =>
        j.id === id ? { ...j, logs: [...j.logs, `[${timestamp}] ${msg}`] } : j
      )
    });
  },

  setProcessingQueue: (isProcessing) => set({ isProcessingQueue: isProcessing }),

  setUser: (user) => set({ user }),
  setLoadingAuth: (isLoading) => set({ isLoadingAuth: isLoading }),
  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
  setPricingModalOpen: (isOpen) => set({ isPricingModalOpen: isOpen }),
  setVerificationPending: (pending, email = null) => set({ isVerificationPending: pending, verificationEmail: email }),
  
  setAdminView: (isOpen) => set({ isAdminView: isOpen })
}));
