import React from 'react';
import { PlusIcon, SearchIcon, FolderIcon, TrashIcon } from './icons';

export default function Sidebar({
  filteredTopics,
  selectedTopic,
  setSelectedTopic,
  setPreviewUrl,
  focusTopicById,
  handleDeleteTopic,
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
  return (
    <aside
      aria-label="Topic navigation"
      style={{
        width: '280px',
        backgroundColor: 'white',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
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

      <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
        <div style={{ position: 'relative' }}>
          <label htmlFor="topic-search" style={{ position: 'absolute', left: -9999 }}>{'Search topics'}</label>
          <span style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: '#94a3b8' }} aria-hidden="true">
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
              border: '1px solid #cbd5e1',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}
          />
          <span id={searchHelpId} style={{ position: 'absolute', left: -9999 }}>{'Search topics by title or note content. Results update immediately.'}</span>
          <span id={topicCountLabelId} aria-live="polite" style={{ position: 'absolute', left: -9999 }}>{topicCountAnnouncement}</span>
        </div>
      </div>

      <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
        <label
          id={categoryFilterLabelId}
          htmlFor={categoryFilterSelectId}
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#475569',
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
            border: '1px solid #cbd5e1',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            backgroundColor: '#ffffff',
            color: '#0f172a',
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
        {filteredTopics.length === 0 ? (
          <div role="status" aria-live="polite" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ marginBottom: '1rem' }}><FolderIcon /></div>
            <p>No topics found</p>
          </div>
        ) : (
          filteredTopics.map(topic => (
            <div
              key={topic.id}
              onClick={() => { setSelectedTopic(topic); setPreviewUrl(''); focusTopicById(topic.id); }}
              style={{
                padding: '0.45rem 0.75rem',
                cursor: 'pointer',
                borderBottom: '1px solid #f8fafc',
                backgroundColor: selectedTopic?.id === topic.id ? '#eef2ff' : 'white',
                borderLeft: selectedTopic?.id === topic.id ? '4px solid #4f46e5' : 'none'
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
                  <h3 style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.12rem', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.95rem' }}>{topic.title}</h3>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#eef2ff', color: '#4f46e5', padding: '0.12rem 0.35rem', borderRadius: '9999px' }}>{topic.category}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id); }}
                  style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.5rem' }}
                  aria-label={`Delete topic ${topic.title}`}
                  title={`Delete topic ${topic.title}`}
                >
                  <TrashIcon />
                </button>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.28rem' }}>Modified: {new Date(topic.lastModified).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
