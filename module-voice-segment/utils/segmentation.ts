
import { countSyllables } from './syllableCounter';
import { Segment } from '../types';

export const createSegmentsFromSentences = (sentences: string[], minSyllables: number, maxSyllables: number): Segment[] => {
  let initialSegments: { text: string }[] = [];
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();

    // Reverted Rule: We no longer treat quoted text as atomic. 
    // We proceed to standard segmentation logic for all sentences.
    
    let words = trimmedSentence.split(/\s+/).filter(w => w);
    let currentSegmentText = "";

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const potentialSegment = (currentSegmentText + " " + word).trim();
      const syllableCount = countSyllables(potentialSegment);

      if (syllableCount > maxSyllables) {
        let segmentToPush = currentSegmentText;
        let nextSegmentStart = word;

        // Try to find a better split point (comma, semicolon)
        const lastCommaIndex = currentSegmentText.lastIndexOf(',');
        const lastSemicolonIndex = currentSegmentText.lastIndexOf(';');
        const splitIndex = Math.max(lastCommaIndex, lastSemicolonIndex);

        if (splitIndex > 0 && countSyllables(currentSegmentText.substring(0, splitIndex + 1)) >= minSyllables/2) {
            segmentToPush = currentSegmentText.substring(0, splitIndex + 1).trim();
            nextSegmentStart = (currentSegmentText.substring(splitIndex + 1) + " " + word).trim();
        }
        
        if (countSyllables(segmentToPush) > 0) {
            initialSegments.push({ text: segmentToPush });
        }
        currentSegmentText = nextSegmentStart;
      } else {
        currentSegmentText = potentialSegment;
      }
    }

    if (countSyllables(currentSegmentText) > 0) {
      initialSegments.push({ text: currentSegmentText });
    }
  }

  // Post-processing: Merge segments that are too short
  // Skip if total segments are few
  if (initialSegments.length < 2) {
     return initialSegments.map((seg, index) => {
        const syllables = countSyllables(seg.text);
        return {
          segment_id: `VS_${String(index + 1).padStart(3, '0')}`,
          text: seg.text,
          note: '',
          syllable_count: syllables,
          is_valid: syllables >= minSyllables && syllables <= maxSyllables
        };
      });
  }

  const mergedSegments: { text: string }[] = [];
  let i = 0;
  while (i < initialSegments.length) {
    let current = initialSegments[i];

    if (countSyllables(current.text) < minSyllables && (i + 1 < initialSegments.length)) {
      let next = initialSegments[i+1];
      
      const combinedText = (current.text + " " + next.text).trim();
      if (countSyllables(combinedText) <= maxSyllables) {
        mergedSegments.push({ text: combinedText });
        i += 2; // Skip next segment as it's merged
      } else {
        mergedSegments.push(current);
        i++;
      }
    } else {
      mergedSegments.push(current);
      i++;
    }
  }

  return mergedSegments.map((seg, index) => {
    const syllables = countSyllables(seg.text);
    return {
      segment_id: `VS_${String(index + 1).padStart(3, '0')}`,
      text: seg.text,
      note: '',
      syllable_count: syllables,
      is_valid: syllables >= minSyllables && syllables <= maxSyllables
    };
  });
};
