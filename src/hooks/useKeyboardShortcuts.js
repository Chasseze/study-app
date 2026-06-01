import { useEffect, useCallback } from 'react';

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} handlers - Object mapping keyboard shortcuts to handler functions
 * @param {Array} deps - Dependency array for handlers
 */
export default function useKeyboardShortcuts(handlers, enabled = true) {
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? event.metaKey : event.ctrlKey;

    // Check for specific key combinations
    const key = event.key.toLowerCase();
    
    // Cmd/Ctrl + B (Bold)
    if (modifier && key === 'b' && handlers.bold) {
      event.preventDefault();
      handlers.bold();
    }
    // Cmd/Ctrl + I (Italic)
    else if (modifier && key === 'i' && handlers.italic) {
      event.preventDefault();
      handlers.italic();
    }
    // Cmd/Ctrl + U (Underline)
    else if (modifier && key === 'u' && handlers.underline) {
      event.preventDefault();
      handlers.underline();
    }
    // Cmd/Ctrl + K (Command palette)
    else if (modifier && !event.shiftKey && key === 'k' && handlers.commandPalette) {
      event.preventDefault();
      handlers.commandPalette();
    }
    // Cmd/Ctrl + Shift + K (Link)
    else if (modifier && event.shiftKey && key === 'k' && handlers.link) {
      event.preventDefault();
      handlers.link();
    }
    // Cmd/Ctrl + Shift + I (Image)
    else if (modifier && event.shiftKey && key === 'i' && handlers.image) {
      event.preventDefault();
      handlers.image();
    }
    // Cmd/Ctrl + Z (Undo)
    else if (modifier && !event.shiftKey && key === 'z' && handlers.undo) {
      event.preventDefault();
      handlers.undo();
    }
    // Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y (Redo)
    else if (
      (modifier && event.shiftKey && key === 'z' && handlers.redo) ||
      (modifier && key === 'y' && handlers.redo)
    ) {
      event.preventDefault();
      handlers.redo();
    }
    // Cmd/Ctrl + S (Save)
    else if (modifier && key === 's' && handlers.save) {
      event.preventDefault();
      handlers.save();
    }
  }, [enabled, handlers]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
