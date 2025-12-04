import { renderHook, act } from '@testing-library/react';
import useSearch from './useSearch';

describe('useSearch hook', () => {
  const mockTopics = [
    { id: 1, title: 'React Tutorial', category: 'Programming', content: 'Learn React hooks and components' },
    { id: 2, title: 'JavaScript Basics', category: 'Programming', content: 'Variables, functions, and objects' },
    { id: 3, title: 'Meeting Notes', category: 'Work', content: 'Discussed project timeline' },
    { id: 4, title: 'Recipe Ideas', category: 'Personal', content: 'Pasta and salad recipes' },
  ];

  describe('initialization', () => {
    it('should initialize with empty search query', () => {
      const { result } = renderHook(() => useSearch(mockTopics));
      expect(result.current.searchQuery).toBe('');
    });

    it('should initialize with "All" category selected', () => {
      const { result } = renderHook(() => useSearch(mockTopics));
      expect(result.current.selectedCategory).toBe('All');
    });

    it('should return all topics when no filters applied', () => {
      const { result } = renderHook(() => useSearch(mockTopics));
      expect(result.current.filteredTopics).toHaveLength(4);
    });
  });

  describe('categories', () => {
    it('should extract unique categories from topics', () => {
      const { result } = renderHook(() => useSearch(mockTopics));
      expect(result.current.categories).toContain('All');
      expect(result.current.categories).toContain('Programming');
      expect(result.current.categories).toContain('Work');
      expect(result.current.categories).toContain('Personal');
    });

    it('should not have duplicate categories', () => {
      const { result } = renderHook(() => useSearch(mockTopics));
      const uniqueCategories = [...new Set(result.current.categories)];
      expect(result.current.categories).toEqual(uniqueCategories);
    });
  });

  describe('search filtering', () => {
    it('should filter topics by title', () => {
      const { result } = renderHook(() => useSearch(mockTopics));

      act(() => {
        result.current.setSearchQuery('React');
      });

      expect(result.current.filteredTopics).toHaveLength(1);
      expect(result.current.filteredTopics[0].title).toBe('React Tutorial');
    });

    it('should filter topics by content', () => {
      const { result } = renderHook(() => useSearch(mockTopics));

      act(() => {
        result.current.setSearchQuery('hooks');
      });

      expect(result.current.filteredTopics).toHaveLength(1);
      expect(result.current.filteredTopics[0].title).toBe('React Tutorial');
    });

    it('should be case-insensitive', () => {
      const { result } = renderHook(() => useSearch(mockTopics));

      act(() => {
        result.current.setSearchQuery('JAVASCRIPT');
      });

      expect(result.current.filteredTopics).toHaveLength(1);
      expect(result.current.filteredTopics[0].title).toBe('JavaScript Basics');
    });

    it('should return empty array when no matches found', () => {
      const { result } = renderHook(() => useSearch(mockTopics));

      act(() => {
        result.current.setSearchQuery('nonexistent');
      });

      expect(result.current.filteredTopics).toHaveLength(0);
    });
  });

  describe('category filtering', () => {
    it('should filter topics by category', () => {
      const { result } = renderHook(() => useSearch(mockTopics));

      act(() => {
        result.current.setSelectedCategory('Programming');
      });

      expect(result.current.filteredTopics).toHaveLength(2);
      expect(result.current.filteredTopics.every(t => t.category === 'Programming')).toBe(true);
    });

    it('should show all topics when "All" category is selected', () => {
      const { result } = renderHook(() => useSearch(mockTopics));

      act(() => {
        result.current.setSelectedCategory('Programming');
      });

      act(() => {
        result.current.setSelectedCategory('All');
      });

      expect(result.current.filteredTopics).toHaveLength(4);
    });
  });

  describe('combined filtering', () => {
    it('should apply both search and category filters', () => {
      const { result } = renderHook(() => useSearch(mockTopics));

      act(() => {
        result.current.setSearchQuery('project');
        result.current.setSelectedCategory('Work');
      });

      expect(result.current.filteredTopics).toHaveLength(1);
      expect(result.current.filteredTopics[0].title).toBe('Meeting Notes');
    });

    it('should return empty when filters have no intersection', () => {
      const { result } = renderHook(() => useSearch(mockTopics));

      act(() => {
        result.current.setSearchQuery('React');
        result.current.setSelectedCategory('Personal');
      });

      expect(result.current.filteredTopics).toHaveLength(0);
    });
  });

  describe('empty topics', () => {
    it('should handle empty topics array', () => {
      const { result } = renderHook(() => useSearch([]));
      expect(result.current.filteredTopics).toHaveLength(0);
      expect(result.current.categories).toEqual(['All']);
    });
  });
});
