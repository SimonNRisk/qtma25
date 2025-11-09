import { useState, useCallback, useRef } from 'react';

interface PostHistoryEntry {
  content: string;
  timestamp: number;
}

interface UsePostHistoryReturn {
  currentPost: string;
  setCurrentPost: (post: string) => void;
  saveToHistory: (post: string) => void;
  goBack: () => boolean;
  canGoBack: boolean;
  history: PostHistoryEntry[];
  clearHistory: () => void;
}

/**
 * Custom hook for managing post history with undo functionality
 * @param initialPost - Initial post content
 * @param maxHistorySize - Maximum number of history entries to keep (default: 50)
 * @returns Object with post state and history management functions
 */
export function usePostHistory(
  initialPost: string = '',
  maxHistorySize: number = 50
): UsePostHistoryReturn {
  const [currentPost, setCurrentPostState] = useState<string>(initialPost);
  const [history, setHistory] = useState<PostHistoryEntry[]>([]);
  const previousPostRef = useRef<string>(initialPost);

  /**
   * Save current post to history if it's different from the previous version
   */
  const saveToHistory = useCallback(
    (post: string) => {
      // Only save if the content actually changed
      if (post === previousPostRef.current) {
        return;
      }

      // Save the previous version to history before updating
      if (previousPostRef.current.trim()) {
        setHistory(prev => {
          const newHistory = [
            ...prev,
            {
              content: previousPostRef.current,
              timestamp: Date.now(),
            },
          ];

          // Limit history size
          if (newHistory.length > maxHistorySize) {
            return newHistory.slice(-maxHistorySize);
          }

          return newHistory;
        });
      }

      previousPostRef.current = post;
      setCurrentPostState(post);
    },
    [maxHistorySize]
  );

  /**
   * Restore the previous version from history
   * @returns true if a previous version was restored, false if no history available
   */
  const goBack = useCallback((): boolean => {
    if (history.length === 0) {
      return false;
    }

    // Get the most recent history entry
    const previousVersion = history[history.length - 1];

    // Remove it from history
    setHistory(prev => prev.slice(0, -1));

    // Update current post
    previousPostRef.current = previousVersion.content;
    setCurrentPostState(previousVersion.content);

    return true;
  }, [history]);

  /**
   * Set current post without saving to history
   */
  const setCurrentPost = useCallback((post: string) => {
    previousPostRef.current = post;
    setCurrentPostState(post);
  }, []);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    currentPost,
    setCurrentPost,
    saveToHistory,
    goBack,
    canGoBack: history.length > 0,
    history,
    clearHistory,
  };
}
