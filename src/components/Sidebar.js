import React from 'react';
import { PlusIcon, SearchIcon, FolderIcon, TrashIcon, PinIcon, ArchiveIcon } from './icons';

export default function Sidebar({
  filteredTopics,
  selectedTopic,
  setSelectedTopic,
  setPreviewUrl,
  focusTopicById,
  handleDeleteTopic,
  handleTogglePin,
  handleArchiveTopic,
  showArchived,
  setShowArchived,
  archivedCount,
  topicListRef,
  topicsListboxId,
  activeTopicOptionId,
  handleTopicListKeyDown,
  topicRefs,
  newTopicButtonRef,
  setShowNewTopicModal,
  showNewTopicModal,
  searchQuery,
  setSearchQuery,
  searchHelpId,
  topicCountLabelId,
  topicCountAnnouncement,
  categories,
  selectedCategory,
  setSelectedCategory,
  categoryFilterLabelId,
  categoryFilterSelectId,
  categoryFilterHelpId
}) {
  // Sort topics: pinned first, then by lastModified
  const sortedTopics = [...filteredTopics].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.lastModified) - new Date(a.lastModified);
  });

  return (
    <aside
      aria-label="Topic navigation"
      style={{
        width: '280px',
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
        <button
          data-testid="btn-new-topic"
          id="new-topic-button"
          ref={newTopicButtonRef}
          onClick={() => setShowNewTopicModal(true)}
          aria-haspopup="dialog"
          aria-expanded={showNewTopicModal ? 'true' : 'false'}
          style={{
            width: '100%',
            backgroundColor: '#4f46e5',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <PlusIcon /> New Topic
        </button>
      </div>

      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
        <div style={{ position: 'relative' }}>
          <label htmlFor="topic-search" style={{ position: 'absolute', left: -9999 }}>{'Search topics'}</label>
          <span style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--text-muted)' }} aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            id="topic-search"
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-controls={topicsListboxId}
            aria-describedby={`${searchHelpId} ${topicCountLabelId}`}
            style={{
              width: '100%',
              paddingLeft: '2.25rem',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }}
          />
          <span id={searchHelpId} style={{ position: 'absolute', left: -9999 }}>{'Search topics by title or note content. Results update immediately.'}</span>
          <span id={topicCountLabelId} aria-live="polite" style={{ position: 'absolute', left: -9999 }}>{topicCountAnnouncement}</span>
        </div>
      </div>

      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
        <label
          id={categoryFilterLabelId}
          htmlFor={categoryFilterSelectId}
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.35rem'
          }}
        >
          Filter by category
        </label>
        <span id={categoryFilterHelpId} style={{ position: 'absolute', left: -9999 }}>{'Choose a category from the dropdown to narrow the topics list.'}</span>
        <select
          id={categoryFilterSelectId}
          aria-labelledby={categoryFilterLabelId}
          aria-describedby={categoryFilterHelpId}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            width: '100%',
            padding: '0.55rem 0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.06)'
          }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Archive toggle */}
      {archivedCount > 0 && (
        <div style={{ 
          padding: '0.5rem 1rem', 
          borderBottom: '1px solid var(--border-color)', 
          backgroundColor: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => setShowArchived(!showArchived)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: 'none',
              color: showArchived ? '#f59e0b' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500
            }}
          >
            <ArchiveIcon />
            {showArchived ? 'Hide Archived' : `Show Archived (${archivedCount})`}
          </button>
        </div>
      )}

      <div
        style={{ flex: 1, overflowY: 'auto' }}
        role="listbox"
        aria-label="Available topics"
        aria-activedescendant={activeTopicOptionId}
        aria-orientation="vertical"
        tabIndex={0}
        onKeyDown={handleTopicListKeyDown}
        ref={topicListRef}
        id={topicsListboxId}
      >
        {sortedTopics.length === 0 ? (
          <div role="status" aria-live="polite" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ marginBottom: '1rem' }}><FolderIcon /></div>
            <p>No topics found</p>
          </div>
        ) : (
          sortedTopics.map(topic => (
            <div
              key={topic.id}
              onClick={() => { setSelectedTopic(topic); setPreviewUrl(''); focusTopicById(topic.id); }}
              style={{
                padding: '0.45rem 0.75rem',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-light)',
                backgroundColor: selectedTopic?.id === topic.id ? 'var(--topic-selected)' : topic.archived ? 'var(--bg-tertiary)' : 'var(--sidebar-bg)',
                borderLeft: selectedTopic?.id === topic.id ? '4px solid #4f46e5' : topic.pinned ? '4px solid #f59e0b' : 'none',
                opacity: topic.archived ? 0.7 : 1
              }}
              role="option"
              tabIndex={selectedTopic?.id === topic.id ? 0 : -1}
              aria-selected={selectedTopic?.id === topic.id}
              id={`topic-option-${topic.id}`}
              onKeyDown={(e) => {
                if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  setSelectedTopic(topic);
                  setPreviewUrl('');
                  focusTopicById(topic.id);
                }
              }}
              ref={(node) => {
                if (node) {
                  topicRefs.current.set(topic.id, node);
                } else {
                  topicRefs.current.delete(topic.id);
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {topic.pinned && <span style={{ color: '#f59e0b' }}><PinIcon filled /></span>}
                    <h3 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.12rem', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.95rem' }}>{topic.title}</h3>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.12rem' }}>
                    <span style={{ fontSize: '0.72rem', backgroundColor: 'var(--topic-selected)', color: '#4f46e5', padding: '0.12rem 0.35rem', borderRadius: '9999px' }}>{topic.category}</span>
                    {topic.tags && topic.tags.map(tag => (
                      <span key={tag} style={{ fontSize: '0.68rem', backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '0.1rem 0.3rem', borderRadius: '9999px' }}>#{tag}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleTogglePin(topic.id); }}
                    style={{ color: topic.pinned ? '#f59e0b' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem' }}
                    aria-label={topic.pinned ? `Unpin topic ${topic.title}` : `Pin topic ${topic.title}`}
                    title={topic.pinned ? 'Unpin' : 'Pin to top'}
                  >
                    <PinIcon filled={topic.pinned} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleArchiveTopic(topic.id); }}
                    style={{ color: topic.archived ? '#f59e0b' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem' }}
                    aria-label={topic.archived ? `Restore topic ${topic.title}` : `Archive topic ${topic.title}`}
                    title={topic.archived ? 'Restore' : 'Archive'}
                  >
                    <ArchiveIcon />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id); }}
                    style={{ color: 'var(--button-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem' }}
                    aria-label={`Delete topic ${topic.title}`}
                    title={`Delete topic ${topic.title}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.28rem' }}>Modified: {new Date(topic.lastModified).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
