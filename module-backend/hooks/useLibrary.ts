
import { useState, useEffect, useCallback } from 'react';
import { GeneratedStory } from '../types';

const LIBRARY_STORAGE_KEY = 'ai_story_factory_library';

export function useLibrary(currentUid: string | undefined) {
  const [library, setLibrary] = useState<GeneratedStory[]>([]);

  useEffect(() => {
    if (!currentUid) return;
    const savedLibrary = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (savedLibrary) {
      try {
        setLibrary(JSON.parse(savedLibrary));
      } catch (e) {
        console.error("Failed to parse library", e);
      }
    }
  }, [currentUid]);

  const saveToLibrary = useCallback((story: GeneratedStory) => {
    setLibrary(prevLibrary => {
      const updatedLibrary = [story, ...prevLibrary.filter(s => s.id !== story.id)];
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updatedLibrary));
      return updatedLibrary;
    });
  }, []);

  const deleteFromLibrary = useCallback((id: string) => {
    setLibrary(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    library,
    saveToLibrary,
    deleteFromLibrary
  };
}
