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
        minWidth: '280px',
        maxWidth: '280px',
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
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
            background: 'var(--button-primary)',
            color: 'white',
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: '600',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--button-primary-hover)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--button-primary)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }}
        >
          <PlusIcon /> New Topic
        </button>
      </div>

      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <label htmlFor="topic-search" style={{ position: 'absolute', left: -9999 }}>{'Search topics'}</label>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1, pointerEvents: 'none' }} aria-hidden="true">
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
              paddingLeft: '2.5rem',
              paddingRight: '0.875rem',
              paddingTop: '0.65rem',
              paddingBottom: '0.65rem',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              transition: 'all var(--transition-fast)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
              boxSizing: 'border-box',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-focus)';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(139,92,246,0.15), inset 0 1px 2px rgba(0,0,0,0.05)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
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
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-light)',
                background: selectedTopic?.id === topic.id ? 'var(--topic-selected)' : topic.archived ? 'var(--bg-tertiary)' : 'var(--sidebar-bg)',
                borderLeft: selectedTopic?.id === topic.id ? '4px solid var(--topic-border-selected)' : topic.pinned ? '4px solid #f59e0b' : 'none',
                opacity: topic.archived ? 0.7 : 1,
                transition: 'all var(--transition-fast)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (selectedTopic?.id !== topic.id) {
                  e.currentTarget.style.backgroundColor = 'var(--topic-hover)';
                  e.currentTarget.style.transform = 'translateX(2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTopic?.id !== topic.id) {
                  e.currentTarget.style.backgroundColor = topic.archived ? 'var(--bg-tertiary)' : 'var(--sidebar-bg)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
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
                    <h3 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.08rem', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.95rem' }}>{topic.title}</h3>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      backgroundColor: selectedTopic?.id === topic.id ? 'rgba(139,92,246,0.15)' : '#e0f2fe', 
                      color: selectedTopic?.id === topic.id ? '#8b5cf6' : '#0369a1', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: 'var(--radius-full)',
                      fontWeight: '500',
                      boxShadow: 'var(--shadow-xs)'
                    }}>{topic.category}</span>
                    {topic.tags && topic.tags.map(tag => (
                      <span key={tag} style={{ 
                        fontSize: '0.7rem', 
                        backgroundColor: '#dbeafe', 
                        color: '#1d4ed8', 
                        padding: '0.2rem 0.45rem', 
                        borderRadius: 'var(--radius-full)',
                        fontWeight: '500',
                        boxShadow: 'var(--shadow-xs)'
                      }}>#{tag}</span>
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
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Modified: {new Date(topic.lastModified).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
