import { useState, useEffect, useCallback } from "react";
import { TranscriptionItem } from "@/components/TranscriptionHistory";

const STORAGE_KEY = "asr-tunisien-history";
const MAX_HISTORY_ITEMS = 50;

export const useTranscriptionHistory = () => {
  const [history, setHistory] = useState<TranscriptionItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  }, []);

  // Save to localStorage whenever history changes
  const saveToStorage = useCallback((items: TranscriptionItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Error saving history:", error);
    }
  }, []);

  const addToHistory = useCallback(
    (item: Omit<TranscriptionItem, "id" | "timestamp">) => {
      const newItem: TranscriptionItem = {
        ...item,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };

      setHistory((prev) => {
        const updated = [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
        saveToStorage(updated);
        return updated;
      });

      return newItem;
    },
    [saveToStorage]
  );

  const deleteFromHistory = useCallback(
    (id: string) => {
      setHistory((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    history,
    addToHistory,
    deleteFromHistory,
    clearHistory,
  };
};
