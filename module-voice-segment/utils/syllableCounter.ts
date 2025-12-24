
// Implements the Vietnamese Syllable Counter v2.0 rules
export const countSyllables = (text: string): number => {
  if (!text) {
    return 0;
  }
  // LOẠI BỎ tất cả dấu câu trước khi đếm
  const cleanedText = text.replace(/[.,!?;:(){}[\]"']/g, '');
  
  // Trim whitespace from both ends
  const trimmedText = cleanedText.trim();
  
  // If the string is empty after cleaning, there are no syllables
  if (trimmedText === '') {
    return 0;
  }
  
  // MỖI khoảng trắng = 1 âm tiết (by splitting on whitespace)
  return trimmedText.split(/\s+/).length;
};
