import { renderHook, act } from '@testing-library/react';
import useTheme from './useTheme';

describe('useTheme hook', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: jest.fn(key => store[key] || null),
      setItem: jest.fn((key, value) => { store[key] = value; }),
      clear: () => { store = {}; }
    };
  })();

  // Mock matchMedia
  const matchMediaMock = jest.fn();

  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    Object.defineProperty(window, 'matchMedia', { 
      value: matchMediaMock,
      writable: true 
    });
  });

  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    matchMediaMock.mockClear();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('initialization', () => {
    it('should use stored theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('dark');
    });

    it('should detect system preference when no stored theme', () => {
      localStorageMock.getItem.mockReturnValue(null);
      matchMediaMock.mockReturnValue({ matches: true });

      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('dark');
    });

    it('should default to light theme when no preference', () => {
      localStorageMock.getItem.mockReturnValue(null);
      matchMediaMock.mockReturnValue({ matches: false });

      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', () => {
      localStorageMock.getItem.mockReturnValue('light');
      
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
    });
  });

  describe('persistence', () => {
    it('should save theme to localStorage', () => {
      localStorageMock.getItem.mockReturnValue('light');
      
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleTheme();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should apply theme to document element', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      
      renderHook(() => useTheme());

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('setTheme', () => {
    it('should allow setting theme directly', () => {
      localStorageMock.getItem.mockReturnValue('light');
      
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });
  });
});
