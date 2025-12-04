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

  // Undo returns the previous value directly
  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      return history[newIndex];
    }
    return currentValue;
  }, [canUndo, currentIndex, history, currentValue]);

  // Redo returns the next value directly
  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      return history[newIndex];
    }
    return currentValue;
  }, [canRedo, currentIndex, history, currentValue]);

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
