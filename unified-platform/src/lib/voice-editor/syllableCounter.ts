// Vietnamese Syllable Counter v2.0
// Each whitespace-separated word = 1 syllable in Vietnamese

export const countSyllables = (text: string): number => {
    if (!text) {
        return 0;
    }
    // Remove all punctuation before counting
    const cleanedText = text.replace(/[.,!?;:(){}[\]"']/g, '');

    // Trim whitespace from both ends
    const trimmedText = cleanedText.trim();

    // If the string is empty after cleaning, there are no syllables
    if (trimmedText === '') {
        return 0;
    }

    // Each word (space-separated) = 1 syllable in Vietnamese
    return trimmedText.split(/\s+/).length;
};
