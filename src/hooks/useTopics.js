import { useState, useCallback } from 'react';

/**
 * Custom hook for managing topics (CRUD operations)
 */
export default function useTopics(initialTopics = []) {
  const [topics, setTopics] = useState(initialTopics);
  const [selectedTopic, setSelectedTopic] = useState(initialTopics[0] || null);

  const addTopic = useCallback((newTopic) => {
    setTopics(prev => [...prev, newTopic]);
    setSelectedTopic(newTopic);
  }, []);

  const updateTopic = useCallback((id, updates) => {
    setTopics(prev => prev.map(topic =>
      topic.id === id ? { ...topic, ...updates } : topic
    ));
    setSelectedTopic(prev => prev?.id === id ? { ...prev, ...updates } : prev);
  }, []);

  const deleteTopic = useCallback((id) => {
    setTopics(prev => {
      const filtered = prev.filter(t => t.id !== id);
      if (selectedTopic?.id === id && filtered.length > 0) {
        setSelectedTopic(filtered[0]);
      } else if (filtered.length === 0) {
        setSelectedTopic(null);
      }
      return filtered;
    });
  }, [selectedTopic]);

  const loadTopics = useCallback((newTopics) => {
    setTopics(newTopics);
    setSelectedTopic(newTopics[0] || null);
  }, []);

  return {
    topics,
    selectedTopic,
    setSelectedTopic,
    addTopic,
    updateTopic,
    deleteTopic,
    loadTopics,
    setTopics
  };
}
