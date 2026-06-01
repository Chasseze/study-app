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

  describe('matchSnippets', () => {
    it('returns empty object when search query is empty', () => {
      const { result } = renderHook(() => useSearch(mockTopics));
      expect(result.current.matchSnippets).toEqual({});
    });

    it('returns no snippet when query matches only the title', () => {
      const { result } = renderHook(() => useSearch(mockTopics));
      act(() => { result.current.setSearchQuery('React'); });
      expect(result.current.matchSnippets[1]).toBeUndefined();
    });

    it('returns a snippet when query matches only the content', () => {
      const { result } = renderHook(() => useSearch(mockTopics));
      act(() => { result.current.setSearchQuery('hooks'); });
      const snippet = result.current.matchSnippets[1];
      expect(snippet).toBeDefined();
      expect(snippet.match).toMatch(/hooks/i);
    });

    it('snippet has before/match/after parts with surrounding context', () => {
      const { result } = renderHook(() => useSearch(mockTopics));
      act(() => { result.current.setSearchQuery('timeline'); });
      const snippet = result.current.matchSnippets[3];
      expect(snippet).toBeDefined();
      expect(snippet.match).toMatch(/timeline/i);
      expect(typeof snippet.before).toBe('string');
      expect(typeof snippet.after).toBe('string');
    });

    it('uses ellipsis prefix when match is not at start of content', () => {
      const topics = [
        { id: 99, title: 'X', category: 'All', content: 'one two three four five six seven ' + 'needle' + ' eight nine' }
      ];
      const { result } = renderHook(() => useSearch(topics));
      act(() => { result.current.setSearchQuery('needle'); });
      const snippet = result.current.matchSnippets[99];
      expect(snippet).toBeDefined();
      expect(snippet.before).toMatch(/^…/);
    });

    it('does not produce a snippet when content does not contain the query', () => {
      const { result } = renderHook(() => useSearch(mockTopics));
      act(() => { result.current.setSearchQuery('pasta'); });
      expect(result.current.matchSnippets[4]).toBeDefined();
      expect(result.current.matchSnippets[1]).toBeUndefined();
    });
  });
});
