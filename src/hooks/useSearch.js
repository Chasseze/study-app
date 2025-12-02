import { useState, useMemo } from 'react';

/**
 * Custom hook for search and category filtering
 */
export default function useSearch(topics) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(() => 
    ['All', ...new Set(topics.map(t => t.category))],
    [topics]
  );

  const filteredTopics = useMemo(() => {
    return topics.filter(topic => {
      const matchesSearch = 
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || topic.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [topics, searchQuery, selectedCategory]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredTopics
  };
}
