import React, { useState } from 'react';
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
  categoryFilterHelpId,
  allTags,
  selectedTagFilter,
  setSelectedTagFilter,
  onRenameTagGlobally,
  onDeleteTagGlobally,
  savedFilters,
  hasActiveFilter,
  onSaveCurrentFilterPreset,
  onApplySavedFilter,
  onRenameSavedFilter,
  onTogglePinSavedFilter,
  onMoveSavedFilter,
  onMoveSavedFilterToEdge,
  onReorderSavedFilter,
  onDeleteSavedFilter,
  savedViewsDensity,
  onToggleSavedViewsDensity,
  matchSnippets
}) {
  const [draggedPresetId, setDraggedPresetId] = useState(null);
  const [openOverflowId, setOpenOverflowId] = useState(null);
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
        width: '256px',
        minWidth: '256px',
        maxWidth: '256px',
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}
    >
      <div style={{ padding: '0.55rem 0.7rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
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
            padding: '0.6rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: '600',
            fontSize: '0.85rem',
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

      <div style={{ padding: '0.55rem 0.7rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden' }}>
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
              paddingLeft: '2.25rem',
              paddingRight: '0.75rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
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
              e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-soft), inset 0 1px 2px rgba(0,0,0,0.05)';
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

      <div style={{ padding: '0.55rem 0.7rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
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

      {/* Tag filter — compact dropdown so it stays tidy as tags grow */}
      <div style={{ padding: '0.5rem 0.7rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
        <label
          htmlFor="tag-filter-select"
          style={{ display: 'block', margin: '0 0 0.3rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Filter by tag
        </label>
        {(!allTags || allTags.length === 0) ? (
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            No tags yet. Add tags while editing a note.
          </p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <select
              id="tag-filter-select"
              data-testid="tag-filter-select"
              value={selectedTagFilter || ''}
              onChange={(e) => setSelectedTagFilter(e.target.value || null)}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '0.4rem 0.55rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.78rem',
                fontWeight: 600,
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="">All tags ({allTags.length})</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>
            {selectedTagFilter && (
              <>
                <button
                  type="button"
                  data-testid={`tag-rename-${selectedTagFilter}`}
                  onClick={() => onRenameTagGlobally(selectedTagFilter)}
                  title={`Rename #${selectedTagFilter}`}
                  aria-label={`Rename tag ${selectedTagFilter}`}
                  style={{
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    padding: '0.32rem 0.4rem',
                    cursor: 'pointer',
                    lineHeight: 1
                  }}
                >
                  ✎
                </button>
                <button
                  type="button"
                  data-testid={`tag-delete-${selectedTagFilter}`}
                  onClick={() => onDeleteTagGlobally(selectedTagFilter)}
                  title={`Delete #${selectedTagFilter}`}
                  aria-label={`Delete tag ${selectedTagFilter}`}
                  style={{
                    border: '1px solid var(--clay-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--button-danger)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    padding: '0.32rem 0.4rem',
                    cursor: 'pointer',
                    lineHeight: 1
                  }}
                >
                  ✕
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Archive toggle */}
      {archivedCount > 0 && (
        <div style={{
          padding: '0.4rem 0.7rem',
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
              color: showArchived ? 'var(--highlight)' : 'var(--text-muted)',
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

      {/* Saved filter presets */}
      <div style={{ padding: '0.5rem 0.7rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Saved views</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <button
              type="button"
              data-testid="btn-toggle-saved-views-density"
              onClick={onToggleSavedViewsDensity}
              aria-label={`Switch saved views to ${savedViewsDensity === 'compact' ? 'expanded' : 'compact'} mode`}
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '999px',
                padding: '0.16rem 0.45rem',
                cursor: 'pointer'
              }}
            >
              {savedViewsDensity === 'compact' ? 'Compact' : 'Expanded'}
            </button>
            <button
              type="button"
              data-testid="btn-save-filter-preset"
              onClick={onSaveCurrentFilterPreset}
              disabled={!hasActiveFilter}
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                border: hasActiveFilter ? '1px solid var(--accent-border)' : '1px solid var(--border-color)',
                color: hasActiveFilter ? 'var(--accent-strong)' : 'var(--text-muted)',
                backgroundColor: hasActiveFilter ? 'var(--accent-soft)' : 'var(--bg-tertiary)',
                borderRadius: '999px',
                padding: '0.16rem 0.45rem',
                cursor: hasActiveFilter ? 'pointer' : 'not-allowed'
              }}
            >
              Save current
            </button>
          </div>
        </div>

        {savedFilters && savedFilters.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {savedFilters.map((preset) => (
              <div
                key={preset.id}
                data-testid={`saved-filter-row-${preset.id}`}
                draggable
                onDragStart={() => setDraggedPresetId(preset.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggedPresetId) {
                    onReorderSavedFilter(draggedPresetId, preset.id);
                  }
                  setDraggedPresetId(null);
                }}
                onDragEnd={() => setDraggedPresetId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  opacity: draggedPresetId === preset.id ? 0.65 : 1,
                  border: draggedPresetId === preset.id ? '1px dashed #94a3b8' : '1px solid transparent',
                  borderRadius: '0.45rem',
                  padding: '0.1rem'
                }}
              >
                <button
                  type="button"
                  data-testid={`filter-preset-${preset.id}`}
                  onClick={() => onApplySavedFilter(preset)}
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    border: preset.pinned ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                    backgroundColor: preset.pinned ? 'var(--highlight-soft)' : 'var(--bg-secondary)',
                    color: preset.pinned ? 'var(--text-secondary)' : 'var(--text-primary)',
                    borderRadius: '0.4rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '0.3rem 0.45rem',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {preset.pinned ? `★ ${preset.label}` : preset.label}
                </button>
                {savedViewsDensity === 'compact' && (
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      data-testid={`saved-view-overflow-btn-${preset.id}`}
                      aria-label={`More actions for saved view ${preset.label}`}
                      aria-haspopup="true"
                      aria-expanded={openOverflowId === preset.id ? 'true' : 'false'}
                      onClick={() => setOpenOverflowId(openOverflowId === preset.id ? null : preset.id)}
                      style={{
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        borderRadius: '0.35rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        padding: '0.18rem 0.4rem',
                        cursor: 'pointer',
                        lineHeight: 1
                      }}
                    >
                      ⋮
                    </button>
                    {openOverflowId === preset.id && (
                      <div
                        data-testid={`saved-view-overflow-menu-${preset.id}`}
                        role="menu"
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          zIndex: 100,
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '0.4rem',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                          minWidth: '140px',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '0.25rem'
                        }}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          data-testid={`overflow-pin-${preset.id}`}
                          onClick={() => { onTogglePinSavedFilter(preset.id); setOpenOverflowId(null); }}
                          style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.3rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer', borderRadius: '0.3rem' }}
                        >
                          {preset.pinned ? '☆ Unpin' : '★ Pin'}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          data-testid={`overflow-move-top-${preset.id}`}
                          onClick={() => { onMoveSavedFilterToEdge(preset.id, 'top'); setOpenOverflowId(null); }}
                          style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.3rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer', borderRadius: '0.3rem' }}
                        >
                          ⤒ Move to top
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          data-testid={`overflow-move-up-${preset.id}`}
                          onClick={() => { onMoveSavedFilter(preset.id, 'up'); setOpenOverflowId(null); }}
                          style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.3rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer', borderRadius: '0.3rem' }}
                        >
                          ↑ Move up
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          data-testid={`overflow-move-down-${preset.id}`}
                          onClick={() => { onMoveSavedFilter(preset.id, 'down'); setOpenOverflowId(null); }}
                          style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.3rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer', borderRadius: '0.3rem' }}
                        >
                          ↓ Move down
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          data-testid={`overflow-move-bottom-${preset.id}`}
                          onClick={() => { onMoveSavedFilterToEdge(preset.id, 'bottom'); setOpenOverflowId(null); }}
                          style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.3rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer', borderRadius: '0.3rem' }}
                        >
                          ⤓ Move to bottom
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          data-testid={`overflow-rename-${preset.id}`}
                          onClick={() => { onRenameSavedFilter(preset.id); setOpenOverflowId(null); }}
                          style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.3rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer', borderRadius: '0.3rem' }}
                        >
                          ✏ Rename
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          data-testid={`overflow-delete-${preset.id}`}
                          onClick={() => { onDeleteSavedFilter(preset.id); setOpenOverflowId(null); }}
                          style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.3rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer', color: 'var(--button-danger)', borderRadius: '0.3rem' }}
                        >
                          ✕ Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {savedViewsDensity === 'expanded' && (
                  <>
                    <button
                      type="button"
                      data-testid={`pin-filter-preset-${preset.id}`}
                      aria-label={preset.pinned ? `Unpin saved view ${preset.label}` : `Pin saved view ${preset.label}`}
                      onClick={() => onTogglePinSavedFilter(preset.id)}
                      style={{
                        border: '1px solid #fcd34d',
                        backgroundColor: preset.pinned ? 'var(--highlight)' : 'var(--highlight-soft)',
                        color: preset.pinned ? '#fff' : 'var(--text-secondary)',
                        borderRadius: '0.35rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.22rem 0.4rem',
                        cursor: 'pointer'
                      }}
                    >
                      {preset.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      type="button"
                      data-testid={`move-top-filter-preset-${preset.id}`}
                      aria-label={`Move saved view ${preset.label} to top`}
                      onClick={() => onMoveSavedFilterToEdge(preset.id, 'top')}
                      style={{
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        borderRadius: '0.35rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.22rem 0.36rem',
                        cursor: 'pointer'
                      }}
                    >
                      ⤒
                    </button>
                    <button
                      type="button"
                      data-testid={`move-up-filter-preset-${preset.id}`}
                      aria-label={`Move saved view ${preset.label} up`}
                      onClick={() => onMoveSavedFilter(preset.id, 'up')}
                      style={{
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        borderRadius: '0.35rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.22rem 0.36rem',
                        cursor: 'pointer'
                      }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      data-testid={`move-down-filter-preset-${preset.id}`}
                      aria-label={`Move saved view ${preset.label} down`}
                      onClick={() => onMoveSavedFilter(preset.id, 'down')}
                      style={{
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        borderRadius: '0.35rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.22rem 0.36rem',
                        cursor: 'pointer'
                      }}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      data-testid={`move-bottom-filter-preset-${preset.id}`}
                      aria-label={`Move saved view ${preset.label} to bottom`}
                      onClick={() => onMoveSavedFilterToEdge(preset.id, 'bottom')}
                      style={{
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        borderRadius: '0.35rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.22rem 0.36rem',
                        cursor: 'pointer'
                      }}
                    >
                      ⤓
                    </button>
                    <button
                      type="button"
                      data-testid={`rename-filter-preset-${preset.id}`}
                      aria-label={`Rename saved view ${preset.label}`}
                      onClick={() => onRenameSavedFilter(preset.id)}
                      style={{
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        borderRadius: '0.35rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.22rem 0.4rem',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      data-testid={`delete-filter-preset-${preset.id}`}
                      aria-label={`Delete saved view ${preset.label}`}
                      onClick={() => onDeleteSavedFilter(preset.id)}
                      style={{
                        border: '1px solid #fecaca',
                        backgroundColor: 'transparent',
                        color: 'var(--button-danger)',
                        borderRadius: '0.35rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.22rem 0.4rem',
                        cursor: 'pointer'
                      }}
                    >
                      x
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>No saved views yet.</p>
        )}
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
                padding: '0.45rem 0.7rem',
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
                    {topic.pinned && <span style={{ color: 'var(--highlight)' }}><PinIcon filled /></span>}
                    <h3 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.08rem', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.95rem' }}>{topic.title}</h3>
                  </div>
                  {matchSnippets && matchSnippets[topic.id] && (() => {
                    const { before, match, after } = matchSnippets[topic.id];
                    return (
                      <p
                        data-testid={`search-snippet-${topic.id}`}
                        style={{
                          margin: '0.2rem 0 0 0',
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.5,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'clip'
                        }}
                      >
                        {before}<mark style={{
                          backgroundColor: 'var(--highlight-soft)',
                          color: 'var(--text-primary)',
                          borderRadius: '0.2rem',
                          padding: '0 0.1rem',
                          fontWeight: 700
                        }}>{match}</mark>{after}
                      </p>
                    );
                  })()}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      backgroundColor: selectedTopic?.id === topic.id ? 'var(--accent-soft)' : 'var(--bg-tertiary)',
                      color: selectedTopic?.id === topic.id ? 'var(--accent-strong)' : 'var(--text-tertiary)',
                      padding: '0.25rem 0.5rem', 
                      borderRadius: 'var(--radius-full)',
                      fontWeight: '500',
                      boxShadow: 'var(--shadow-xs)'
                    }}>{topic.category}</span>
                    {topic.tags && topic.tags.map(tag => (
                      <span key={tag} style={{ 
                        fontSize: '0.7rem', 
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-tertiary)',
                        border: '1px solid var(--border-color)',
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
                    style={{ color: topic.pinned ? 'var(--highlight)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem' }}
                    aria-label={topic.pinned ? `Unpin topic ${topic.title}` : `Pin topic ${topic.title}`}
                    title={topic.pinned ? 'Unpin' : 'Pin to top'}
                  >
                    <PinIcon filled={topic.pinned} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleArchiveTopic(topic.id); }}
                    style={{ color: topic.archived ? 'var(--highlight)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem' }}
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
