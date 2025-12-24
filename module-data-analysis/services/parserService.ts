import { ParsedResult } from '../types';
import { safeParseMultiArrayV2, detectKeys } from '../utils/helpers';

export const parseSceneJson = (jsonString: string): ParsedResult => {
  try {
    const data = safeParseMultiArrayV2(jsonString);
    const keys = detectKeys(data);

    return {
      data,
      keys
    };
  } catch (error: any) {
    throw new Error(error.message || "Invalid JSON format. Please check your input.");
  }
};

export const formatFieldContent = (values: string[], separator: string = "\n\n"): string => {
  return values.join(separator);
};
