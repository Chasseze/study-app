import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for undo/redo functionality with history stack
 * @param {string} initialValue - Initial content value
 * @param {number} limit - Maximum history size (default: 50)
 */
export default function useUndoRedo(initialValue = '', limit = 50) {
  const [history, setHistory] = useState([initialValue]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef(null);

  const currentValue = history[currentIndex];
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Push a new value onto the history stack (with debouncing)
  const pushHistory = useCallback((newValue) => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce to avoid creating history entries on every keystroke
    timeoutRef.current = setTimeout(() => {
      setHistory(prev => {
        // Remove any "future" history if we're not at the end
        const truncated = prev.slice(0, currentIndex + 1);
        
        // Add new value
        const updated = [...truncated, newValue];
        
        // Limit history size
        if (updated.length > limit) {
          return updated.slice(updated.length - limit);
        }
        
        return updated;
      });
      setCurrentIndex(prev => {
        const newIndex = Math.min(prev + 1, limit - 1);
        return newIndex;
      });
    }, 500); // 500ms debounce
  }, [currentIndex, limit]);

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [canRedo]);

  const reset = useCallback((newValue) => {
    setHistory([newValue]);
    setCurrentIndex(0);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    value: currentValue,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    reset
  };
}
