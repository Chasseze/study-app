import { useMemo } from 'react';

/**
 * Custom hook for calculating workspace metrics
 */
export default function useWorkspaceInsights(topics) {
  const insights = useMemo(() => {
    const totalTopics = topics.length;
    const uniqueCategories = new Set(topics.map(topic => topic.category).filter(Boolean));
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    const stats = topics.reduce((acc, topic) => {
      const content = topic.content || '';
      const trimmed = content.trim();
      const words = trimmed ? trimmed.split(/\s+/).length : 0;
      acc.wordCount += words;

      const mediaMatches = content.match(/!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\((?!#)[^)]+\)/g);
      acc.mediaCount += mediaMatches ? mediaMatches.length : 0;

      if (topic.lastModified) {
        const modifiedTime = new Date(topic.lastModified).getTime();
        if (now - modifiedTime <= sevenDaysMs) {
          acc.recentCount += 1;
        }
      }
      return acc;
    }, { wordCount: 0, mediaCount: 0, recentCount: 0 });

    const readingMinutes = stats.wordCount > 0 ? Math.max(1, Math.round(stats.wordCount / 200)) : null;

    return [
      { id: 'topics', label: 'Topics', value: totalTopics, hint: `${totalTopics} total` },
      { id: 'categories', label: 'Categories', value: uniqueCategories.size, hint: `${uniqueCategories.size} unique` },
      { id: 'active', label: 'Active', value: totalTopics, hint: 'Currently active topics' },
      { id: 'media', label: 'Media', value: stats.mediaCount, hint: 'Images & links' },
      { id: 'reading', label: 'Reading', value: readingMinutes ? `${readingMinutes} min` : '—', hint: 'Estimated reading time' }
    ];
  }, [topics]);

  return insights;
}
