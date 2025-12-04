import { renderHook, act } from '@testing-library/react';
import useUndoRedo from './useUndoRedo';

// Mock timers for debounce testing
jest.useFakeTimers();

describe('useUndoRedo hook', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize with the provided value', () => {
      const { result } = renderHook(() => useUndoRedo('initial'));
      expect(result.current.value).toBe('initial');
    });

    it('should initialize with empty string when no value provided', () => {
      const { result } = renderHook(() => useUndoRedo());
      expect(result.current.value).toBe('');
    });

    it('should not be able to undo initially', () => {
      const { result } = renderHook(() => useUndoRedo('initial'));
      expect(result.current.canUndo).toBe(false);
    });

    it('should not be able to redo initially', () => {
      const { result } = renderHook(() => useUndoRedo('initial'));
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('pushHistory', () => {
    it('should add new value to history after debounce', () => {
      const { result } = renderHook(() => useUndoRedo('initial'));

      act(() => {
        result.current.pushHistory('new value');
        jest.advanceTimersByTime(500);
      });

      expect(result.current.value).toBe('new value');
      expect(result.current.canUndo).toBe(true);
    });

    it('should debounce rapid changes', () => {
      const { result } = renderHook(() => useUndoRedo('initial'));

      act(() => {
        result.current.pushHistory('a');
        result.current.pushHistory('ab');
        result.current.pushHistory('abc');
        jest.advanceTimersByTime(500);
      });

      // Only the last value should be in history
      expect(result.current.value).toBe('abc');
    });
  });

  describe('undo', () => {
    it('should return to previous value', () => {
      const { result } = renderHook(() => useUndoRedo('initial'));

      act(() => {
        result.current.pushHistory('second');
        jest.advanceTimersByTime(500);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.value).toBe('initial');
    });

    it('should return current value when cannot undo', () => {
      const { result } = renderHook(() => useUndoRedo('initial'));

      let returnedValue;
      act(() => {
        returnedValue = result.current.undo();
      });

      expect(returnedValue).toBe('initial');
    });

    it('should enable redo after undo', () => {
      const { result } = renderHook(() => useUndoRedo('initial'));

      act(() => {
        result.current.pushHistory('second');
        jest.advanceTimersByTime(500);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);
    });
  });

  describe('redo', () => {
    it('should restore undone value', () => {
      const { result } = renderHook(() => useUndoRedo('initial'));

      act(() => {
        result.current.pushHistory('second');
        jest.advanceTimersByTime(500);
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.value).toBe('second');
    });

    it('should return current value when cannot redo', () => {
      const { result } = renderHook(() => useUndoRedo('initial'));

      let returnedValue;
      act(() => {
        returnedValue = result.current.redo();
      });

      expect(returnedValue).toBe('initial');
    });
  });

  describe('reset', () => {
    it('should clear history and set new initial value', () => {
      const { result } = renderHook(() => useUndoRedo('initial'));

      act(() => {
        result.current.pushHistory('second');
        jest.advanceTimersByTime(500);
      });

      act(() => {
        result.current.reset('reset value');
      });

      expect(result.current.value).toBe('reset value');
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('history limit', () => {
    it('should respect the history limit', () => {
      const { result } = renderHook(() => useUndoRedo('0', 3));

      // Add more than limit
      for (let i = 1; i <= 5; i++) {
        act(() => {
          result.current.pushHistory(String(i));
          jest.advanceTimersByTime(500);
        });
      }

      // Should only be able to undo limited times
      let undoCount = 0;
      while (result.current.canUndo) {
        act(() => {
          result.current.undo();
        });
        undoCount++;
      }

      // Limited to 3 entries, so max 2 undos
      expect(undoCount).toBeLessThanOrEqual(3);
    });
  });

  describe('branch history', () => {
    it('should discard redo history when pushing after undo', () => {
      const { result } = renderHook(() => useUndoRedo('initial'));

      act(() => {
        result.current.pushHistory('second');
        jest.advanceTimersByTime(500);
      });

      act(() => {
        result.current.pushHistory('third');
        jest.advanceTimersByTime(500);
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.pushHistory('branch');
        jest.advanceTimersByTime(500);
      });

      // Should not be able to redo to 'third' anymore
      expect(result.current.canRedo).toBe(false);
      expect(result.current.value).toBe('branch');
    });
  });
});
