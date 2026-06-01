import { useState, useMemo } from 'react';

const WORDS_BEFORE = 1;
const WORDS_AFTER = 4;

// Returns { before, match, after } for highlighted rendering, or null if no match.
function buildSnippet(content, query) {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerContent.indexOf(lowerQuery);
  if (idx === -1) return null;

  const matchText = content.slice(idx, idx + query.length);

  // Grab up to WORDS_BEFORE words immediately before the match.
  const textBefore = content.slice(0, idx);
  const wordsBefore = textBefore.trimEnd().split(/\s+/).filter(Boolean);
  const beforeWords = wordsBefore.slice(-WORDS_BEFORE);
  const before = (idx > 0 && wordsBefore.length > WORDS_BEFORE ? '…' : '') + beforeWords.join(' ') + (beforeWords.length > 0 ? ' ' : '');

  // Grab up to WORDS_AFTER words immediately after the match.
  const textAfter = content.slice(idx + query.length);
  const wordsAfter = textAfter.trimStart().split(/\s+/).filter(Boolean);
  const afterWords = wordsAfter.slice(0, WORDS_AFTER);
  const after = (afterWords.length > 0 ? ' ' : '') + afterWords.join(' ') + (wordsAfter.length > WORDS_AFTER ? '…' : '');

  return { before, match: matchText, after };
}

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

  // For each matching topic, produce a content snippet only when the match
  // is in the body (not the title), so the snippet explains why it appeared.
  const matchSnippets = useMemo(() => {
    if (!searchQuery.trim()) return {};
    const result = {};
    filteredTopics.forEach(topic => {
      const titleMatches = topic.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!titleMatches) {
        const snippet = buildSnippet(topic.content, searchQuery);
        if (snippet) result[topic.id] = snippet;
      }
    });
    return result;
  }, [filteredTopics, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredTopics,
    matchSnippets
  };
}
