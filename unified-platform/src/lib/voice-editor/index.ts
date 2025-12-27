// Voice Editor Utils Export

export { countSyllables, getUnitLabel } from './syllableCounter';
export { createSegmentsFromSentences, createSegmentsFromOriginal } from './segmentation';
export type { Segment, Sentence, SuggestionType, VoiceLanguage } from './types';
export { VOICE_LANGUAGES } from './types';

// AI Service
export { getVoiceSuggestion, mergeSegmentsWithAI, bulkFixSegments } from './aiService';

// History Hook
export { useHistory } from './useHistory';

// Export Functions
export { exportSegments, exportToTxt, exportToJson, exportToCsv } from './export';
