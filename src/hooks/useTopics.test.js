import { renderHook, act } from '@testing-library/react';
import useTopics from './useTopics';

describe('useTopics hook', () => {
  const mockTopics = [
    { id: 1, title: 'Topic 1', category: 'Work', content: 'Content 1' },
    { id: 2, title: 'Topic 2', category: 'Personal', content: 'Content 2' },
  ];

  describe('initialization', () => {
    it('should initialize with empty topics when no initial data provided', () => {
      const { result } = renderHook(() => useTopics());
      expect(result.current.topics).toEqual([]);
      expect(result.current.selectedTopic).toBeNull();
    });

    it('should initialize with provided topics and select the first one', () => {
      const { result } = renderHook(() => useTopics(mockTopics));
      expect(result.current.topics).toEqual(mockTopics);
      expect(result.current.selectedTopic).toEqual(mockTopics[0]);
    });
  });

  describe('addTopic', () => {
    it('should add a new topic and select it', () => {
      const { result } = renderHook(() => useTopics(mockTopics));
      const newTopic = { id: 3, title: 'New Topic', category: 'New', content: '' };

      act(() => {
        result.current.addTopic(newTopic);
      });

      expect(result.current.topics).toHaveLength(3);
      expect(result.current.topics[2]).toEqual(newTopic);
      expect(result.current.selectedTopic).toEqual(newTopic);
    });
  });

  describe('updateTopic', () => {
    it('should update an existing topic', () => {
      const { result } = renderHook(() => useTopics(mockTopics));

      act(() => {
        result.current.updateTopic(1, { title: 'Updated Title' });
      });

      expect(result.current.topics[0].title).toBe('Updated Title');
      expect(result.current.topics[0].content).toBe('Content 1'); // Unchanged
    });

    it('should update selectedTopic if it matches the updated topic', () => {
      const { result } = renderHook(() => useTopics(mockTopics));

      act(() => {
        result.current.updateTopic(1, { title: 'Updated Title' });
      });

      expect(result.current.selectedTopic.title).toBe('Updated Title');
    });

    it('should not update selectedTopic if it does not match', () => {
      const { result } = renderHook(() => useTopics(mockTopics));

      act(() => {
        result.current.updateTopic(2, { title: 'Updated Title' });
      });

      expect(result.current.selectedTopic.id).toBe(1);
      expect(result.current.selectedTopic.title).toBe('Topic 1');
    });
  });

  describe('deleteTopic', () => {
    it('should delete a topic by id', () => {
      const { result } = renderHook(() => useTopics(mockTopics));

      act(() => {
        result.current.deleteTopic(2);
      });

      expect(result.current.topics).toHaveLength(1);
      expect(result.current.topics[0].id).toBe(1);
    });

    it('should select next topic when selected topic is deleted', () => {
      const { result } = renderHook(() => useTopics(mockTopics));

      act(() => {
        result.current.deleteTopic(1);
      });

      expect(result.current.selectedTopic.id).toBe(2);
    });

    it('should set selectedTopic to null when all topics are deleted', () => {
      const { result } = renderHook(() => useTopics([{ id: 1, title: 'Only Topic' }]));

      act(() => {
        result.current.deleteTopic(1);
      });

      expect(result.current.topics).toHaveLength(0);
      expect(result.current.selectedTopic).toBeNull();
    });
  });

  describe('loadTopics', () => {
    it('should replace all topics and select the first one', () => {
      const { result } = renderHook(() => useTopics(mockTopics));
      const newTopics = [
        { id: 10, title: 'New 1', category: 'A', content: '' },
        { id: 11, title: 'New 2', category: 'B', content: '' },
      ];

      act(() => {
        result.current.loadTopics(newTopics);
      });

      expect(result.current.topics).toEqual(newTopics);
      expect(result.current.selectedTopic).toEqual(newTopics[0]);
    });

    it('should set selectedTopic to null when loading empty array', () => {
      const { result } = renderHook(() => useTopics(mockTopics));

      act(() => {
        result.current.loadTopics([]);
      });

      expect(result.current.topics).toEqual([]);
      expect(result.current.selectedTopic).toBeNull();
    });
  });

  describe('setSelectedTopic', () => {
    it('should change the selected topic', () => {
      const { result } = renderHook(() => useTopics(mockTopics));

      act(() => {
        result.current.setSelectedTopic(mockTopics[1]);
      });

      expect(result.current.selectedTopic).toEqual(mockTopics[1]);
    });
  });
});
