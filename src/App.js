import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import adapter from './lib/adapter';
import { renderMarkdown } from './lib/markdown';
import { isConfigured, onAuthChange, signInWithGoogle, signOut, signInWithEmail, createUserWithEmail } from './lib/firebaseClient';
import Modal from './components/Modal';
import Preview from './components/Preview';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Editor from './components/Editor';
import AuthGate from './components/AuthGate';
import LinkPreview from './components/LinkPreview';
import { BookIcon, EditIcon, SaveIcon, TemplateIcon, CheckIcon, ChevronDownIcon } from './components/icons';
import useTopics from './hooks/useTopics';
import useStorage from './hooks/useStorage';
import useSearch from './hooks/useSearch';
import useWorkspaceInsights from './hooks/useWorkspaceInsights';
import useUndoRedo from './hooks/useUndoRedo';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import useTheme from './hooks/useTheme';
import './theme.css';

// Lazy-loaded export functions (only loaded when exporting) - saves ~40KB initial bundle
const loadExportFunctions = () => import('./lib/export');

// --- Helper Styles ---
const srOnlyStyles = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0
};

const skipLinkBaseStyles = {
  position: 'absolute',
  top: '1rem',
  left: '1rem',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  fontWeight: 600,
  zIndex: 1100,
  transform: 'translateY(-150%)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
};

const textColorMap = {
  slate: '#334155',
  indigo: '#4338ca',
  emerald: '#047857',
  amber: '#b45309',
  rose: '#be123c',
  sky: '#0369a1'
};

// --- Main App ---
const App = () => {
  // Seed data
  const seedTopics = [
    {
      id: 1,
      title: 'Getting Started',
      category: 'Tutorial',
      content: '# Welcome to Your Personal Study Note\n\nThis is your personal space for learning and note-taking.\n\n## Features:\n- **Rich Text Editing**: Write notes with markdown support\n- **Categories & Tags**: Organize topics with categories and tags\n- **Pin Notes**: Pin important notes to the top of your list\n- **Archive**: Archive old notes to keep your list clean\n- **Templates**: Use pre-made templates for common note types\n- **Note Linking**: Link to other notes using [[Note Title]] syntax\n- **Search**: Find topics quickly by title or content\n- **Images & Links**: Add images and hyperlinks to your notes\n- **Undo/Redo**: Use Cmd/Ctrl+Z to undo, Cmd/Ctrl+Shift+Z to redo\n- **Keyboard Shortcuts**: Cmd/Ctrl+B for bold, Cmd/Ctrl+I for italic, Cmd/Ctrl+K for links\n- **Export**: Download notes as Markdown, PDF, or Word\n\n## How to Use:\n1. Click the **+ New Topic** button to create a new study topic\n2. Select a topic from the left sidebar to view or edit\n3. Use markdown formatting or the toolbar for rich text\n4. Press Cmd/Ctrl+S to save your changes\n5. Click any link to preview it on the right!\n\n## Note Linking:\nLink to other notes like this: [[Getting Started]]\n\nHappy studying!',
      lastModified: new Date().toISOString(),
      pinned: true
    }
  ];

  // Custom hooks
  const { topics, selectedTopic, setSelectedTopic, addTopic, updateTopic, deleteTopic, loadTopics: setTopicsFromStorage } = useTopics(seedTopics);
  
  const {
    isInitialized,
    canAutoSave,
    statusMessage,
    isSyncing,
    lastSyncTime,
    saveTopics,
    removeTopicNow
  } = useStorage((newTopics) => {
    setTopicsFromStorage(newTopics);
  });

  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, categories, filteredTopics, matchSnippets } = useSearch(topics);
  const workspaceInsights = useWorkspaceInsights(topics);
  const { theme, toggleTheme } = useTheme();

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState(null);
  
  // Undo/redo for current note
  const undoRedo = useUndoRedo(editContent);

  // Modal state
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // UI state
  const [statusAnnouncement, setStatusAnnouncement] = useState('');
  const [isSkipLinkFocused, setIsSkipLinkFocused] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Archive state
  const [showArchived, setShowArchived] = useState(false);
  const [savedFilters, setSavedFilters] = useState(() => {
    try {
      const raw = localStorage.getItem('studyApp.savedFilters.v1');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });
  const [savedViewsDensity, setSavedViewsDensity] = useState(() => {
    try {
      const raw = localStorage.getItem('studyApp.savedViewsDensity.v1');
      return raw === 'compact' ? 'compact' : 'expanded';
    } catch (e) {
      return 'expanded';
    }
  });
  // Template state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [commandHighlightIndex, setCommandHighlightIndex] = useState(0);
  
  // Workspace insights collapsed state
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(false);
  
  // Auto-save indicator state
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'
  
  // Auth state
  const [authUser, setAuthUser] = useState(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [authEmailError, setAuthEmailError] = useState('');
  const firebaseEnabled = isConfigured();
  // In tests we bypass the auth gate so feature tests can render the app.
  const requireAuth = firebaseEnabled && process.env.NODE_ENV !== 'test';

  // Refs
  const topicRefs = useRef(new Map());
  const topicListRef = useRef(null);
  const newTopicButtonRef = useRef(null);
  const newTopicTitleRef = useRef(null);
  const newTopicCategoryRef = useRef(null);
  const imageUrlInputRef = useRef(null);
  const linkUrlInputRef = useRef(null);
  const resetConfirmButtonRef = useRef(null);
  const commandPaletteInputRef = useRef(null);
  const editTextareaRef = useRef(null);
  const lastSelectionRef = useRef({ start: 0, end: 0 });
  const previewContentRef = useRef(null);

  const isModalOpen = showNewTopicModal || showImageModal || showLinkModal || showResetConfirm || showCommandPalette;

  // --- IDs for accessibility ---
  const newTopicHeadingId = 'modal-new-topic-title';
  const imageModalHeadingId = 'modal-image-title';
  const linkModalHeadingId = 'modal-link-title';
  const resetModalHeadingId = 'modal-reset-title';
  const resetModalDescriptionId = 'modal-reset-description';
  const resetButtonDescriptionId = 'reset-button-description';
  const imageUrlHelpId = 'image-url-help';
  const linkUrlHelpId = 'link-url-help';
  const linkTextHelpId = 'link-text-help';
  const newTopicCancelDescriptionId = 'modal-new-topic-cancel';
  const imageModalCancelDescriptionId = 'modal-image-cancel';
  const linkModalCancelDescriptionId = 'modal-link-cancel';
  const resetModalCancelDescriptionId = 'modal-reset-cancel';
  const topicsListboxId = 'topics-listbox';
  const searchHelpId = 'search-help';
  const topicCountLabelId = 'topic-count-label';
  const categoryFilterLabelId = 'category-filter-label';
  const categoryFilterSelectId = 'category-filter-select';
  const categoryFilterHelpId = 'category-filter-help';
  const textColorMenuId = 'text-color-menu';
  const textColorHelpId = 'text-color-help';

  const activeTopicOptionId = selectedTopic ? `topic-option-${selectedTopic.id}` : undefined;

  const textColorOptions = useMemo(() => ([
    { key: 'slate', label: 'Slate', hex: textColorMap.slate },
    { key: 'indigo', label: 'Indigo', hex: textColorMap.indigo },
    { key: 'emerald', label: 'Emerald', hex: textColorMap.emerald },
    { key: 'amber', label: 'Amber', hex: textColorMap.amber },
    { key: 'rose', label: 'Rose', hex: textColorMap.rose },
    { key: 'sky', label: 'Sky', hex: textColorMap.sky }
  ]), []);

  // --- Focus management ---
  const focusTopicById = useCallback((id) => {
    const node = topicRefs.current.get(id);
    if (node && typeof node.focus === 'function') {
      node.focus();
    }
  }, []);

  const focusTopicList = useCallback(() => {
    if (topicListRef.current && typeof topicListRef.current.focus === 'function') {
      topicListRef.current.focus();
    }
  }, []);

  // --- Keyboard shortcuts ---
  const keyboardHandlers = useMemo(() => ({
    commandPalette: () => {
      setCommandQuery('');
      setCommandHighlightIndex(0);
      setShowCommandPalette(true);
    },
    bold: () => isEditing && applyMarkdownFormatting('bold'),
    italic: () => isEditing && applyMarkdownFormatting('italic'),
    underline: () => isEditing && applyMarkdownFormatting('underline'),
    link: () => isEditing && setShowLinkModal(true),
    image: () => isEditing && setShowImageModal(true),
    undo: () => {
      if (isEditing && undoRedo.canUndo) {
        const newValue = undoRedo.undo();
        setEditContent(newValue);
      }
    },
    redo: () => {
      if (isEditing && undoRedo.canRedo) {
        const newValue = undoRedo.redo();
        setEditContent(newValue);
      }
    },
    save: () => isEditing && handleSave()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [isEditing, undoRedo]);

  useKeyboardShortcuts(keyboardHandlers, !isModalOpen);

  // --- Event handlers ---
  const closeNewTopicModal = useCallback(() => {
    setShowNewTopicModal(false);
  }, []);

  const closeImageModal = useCallback(() => {
    setShowImageModal(false);
    setImageUrl('');
  }, []);

  const closeLinkModal = useCallback(() => {
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkTitle('');
  }, []);

  const closeResetModal = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  const closeCommandPalette = useCallback(() => {
    setShowCommandPalette(false);
    setCommandQuery('');
    setCommandHighlightIndex(0);
  }, []);

  const handleAddTopic = () => {
    if (newTopicTitle.trim()) {
      const newTopic = {
        id: Date.now(),
        title: newTopicTitle,
        category: newTopicCategory || 'Uncategorized',
        content: '',
        lastModified: new Date().toISOString()
      };
      addTopic(newTopic);
      setNewTopicTitle('');
      setNewTopicCategory('');
      setShowNewTopicModal(false);
      setIsEditing(true);
      setEditContent('');
      undoRedo.reset('');
    }
  };

  const handleDeleteTopic = (id) => {
    if (window.confirm('Delete this topic?')) {
      const currentIndex = filteredTopics.findIndex(t => t.id === id);
      const nextCandidate = filteredTopics[currentIndex + 1] || filteredTopics[currentIndex - 1] || null;
      
      deleteTopic(id);
      // Write the deletion through to the cloud immediately (don't rely on the
      // debounced sync) so it can't be lost or resurrected on next load.
      removeTopicNow(id);

      if (selectedTopic?.id === id) {
        setIsEditing(false);
        setPreviewUrl('');
      }

      requestAnimationFrame(() => {
        if (nextCandidate) {
          focusTopicById(nextCandidate.id);
        } else {
          focusTopicList();
        }
      });
    }
  };

  // Toggle pin status
  const handleTogglePin = (id) => {
    const topic = topics.find(t => t.id === id);
    if (topic) {
      updateTopic(id, { pinned: !topic.pinned });
    }
  };

  // Archive/restore topic
  const handleArchiveTopic = (id) => {
    const topic = topics.find(t => t.id === id);
    if (topic) {
      updateTopic(id, { archived: !topic.archived });
    }
  };

  // Get archived count for sidebar
  const archivedCount = topics.filter(t => t.archived).length;

  const hasActiveFilter = selectedCategory !== 'All' || Boolean(selectedTagFilter) || showArchived;

  const buildFilterPresetLabel = useCallback(() => {
    const parts = [];
    if (selectedCategory !== 'All') {
      parts.push(selectedCategory);
    }
    if (selectedTagFilter) {
      parts.push(`#${selectedTagFilter}`);
    }
    if (showArchived) {
      parts.push('Archived');
    }
    return parts.length ? parts.join(' • ') : 'Current View';
  }, [selectedCategory, selectedTagFilter, showArchived]);

  const handleSaveCurrentFilterPreset = useCallback(() => {
    const generatedLabel = buildFilterPresetLabel();
    const customName = window.prompt('Name this saved view (optional)', generatedLabel);
    if (customName === null) {
      return;
    }

    const preset = {
      id: String(Date.now()),
      label: customName.trim() || generatedLabel,
      category: selectedCategory,
      tag: selectedTagFilter,
      showArchived,
      pinned: false
    };
    setSavedFilters(prev => [preset, ...prev].slice(0, 8));
  }, [buildFilterPresetLabel, selectedCategory, selectedTagFilter, showArchived]);

  const handleApplySavedFilter = useCallback((preset) => {
    if (!preset) return;
    setSelectedCategory(preset.category || 'All');
    setSelectedTagFilter(preset.tag || null);
    setShowArchived(Boolean(preset.showArchived));
  }, [setSelectedCategory]);

  const handleDeleteSavedFilter = useCallback((id) => {
    setSavedFilters(prev => prev.filter(preset => preset.id !== id));
  }, []);

  const handleRenameSavedFilter = useCallback((id) => {
    const target = savedFilters.find(preset => preset.id === id);
    if (!target) return;

    const renamed = window.prompt('Rename saved view', target.label || 'Saved View');
    if (renamed === null) return;

    const nextLabel = renamed.trim();
    if (!nextLabel) return;

    setSavedFilters(prev => prev.map(preset => (
      preset.id === id ? { ...preset, label: nextLabel } : preset
    )));
  }, [savedFilters]);

  const handleTogglePinSavedFilter = useCallback((id) => {
    setSavedFilters((prev) => {
      const currentIndex = prev.findIndex((preset) => preset.id === id);
      if (currentIndex === -1) return prev;

      const current = prev[currentIndex];
      const toggled = { ...current, pinned: !Boolean(current.pinned) };
      const withoutCurrent = prev.filter((preset) => preset.id !== id);

      if (toggled.pinned) {
        const firstUnpinnedIndex = withoutCurrent.findIndex((preset) => !preset.pinned);
        if (firstUnpinnedIndex === -1) {
          return [...withoutCurrent, toggled];
        }
        return [
          ...withoutCurrent.slice(0, firstUnpinnedIndex),
          toggled,
          ...withoutCurrent.slice(firstUnpinnedIndex)
        ];
      }

      const lastPinnedIndex = withoutCurrent.reduce((acc, preset, index) => (preset.pinned ? index : acc), -1);
      const insertIndex = lastPinnedIndex + 1;
      return [
        ...withoutCurrent.slice(0, insertIndex),
        toggled,
        ...withoutCurrent.slice(insertIndex)
      ];
    });
  }, []);

  const handleMoveSavedFilter = useCallback((id, direction) => {
    setSavedFilters((prev) => {
      const index = prev.findIndex((preset) => preset.id === id);
      if (index === -1) return prev;

      const nextIndex = direction === 'up' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;

      const list = [...prev];
      const [item] = list.splice(index, 1);
      list.splice(nextIndex, 0, item);
      return list;
    });
  }, []);

  const handleMoveSavedFilterToEdge = useCallback((id, edge) => {
    setSavedFilters((prev) => {
      const index = prev.findIndex((preset) => preset.id === id);
      if (index === -1) return prev;

      const list = [...prev];
      const [item] = list.splice(index, 1);
      if (edge === 'top') {
        list.unshift(item);
      } else {
        list.push(item);
      }
      return list;
    });
  }, []);

  const handleReorderSavedFilter = useCallback((draggedId, targetId) => {
    if (!draggedId || !targetId || draggedId === targetId) {
      return;
    }

    setSavedFilters((prev) => {
      const fromIndex = prev.findIndex((preset) => preset.id === draggedId);
      const toIndex = prev.findIndex((preset) => preset.id === targetId);
      if (fromIndex === -1 || toIndex === -1) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  // All unique tags across all topics (for filter chips)
  const allTags = useMemo(() => {
    const tagSet = new Set();
    topics.forEach(t => (t.tags || []).forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [topics]);

  const handleRenameTagGlobally = useCallback((oldTag) => {
    if (!oldTag) return;
    const proposed = window.prompt('Rename tag', oldTag);
    if (typeof proposed !== 'string') return;

    const nextTag = proposed.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!nextTag || nextTag === oldTag) return;

    topics.forEach((topic) => {
      if (!Array.isArray(topic.tags) || !topic.tags.includes(oldTag)) return;
      const nextTags = Array.from(new Set(topic.tags.map(tag => (tag === oldTag ? nextTag : tag))));
      updateTopic(topic.id, { tags: nextTags, lastModified: new Date().toISOString() });
    });

    if (selectedTagFilter === oldTag) {
      setSelectedTagFilter(nextTag);
    }
  }, [selectedTagFilter, topics, updateTopic]);

  const handleDeleteTagGlobally = useCallback((tagToDelete) => {
    if (!tagToDelete) return;
    const confirmed = window.confirm(`Delete #${tagToDelete} from all notes?`);
    if (!confirmed) return;

    topics.forEach((topic) => {
      if (!Array.isArray(topic.tags) || !topic.tags.includes(tagToDelete)) return;
      const nextTags = topic.tags.filter(tag => tag !== tagToDelete);
      updateTopic(topic.id, { tags: nextTags, lastModified: new Date().toISOString() });
    });

    if (selectedTagFilter === tagToDelete) {
      setSelectedTagFilter(null);
    }
  }, [selectedTagFilter, topics, updateTopic]);

  // Filter topics based on archive state + optional tag filter
  const visibleFilteredTopics = useMemo(() => {
    const base = showArchived ? filteredTopics : filteredTopics.filter(t => !t.archived);
    if (!selectedTagFilter) return base;
    return base.filter(t => (t.tags || []).includes(selectedTagFilter));
  }, [showArchived, filteredTopics, selectedTagFilter]);

  useEffect(() => {
    try {
      localStorage.setItem('studyApp.savedFilters.v1', JSON.stringify(savedFilters));
    } catch (e) {
      // no-op when storage is unavailable
    }
  }, [savedFilters]);

  useEffect(() => {
    try {
      localStorage.setItem('studyApp.savedViewsDensity.v1', savedViewsDensity);
    } catch (e) {
      // no-op when storage is unavailable
    }
  }, [savedViewsDensity]);

  const handleToggleSavedViewsDensity = useCallback(() => {
    setSavedViewsDensity((current) => (current === 'expanded' ? 'compact' : 'expanded'));
  }, []);

  // Note templates
  const noteTemplates = [
    { id: 'blank', name: 'Blank Note', content: '' },
    { id: 'meeting', name: 'Meeting Notes', content: '# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n- \n\n## Discussion\n\n## Action Items\n- [ ] \n\n## Next Steps\n' },
    { id: 'study', name: 'Study Guide', content: '# Study Guide: [Topic]\n\n## Key Concepts\n1. \n2. \n3. \n\n## Definitions\n- **Term**: Definition\n\n## Examples\n\n## Practice Questions\n1. \n\n## Summary\n' },
    { id: 'project', name: 'Project Plan', content: '# Project: [Name]\n\n## Overview\n\n## Goals\n- \n\n## Timeline\n| Phase | Start | End | Status |\n|-------|-------|-----|--------|\n| | | | |\n\n## Tasks\n- [ ] \n\n## Resources\n- \n\n## Notes\n' },
    { id: 'journal', name: 'Daily Journal', content: '# Journal Entry - ' + new Date().toLocaleDateString() + '\n\n## Today I...\n\n## Learned\n\n## Grateful for\n1. \n2. \n3. \n\n## Tomorrow I will...\n' },
    { id: 'review', name: 'Book/Article Review', content: '# Review: [Title]\n\n**Author:** \n**Date Read:** \n**Rating:** ⭐⭐⭐⭐⭐\n\n## Summary\n\n## Key Takeaways\n1. \n2. \n3. \n\n## Favorite Quotes\n> \n\n## My Thoughts\n' }
  ];

  const handleApplyTemplate = (template) => {
    if (selectedTopic && isEditing) {
      const newContent = template.content;
      setEditContent(newContent);
      undoRedo.pushHistory(newContent);
      setShowTemplateModal(false);
    }
  };

  const startEditing = () => {
    setEditContent(selectedTopic.content);
    undoRedo.reset(selectedTopic.content);
    setEditTags(selectedTopic.tags || []);
    setTagInput('');
    setIsEditing(true);
    setPreviewUrl('');
  };

  const handleSave = () => {
    setSaveStatus('saving');
    updateTopic(selectedTopic.id, {
      content: editContent,
      tags: editTags,
      lastModified: new Date().toISOString()
    });
    setIsEditing(false);
    setTagInput('');
    setStatusAnnouncement('Changes saved');
    setTimeout(() => setSaveStatus('saved'), 500);
  };

  const commandActions = useMemo(() => {
    const actions = [
      {
        id: 'new-topic',
        label: 'New topic',
        shortcut: 'Cmd/Ctrl + N',
        keywords: 'create add note topic',
        run: () => setShowNewTopicModal(true)
      },
      {
        id: 'edit-topic',
        label: 'Edit selected topic',
        shortcut: 'E',
        keywords: 'edit note content',
        run: () => {
          if (selectedTopic && !isEditing) {
            startEditing();
          }
        }
      },
      {
        id: 'save-topic',
        label: 'Save changes',
        shortcut: 'Cmd/Ctrl + S',
        keywords: 'save persist write',
        run: () => {
          if (selectedTopic && isEditing) {
            handleSave();
          }
        }
      },
      {
        id: 'toggle-theme',
        label: 'Toggle theme',
        shortcut: 'T',
        keywords: 'dark light mode',
        run: () => toggleTheme()
      },
      {
        id: 'focus-search',
        label: 'Focus topic search',
        shortcut: '/',
        keywords: 'search find filter',
        run: () => {
          const input = document.getElementById('topic-search');
          if (input && typeof input.focus === 'function') {
            input.focus();
          }
        }
      },
      {
        id: 'toggle-archive',
        label: showArchived ? 'Hide archived topics' : 'Show archived topics',
        shortcut: 'A',
        keywords: 'archive restore hidden',
        run: () => setShowArchived(prev => !prev)
      },
      {
        id: 'insert-link',
        label: 'Insert link',
        shortcut: 'Cmd/Ctrl + Shift + K',
        keywords: 'markdown hyperlink url',
        run: () => {
          if (isEditing) {
            setShowLinkModal(true);
          }
        }
      },
      {
        id: 'insert-image',
        label: 'Insert image',
        shortcut: 'Cmd/Ctrl + Shift + I',
        keywords: 'image upload media',
        run: () => {
          if (isEditing) {
            setShowImageModal(true);
          }
        }
      }
    ];

    return actions.filter(action => {
      if (action.id === 'save-topic') return selectedTopic && isEditing;
      if (action.id === 'edit-topic') return selectedTopic && !isEditing;
      if (action.id === 'insert-link' || action.id === 'insert-image') return isEditing;
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, selectedTopic, showArchived, toggleTheme]);

  const filteredCommandActions = useMemo(() => {
    const q = commandQuery.trim().toLowerCase();
    if (!q) return commandActions;
    return commandActions.filter(action => `${action.label} ${action.keywords}`.toLowerCase().includes(q));
  }, [commandActions, commandQuery]);

  const executeCommandAction = useCallback((action) => {
    if (!action || typeof action.run !== 'function') return;
    closeCommandPalette();
    requestAnimationFrame(() => {
      action.run();
    });
  }, [closeCommandPalette]);

  const handleCommandPaletteInputKeyDown = useCallback((event) => {
    if (!filteredCommandActions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCommandHighlightIndex(prev => (prev + 1) % filteredCommandActions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCommandHighlightIndex(prev => (prev - 1 + filteredCommandActions.length) % filteredCommandActions.length);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      executeCommandAction(filteredCommandActions[commandHighlightIndex] || filteredCommandActions[0]);
    }
  }, [commandHighlightIndex, executeCommandAction, filteredCommandActions]);

  useEffect(() => {
    if (!showCommandPalette) {
      return;
    }
    setCommandHighlightIndex(0);
  }, [commandQuery, filteredCommandActions.length, showCommandPalette]);

  // Auto-save indicator - track unsaved changes
  useEffect(() => {
    if (isEditing && selectedTopic && editContent !== selectedTopic.content) {
      setSaveStatus('unsaved');
    }
  }, [editContent, isEditing, selectedTopic]);

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      const md = `\n![Image](${imageUrl})\n`;
      const newContent = editContent + md;
      setEditContent(newContent);
      undoRedo.pushHistory(newContent);
      setImageUrl('');
      setShowImageModal(false);
    }
  };

  const handleAddLink = () => {
    if (linkUrl.trim()) {
      const url = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;
      const title = linkTitle.trim() || url;
      const md = `\n[${title}](${url})\n`;
      const newContent = editContent + md;
      setEditContent(newContent);
      undoRedo.pushHistory(newContent);
      setLinkUrl('');
      setLinkTitle('');
      setShowLinkModal(false);
    }
  };

  const handleContentClick = (e) => {
    // Check if clicked element is a link or inside a link
    let linkElement = e.target;
    while (linkElement && linkElement.tagName !== 'A' && linkElement.tagName !== 'a') {
      linkElement = linkElement.parentElement;
    }
    
    if (linkElement && (linkElement.tagName === 'A' || linkElement.tagName === 'a')) {
      e.preventDefault();
      e.stopPropagation();
      const href = linkElement.getAttribute('href');
      const noteId = linkElement.getAttribute('data-note-id');
      
      // Handle note links (internal linking)
      if (noteId) {
        const linkedTopic = topics.find(t => t.id === parseInt(noteId, 10));
        if (linkedTopic) {
          setSelectedTopic(linkedTopic);
          setPreviewUrl('');
          setIsEditing(false);
        }
        return;
      }
      
      // Handle external links - show preview
      if (href && !href.startsWith('#') && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//'))) {
        // Ensure URL has protocol
        const urlToPreview = href.startsWith('//') ? `https:${href}` : 
                           href.startsWith('http') ? href : `https://${href}`;
        setPreviewUrl(urlToPreview);
      }
    }
  };

  const handleExportMarkdown = async () => {
    const { exportAsMarkdown } = await loadExportFunctions();
    exportAsMarkdown(selectedTopic);
    setShowExportMenu(false);
    setStatusAnnouncement('Topic exported as Markdown');
  };

  const handleExportPDF = async () => {
    if (previewContentRef.current) {
      const { exportAsPDF } = await loadExportFunctions();
      const success = await exportAsPDF(selectedTopic, previewContentRef.current);
      setShowExportMenu(false);
      setStatusAnnouncement(success ? 'Topic exported as PDF' : 'PDF export failed');
    }
  };

  const handleExportWord = async () => {
    const { exportAsWord } = await loadExportFunctions();
    const success = exportAsWord(selectedTopic);
    setShowExportMenu(false);
    setStatusAnnouncement(success ? 'Topic exported as Word document' : 'Word export failed');
  };

  const handleShare = async () => {
    if (!selectedTopic) return;
    
    const shareData = {
      title: selectedTopic.title,
      text: `${selectedTopic.title}\n\nCategory: ${selectedTopic.category}\n\n${selectedTopic.content}`,
    };
    
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        setStatusAnnouncement('Shared successfully');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.text);
        setStatusAnnouncement('Content copied to clipboard');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        // User didn't cancel, try clipboard fallback
        try {
          await navigator.clipboard.writeText(shareData.text);
          setStatusAnnouncement('Content copied to clipboard');
        } catch {
          setStatusAnnouncement('Share failed');
        }
      }
    }
    setShowExportMenu(false);
  };

  const handleExportAll = async () => {
    const { exportAllAsJSON } = await loadExportFunctions();
    exportAllAsJSON(topics);
    setShowExportMenu(false);
    setStatusAnnouncement('All topics exported as JSON');
  };

  // Auth handlers. Cloud data loads automatically once auth resolves
  // (handled by useStorage), so sign-in just needs to authenticate.
  const handleSignOut = async () => {
    try {
      await signOut();
      setStatusAnnouncement('Signed out successfully');
    } catch (e) {
      console.warn('Sign out failed', e);
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    setAuthEmailError('');
    try {
      await signInWithGoogle();
      setStatusAnnouncement('Signed in successfully');
    } catch (e) {
      setAuthEmailError(e?.message || 'Google sign in failed');
    }
  }, []);

  const handleEmailSignIn = useCallback(async (email, password) => {
    setAuthEmailError('');
    const cleanEmail = (email || '').trim();
    if (!cleanEmail || !password) {
      setAuthEmailError('Please enter email and password');
      return;
    }
    try {
      await signInWithEmail(cleanEmail, password);
      setStatusAnnouncement('Signed in successfully');
    } catch (err) {
      try {
        await createUserWithEmail(cleanEmail, password);
        setStatusAnnouncement('Account created and signed in');
      } catch (err2) {
        setAuthEmailError(err2?.message || err?.message || 'Sign in failed');
      }
    }
  }, []);

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { importFromJSON } = await loadExportFunctions();
      const imported = await importFromJSON(file);
      // Merge imported topics with existing ones (assign new IDs to avoid conflicts)
      const maxId = topics.length > 0 ? Math.max(...topics.map(t => t.id)) : 0;
      const mergedTopics = [
        ...topics,
        ...imported.map((t, index) => ({ ...t, id: maxId + index + 1 }))
      ];
      setTopicsFromStorage(mergedTopics);
      setStatusAnnouncement(`Imported ${imported.length} topics`);
    } catch (error) {
      setStatusAnnouncement(`Import failed: ${error.message}`);
    }
    // Reset input
    event.target.value = '';
  };

  const handleTopicListKeyDown = (event) => {
    if (!filteredTopics.length) return;

    const { key } = event;
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
      return;
    }

    event.preventDefault();

    const currentIndex = selectedTopic
      ? filteredTopics.findIndex(t => t.id === selectedTopic.id)
      : -1;

    let nextIndex = currentIndex;
    if (key === 'ArrowDown') {
      nextIndex = currentIndex < filteredTopics.length - 1 ? currentIndex + 1 : 0;
    } else if (key === 'ArrowUp') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : filteredTopics.length - 1;
    } else if (key === 'Home') {
      nextIndex = 0;
    } else if (key === 'End') {
      nextIndex = filteredTopics.length - 1;
    }

    const nextTopic = filteredTopics[nextIndex];
    if (nextTopic && nextTopic.id !== selectedTopic?.id) {
      setSelectedTopic(nextTopic);
      setPreviewUrl('');
      setIsEditing(false);
      focusTopicById(nextTopic.id);
    }
  };

  const updateSelectionRef = useCallback(() => {
    const textarea = editTextareaRef.current;
    if (!textarea) return;
    lastSelectionRef.current = {
      start: typeof textarea.selectionStart === 'number' ? textarea.selectionStart : 0,
      end: typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : 0
    };
  }, []);

  const applyMarkdownFormatting = (format, options = {}) => {
    const textarea = editTextareaRef.current;
    if (!textarea) return;

    if (document.activeElement !== textarea) {
      textarea.focus();
    }

    let start = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : lastSelectionRef.current.start;
    let end = typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : lastSelectionRef.current.end;

    if (start == null || end == null) {
      start = end = textarea.value?.length ?? 0;
    }

    const value = textarea.value ?? '';
    const selected = value.slice(start, end);

    let newValue = value;
    let newSelectionStart = start;
    let newSelectionEnd = end;

    const insertBlock = (prefix, textValue, suffix = '') => {
      const before = value.slice(0, start);
      const after = value.slice(end);
      newValue = `${before}${prefix}${textValue}${suffix}${after}`;
      newSelectionStart = start + prefix.length;
      newSelectionEnd = newSelectionStart + textValue.length;
    };

    const wrapSelection = (prefix, suffix, fallback) => {
      const textValue = selected || fallback;
      insertBlock(prefix, textValue, suffix);
    };

    switch (format) {
      case 'bold':
        wrapSelection('**', '**', 'bold text');
        break;
      case 'italic':
        wrapSelection('*', '*', 'italic text');
        break;
      case 'underline':
        wrapSelection('++', '++', 'underlined text');
        break;
      case 'code':
        wrapSelection('`', '`', 'inline code');
        break;
      case 'heading': {
        const textValue = selected || 'Heading';
        const isLineStart = start === 0 || value[start - 1] === '\n';
        const prefix = isLineStart ? '# ' : '\n# ';
        const suffix = selected ? '' : '\n';
        insertBlock(prefix, textValue, suffix);
        break;
      }
      case 'unordered-list': {
        const placeholder = 'List item';
        const textValue = selected || placeholder;
        const isLineStart = start === 0 || value[start - 1] === '\n';
        const prefix = isLineStart ? '' : '\n';
        const suffix = selected ? '' : '\n';
        const content = textValue
          .split('\n')
          .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return '- ';
            return line.startsWith('- ') ? line : `- ${trimmed}`;
          })
          .join('\n');
        const before = value.slice(0, start);
        const after = value.slice(end);
        newValue = `${before}${prefix}${content}${suffix}${after}`;
        if (selected) {
          newSelectionStart = start + prefix.length;
          newSelectionEnd = newSelectionStart + content.length;
        } else {
          newSelectionStart = start + prefix.length + 2;
          newSelectionEnd = newSelectionStart + placeholder.length;
        }
        break;
      }
      case 'color': {
        const colorKey = options.colorKey;
        if (!colorKey || !textColorMap[colorKey]) {
          return;
        }
        const placeholder = 'colored text';
        const textValue = selected || placeholder;
        const prefix = `{{color:${colorKey}|`;
        const suffix = '}}';
        insertBlock(prefix, textValue, suffix);
        break;
      }
      case 'ordered-list': {
        const placeholder = 'List item';
        const textValue = selected || placeholder;
        const isLineStart = start === 0 || value[start - 1] === '\n';
        const prefix = isLineStart ? '' : '\n';
        const suffix = selected ? '' : '\n';
        const content = textValue
          .split('\n')
          .map((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) return `${index + 1}. `;
            const normalized = trimmed.replace(/^\d+\.\s+/, '');
            return `${index + 1}. ${normalized}`;
          })
          .join('\n');
        const before = value.slice(0, start);
        const after = value.slice(end);
        newValue = `${before}${prefix}${content}${suffix}${after}`;
        if (selected) {
          newSelectionStart = start + prefix.length;
          newSelectionEnd = newSelectionStart + content.length;
        } else {
          newSelectionStart = start + prefix.length + 3;
          newSelectionEnd = newSelectionStart + placeholder.length;
        }
        break;
      }
      case 'quote': {
        const placeholder = 'Quoted text';
        const textValue = selected || placeholder;
        const isLineStart = start === 0 || value[start - 1] === '\n';
        const prefix = isLineStart ? '' : '\n';
        const suffix = selected ? '' : '\n';
        const content = textValue
          .split('\n')
          .map((line) => {
            const trimmed = line.trim();
            return line.startsWith('> ') ? line : `> ${trimmed || ''}`;
          })
          .join('\n');
        const before = value.slice(0, start);
        const after = value.slice(end);
        newValue = `${before}${prefix}${content}${suffix}${after}`;
        if (selected) {
          newSelectionStart = start + prefix.length;
          newSelectionEnd = newSelectionStart + content.length;
        } else {
          newSelectionStart = start + prefix.length + 2;
          newSelectionEnd = newSelectionStart + placeholder.length;
        }
        break;
      }
      case 'strikethrough':
        wrapSelection('~~', '~~', 'strikethrough text');
        break;
      case 'code-block': {
        const placeholder = 'code here';
        const textValue = selected || placeholder;
        const isLineStart = start === 0 || value[start - 1] === '\n';
        const prefix = isLineStart ? '```\n' : '\n```\n';
        const suffix = selected ? '\n```' : '\n```';
        insertBlock(prefix, textValue, suffix);
        break;
      }
      case 'horizontal-rule': {
        const isLineStart = start === 0 || value[start - 1] === '\n';
        const prefix = isLineStart ? '' : '\n';
        const hr = '---';
        const before = value.slice(0, start);
        const after = value.slice(end);
        newValue = `${before}${prefix}${hr}\n${after}`;
        newSelectionStart = start + prefix.length + hr.length + 1;
        newSelectionEnd = newSelectionStart;
        break;
      }
      case 'checkbox': {
        const placeholder = 'Task item';
        const textValue = selected || placeholder;
        const isLineStart = start === 0 || value[start - 1] === '\n';
        const prefix = isLineStart ? '' : '\n';
        const suffix = selected ? '' : '\n';
        const content = textValue
          .split('\n')
          .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return '- [ ] ';
            const normalized = trimmed.replace(/^[-*]\s*\[[ xX]\]\s*/, '');
            return `- [ ] ${normalized}`;
          })
          .join('\n');
        const before = value.slice(0, start);
        const after = value.slice(end);
        newValue = `${before}${prefix}${content}${suffix}${after}`;
        if (selected) {
          newSelectionStart = start + prefix.length;
          newSelectionEnd = newSelectionStart + content.length;
        } else {
          newSelectionStart = start + prefix.length + 6;
          newSelectionEnd = newSelectionStart + placeholder.length;
        }
        break;
      }
      case 'table': {
        const isLineStart = start === 0 || value[start - 1] === '\n';
        const prefix = isLineStart ? '' : '\n';
        const table = '| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |';
        const before = value.slice(0, start);
        const after = value.slice(end);
        newValue = `${before}${prefix}${table}\n${after}`;
        newSelectionStart = start + prefix.length + table.length + 1;
        newSelectionEnd = newSelectionStart;
        break;
      }
      case 'subscript':
        wrapSelection('<sub>', '</sub>', 'subscript');
        break;
      case 'superscript':
        wrapSelection('<sup>', '</sup>', 'superscript');
        break;
      default:
        return;
    }

    if (newValue !== value) {
      setEditContent(newValue);
      undoRedo.pushHistory(newValue);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
        lastSelectionRef.current = {
          start: newSelectionStart,
          end: newSelectionEnd
        };
      });
    }
  };

  // --- Effects ---
  
  // Auth state listener — drives the sign-in gate.
  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setAuthUser(u || null);
      setAuthResolved(true);
    });
    return () => unsub && unsub();
  }, []);
  
  // Auto-save topics to storage (only after initial load completes)
  useEffect(() => {
    // Don't auto-save until we've loaded from storage
    if (!isInitialized || !canAutoSave) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      saveTopics(topics);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [topics, saveTopics, isInitialized, canAutoSave]);

  // Focus management
  useEffect(() => {
    if (isEditing || isModalOpen) {
      return;
    }

    const activeElement = document.activeElement;
    const activeTag = activeElement?.tagName;
    const isTypingElement = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeElement?.hasAttribute('contenteditable');
    if (isTypingElement) {
      return;
    }

    const isInSidebar = activeElement && topicListRef.current && topicListRef.current.contains(activeElement);

    if (selectedTopic && !isInSidebar) {
      focusTopicById(selectedTopic.id);
    } else if (!selectedTopic && !filteredTopics.length) {
      requestAnimationFrame(() => {
        newTopicButtonRef.current?.focus?.();
      });
    }
  }, [selectedTopic, filteredTopics.length, focusTopicById, isEditing, isModalOpen]);

  // Sync editContent with undoRedo value
  useEffect(() => {
    if (isEditing) {
      setEditContent(undoRedo.value);
    }
  }, [undoRedo.value, isEditing]);

  // --- Rendered HTML ---
  const previewHtml = useMemo(() => {
    const content = isEditing ? editContent : (selectedTopic?.content || '');
    return renderMarkdown(content, topics);
  }, [isEditing, editContent, selectedTopic?.content, topics]);

  const topicIdByTitle = useMemo(() => {
    return topics.reduce((acc, topic) => {
      if (typeof topic?.title === 'string' && topic.title.trim()) {
        acc[topic.title.trim().toLowerCase()] = topic.id;
      }
      return acc;
    }, {});
  }, [topics]);

  const extractLinkedTopicIds = useCallback((content) => {
    if (typeof content !== 'string' || !content.trim()) {
      return [];
    }

    const matchedTitles = Array.from(content.matchAll(/\[\[(.+?)\]\]/g))
      .map((match) => match[1]?.trim().toLowerCase())
      .filter(Boolean);

    return Array.from(new Set(matchedTitles
      .map((title) => topicIdByTitle[title])
      .filter((id) => id !== undefined && id !== null)));
  }, [topicIdByTitle]);

  const outboundLinkedTopics = useMemo(() => {
    if (!selectedTopic) {
      return [];
    }
    const linkedIds = new Set(extractLinkedTopicIds(selectedTopic.content));
    linkedIds.delete(selectedTopic.id);
    return topics.filter((topic) => linkedIds.has(topic.id));
  }, [extractLinkedTopicIds, selectedTopic, topics]);

  const backlinkTopics = useMemo(() => {
    if (!selectedTopic) {
      return [];
    }

    const backlinkIds = topics
      .filter((topic) => topic.id !== selectedTopic.id)
      .filter((topic) => extractLinkedTopicIds(topic.content).includes(selectedTopic.id))
      .map((topic) => topic.id);

    const uniqueBacklinkIds = Array.from(new Set(backlinkIds));
    return topics.filter((topic) => uniqueBacklinkIds.includes(topic.id));
  }, [extractLinkedTopicIds, selectedTopic, topics]);

  const relatedTopics = useMemo(() => {
    if (!selectedTopic) {
      return [];
    }

    const blockedIds = new Set([
      selectedTopic.id,
      ...outboundLinkedTopics.map((topic) => topic.id),
      ...backlinkTopics.map((topic) => topic.id)
    ]);

    return topics
      .filter((topic) => !blockedIds.has(topic.id))
      .filter((topic) => topic.category === selectedTopic.category)
      .slice(0, 5);
  }, [backlinkTopics, outboundLinkedTopics, selectedTopic, topics]);

  const openRelatedTopic = useCallback((topic) => {
    setSelectedTopic(topic);
    setPreviewUrl('');
    setIsEditing(false);
    requestAnimationFrame(() => focusTopicById(topic.id));
  }, [focusTopicById, setSelectedTopic]);

  const hasPreview = previewUrl && !isEditing;

  const liveAnnouncements = [statusMessage, statusAnnouncement]
    .filter(Boolean)
    .join(' ');

  // --- Auth gate (cloud-only requires sign-in) ---
  if (requireAuth && !authResolved) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)',
        gap: '0.6rem', fontSize: '0.9rem'
      }}>
        <span style={{
          width: '14px', height: '14px', borderRadius: '50%',
          border: '2px solid var(--border-color)', borderTopColor: 'var(--accent)',
          display: 'inline-block', animation: 'spin 0.8s linear infinite'
        }} />
        Opening your notebook…
      </div>
    );
  }

  if (requireAuth && !authUser) {
    return (
      <AuthGate
        onGoogleSignIn={handleGoogleSignIn}
        onEmailSignIn={handleEmailSignIn}
        error={authEmailError}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <>
      <a
        href="#main-content"
        onFocus={() => setIsSkipLinkFocused(true)}
        onBlur={() => setIsSkipLinkFocused(false)}
        style={{
          ...skipLinkBaseStyles,
          transform: isSkipLinkFocused ? 'translateY(0)' : skipLinkBaseStyles.transform,
          boxShadow: isSkipLinkFocused ? '0 18px 32px -18px rgba(15,23,42,0.55)' : 'none'
        }}
      >
        Skip to main content
      </a>
      <div style={srOnlyStyles} aria-live="polite" aria-atomic="true">
        {liveAnnouncements}
      </div>
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        position: 'relative'
      }}>
        <Header
          resetButtonDescriptionId={resetButtonDescriptionId}
          setShowResetConfirm={setShowResetConfirm}
          theme={theme}
          onToggleTheme={toggleTheme}
          authUser={authUser}
          onSignOut={handleSignOut}
          isSyncing={isSyncing}
          lastSyncTime={lastSyncTime}
        />

        {/* Workspace Insights */}
        <section
          aria-label="Workspace insights"
          style={{
            background: 'var(--bg-accent)',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          {/* Collapsible Header */}
          <button
            onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
            aria-expanded={isInsightsExpanded}
            aria-label={isInsightsExpanded ? 'Collapse workspace insights' : 'Expand workspace insights'}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.6rem 2rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(148,163,184,0.1)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Workspace Insights
              </span>
              {!isInsightsExpanded && (
                <span style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  fontWeight: '500'
                }}>
                  ({workspaceInsights.map(i => i.value).join(' • ')})
                </span>
              )}
            </div>
            <div style={{
              transform: isInsightsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform var(--transition-base)',
              display: 'flex',
              alignItems: 'center'
            }}>
              <ChevronDownIcon />
            </div>
          </button>
          
          {/* Collapsible Content */}
          <div
            style={{
              maxHeight: isInsightsExpanded ? '500px' : '0',
              overflow: 'hidden',
              transition: 'max-height var(--transition-base), padding var(--transition-base)',
              padding: isInsightsExpanded ? '0 2rem 0.6rem' : '0 2rem'
            }}
          >
            <div style={{
              display: 'grid',
              gap: '0.5rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              paddingTop: isInsightsExpanded ? '0' : '0'
            }}>
              {workspaceInsights.map(({ id, label, value, hint }) => (
                <div
                  key={id}
                  data-testid={`insight-${id}`}
                  className="card-hover"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.6rem 0.9rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem',
                    backdropFilter: 'blur(8px)',
                    transition: 'all var(--transition-base)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minWidth: 0
                  }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em'
                    }}>
                      {label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: 'var(--text-primary)'
                    }}>
                      {value}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)'
                    }}>
                      {hint}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main
          id="main-content"
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden'
          }}
        >
          <Sidebar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchHelpId={searchHelpId}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categoryFilterLabelId={categoryFilterLabelId}
            categoryFilterSelectId={categoryFilterSelectId}
            categoryFilterHelpId={categoryFilterHelpId}
            categories={categories}
            filteredTopics={visibleFilteredTopics}
            topicCountLabelId={topicCountLabelId}
            topicsListboxId={topicsListboxId}
            activeTopicOptionId={activeTopicOptionId}
            topicListRef={topicListRef}
            handleTopicListKeyDown={handleTopicListKeyDown}
            selectedTopic={selectedTopic}
            setSelectedTopic={setSelectedTopic}
            setIsEditing={setIsEditing}
            setPreviewUrl={setPreviewUrl}
            focusTopicById={focusTopicById}
            topicRefs={topicRefs}
            handleDeleteTopic={handleDeleteTopic}
            handleTogglePin={handleTogglePin}
            handleArchiveTopic={handleArchiveTopic}
            showArchived={showArchived}
            setShowArchived={setShowArchived}
            archivedCount={archivedCount}
            newTopicButtonRef={newTopicButtonRef}
            setShowNewTopicModal={setShowNewTopicModal}
            allTags={allTags}
            selectedTagFilter={selectedTagFilter}
            setSelectedTagFilter={setSelectedTagFilter}
            onRenameTagGlobally={handleRenameTagGlobally}
            onDeleteTagGlobally={handleDeleteTagGlobally}
            savedFilters={savedFilters}
            hasActiveFilter={hasActiveFilter}
            onSaveCurrentFilterPreset={handleSaveCurrentFilterPreset}
            onApplySavedFilter={handleApplySavedFilter}
            onRenameSavedFilter={handleRenameSavedFilter}
            onTogglePinSavedFilter={handleTogglePinSavedFilter}
            onMoveSavedFilter={handleMoveSavedFilter}
            onMoveSavedFilterToEdge={handleMoveSavedFilterToEdge}
            onReorderSavedFilter={handleReorderSavedFilter}
            onDeleteSavedFilter={handleDeleteSavedFilter}
            savedViewsDensity={savedViewsDensity}
            onToggleSavedViewsDensity={handleToggleSavedViewsDensity}
            matchSnippets={matchSnippets}
          />

          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto'
          }}>
            {selectedTopic ? (
              <>
                {/* Top Toolbar - Actions and User Info */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 2rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {/* Left side - Category and Date */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '0.75rem', 
                    fontSize: '0.8rem', 
                    color: 'var(--text-tertiary)' 
                  }}>
                    <span style={{
                      backgroundColor: 'var(--accent-soft)',
                      padding: '0.3rem 0.7rem',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: '600',
                      fontSize: '0.78rem',
                      letterSpacing: '0.02em',
                      color: 'var(--accent-strong)',
                      border: '1px solid var(--accent-border)'
                    }}>
                      {selectedTopic.category}
                    </span>
                    <span>Last edited: {new Date(selectedTopic.lastModified).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Right side - Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {!isEditing ? (
                      <>
                        <button
                          onClick={startEditing}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'var(--button-primary)',
                            color: 'white',
                            padding: '0.6rem 1.25rem',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: '600',
                            fontSize: '0.875rem',
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
                          <EditIcon /> Edit
                        </button>
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              background: 'var(--button-info)',
                              color: 'white',
                              padding: '0.6rem 1.25rem',
                              borderRadius: 'var(--radius-md)',
                              fontWeight: '600',
                              fontSize: '0.875rem',
                              border: 'none',
                              cursor: 'pointer',
                              boxShadow: 'var(--shadow-sm)',
                              transition: 'all var(--transition-fast)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--button-info-hover)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--button-info)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                            }}
                          >
                            Export ▾
                          </button>
                          {showExportMenu && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              marginTop: '0.5rem',
                              backgroundColor: 'var(--bg-secondary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-lg)',
                              boxShadow: 'var(--shadow-xl)',
                              zIndex: 10,
                              minWidth: '200px',
                              overflow: 'hidden',
                              animation: 'slideUp 200ms cubic-bezier(0.4, 0, 0.2, 1)'
                            }}>
                              <button
                                onClick={handleExportMarkdown}
                                style={{
                                  width: '100%',
                                  padding: '0.6rem 0.85rem',
                                  textAlign: 'left',
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  fontWeight: '500',
                                  fontSize: '0.85rem',
                                  color: 'var(--text-secondary)',
                                  borderBottom: '1px solid var(--border-light)'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                              >
                                📄 Markdown
                              </button>
                              <button
                                onClick={handleExportPDF}
                                style={{
                                  width: '100%',
                                  padding: '0.6rem 0.85rem',
                                  textAlign: 'left',
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  fontWeight: '500',
                                  fontSize: '0.85rem',
                                  color: 'var(--text-secondary)',
                                  borderBottom: '1px solid var(--border-light)'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                              >
                                📑 PDF
                              </button>
                              <button
                                onClick={handleExportWord}
                                style={{
                                  width: '100%',
                                  padding: '0.6rem 0.85rem',
                                  textAlign: 'left',
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  fontWeight: '500',
                                  fontSize: '0.85rem',
                                  color: 'var(--text-secondary)',
                                  borderBottom: '1px solid var(--border-light)'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                              >
                                📝 Word
                              </button>
                              <button
                                onClick={handleExportAll}
                                style={{
                                  width: '100%',
                                  padding: '0.6rem 0.85rem',
                                  textAlign: 'left',
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  fontWeight: '500',
                                  fontSize: '0.85rem',
                                  color: 'var(--text-secondary)',
                                  borderBottom: '1px solid var(--border-light)'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                              >
                                💾 All (JSON)
                              </button>
                              <label
                                style={{
                                  width: '100%',
                                  padding: '0.6rem 0.85rem',
                                  textAlign: 'left',
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  fontWeight: '500',
                                  fontSize: '0.85rem',
                                  color: 'var(--text-secondary)',
                                  display: 'block',
                                  borderBottom: '1px solid var(--border-light)',
                                  boxSizing: 'border-box'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                              >
                                📥 Import
                                <input
                                  type="file"
                                  accept=".json"
                                  onChange={handleImport}
                                  style={{ display: 'none' }}
                                />
                              </label>
                              <button
                                onClick={handleShare}
                                style={{
                                  width: '100%',
                                  padding: '0.6rem 0.85rem',
                                  textAlign: 'left',
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  fontWeight: '500',
                                  fontSize: '0.85rem',
                                  color: 'var(--text-secondary)'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                              >
                                🔗 Share
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsEditing(false)}
                          style={{
                            backgroundColor: 'var(--button-secondary)',
                            color: 'var(--text-secondary)',
                            padding: '0.6rem 1.25rem',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                            boxShadow: 'var(--shadow-xs)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--button-secondary)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => setShowTemplateModal(true)}
                          title="Insert template"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'var(--button-neutral)',
                            color: '#fffdf8',
                            padding: '0.6rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'all var(--transition-fast)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--button-neutral-hover)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--button-neutral)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                          }}
                        >
                          <TemplateIcon /> Templates
                        </button>
                        <button
                          onClick={handleSave}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: 'var(--button-success)',
                            color: 'white',
                            padding: '0.6rem 1.25rem',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'all var(--transition-fast)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--button-success-hover)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--button-success)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                          }}
                        >
                          <SaveIcon /> Save
                        </button>
                        {/* Auto-save indicator */}
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.7rem',
                          color: saveStatus === 'unsaved' ? 'var(--highlight)' : saveStatus === 'saving' ? 'var(--text-tertiary)' : 'var(--accent)',
                          fontWeight: 600
                        }}>
                          {saveStatus === 'unsaved' && '● Unsaved'}
                          {saveStatus === 'saving' && '○ Saving...'}
                          {saveStatus === 'saved' && <><CheckIcon /> Saved</>}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Title Area */}
                <div style={{ padding: '2rem 2rem 0.75rem', maxWidth: '900px', width: '100%' }}>
                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2.6rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    margin: 0,
                    letterSpacing: '-0.022em',
                    lineHeight: 1.12
                  }}>
                    {selectedTopic.title}
                  </h2>

                  {/* Tags row */}
                  {isEditing ? (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
                      {editTags.map(tag => (
                        <span key={tag} data-testid={`tag-chip-${tag}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.76rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.55rem', borderRadius: '999px', fontWeight: 600 }}>
                          #{tag}
                          <button
                            type="button"
                            aria-label={`Remove tag ${tag}`}
                            onClick={() => setEditTags(prev => prev.filter(t => t !== tag))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1, fontSize: '0.9rem', fontWeight: 700 }}
                          >×</button>
                        </span>
                      ))}
                      <input
                        data-testid="tag-input"
                        type="text"
                        placeholder="Add tag…"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                            e.preventDefault();
                            const normalized = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
                            if (normalized && !editTags.includes(normalized)) {
                              setEditTags(prev => [...prev, normalized]);
                            }
                            setTagInput('');
                          }
                          if (e.key === 'Backspace' && !tagInput && editTags.length > 0) {
                            setEditTags(prev => prev.slice(0, -1));
                          }
                        }}
                        style={{ fontSize: '0.76rem', border: '1px solid var(--border-color)', borderRadius: '999px', padding: '0.2rem 0.6rem', outline: 'none', background: 'var(--bg-secondary)', color: 'var(--text-primary)', minWidth: '6rem' }}
                      />
                    </div>
                  ) : (selectedTopic.tags && selectedTopic.tags.length > 0) && (
                    <div style={{ marginTop: '0.7rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {selectedTopic.tags.map(tag => (
                        <span key={tag} style={{ fontSize: '0.76rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.55rem', borderRadius: '999px', fontWeight: 600 }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, padding: '0 2rem 2rem', overflow: 'auto' }}>
                  {isEditing ? (
                    <Editor
                    editContent={editContent}
                    setEditContent={(content) => {
                      setEditContent(content);
                      undoRedo.pushHistory(content);
                    }}
                    updateSelectionRef={updateSelectionRef}
                    applyMarkdownFormatting={applyMarkdownFormatting}
                    isColorPickerOpen={isColorPickerOpen}
                    setIsColorPickerOpen={setIsColorPickerOpen}
                    textColorOptions={textColorOptions}
                    textColorMenuId={textColorMenuId}
                    textColorHelpId={textColorHelpId}
                    setShowImageModal={setShowImageModal}
                    setShowLinkModal={setShowLinkModal}
                    editTextareaRef={editTextareaRef}
                    previewHtml={previewHtml}
                    handleContentClick={handleContentClick}
                    previewUrl={previewUrl}
                    setPreviewUrl={setPreviewUrl}
                  />
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '2rem', minHeight: '100%' }}>
                    <div style={{ flex: '1 1 440px', minWidth: 'min(100%, 360px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <Preview
                        className="prose"
                        previewHtml={previewHtml}
                        handleContentClick={handleContentClick}
                        previewRef={previewContentRef}
                      />

                      {(outboundLinkedTopics.length > 0 || backlinkTopics.length > 0 || relatedTopics.length > 0) && (
                        <section
                          aria-label="Note relationships"
                          style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.1rem 1.25rem',
                            background: 'var(--bg-secondary)',
                            boxShadow: 'var(--shadow-xs)'
                          }}
                        >
                          <h3 style={{ margin: '0 0 0.85rem', fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Note Connections
                          </h3>

                          {outboundLinkedTopics.length > 0 && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <p style={{ margin: '0 0 0.4rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Links In This Note ({outboundLinkedTopics.length})
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {outboundLinkedTopics.map((topic) => (
                                  <button
                                    key={`outbound-${topic.id}`}
                                    type="button"
                                    data-testid={`linked-topic-${topic.id}`}
                                    onClick={() => openRelatedTopic(topic)}
                                    style={{
                                      border: '1px solid var(--accent-border)',
                                      background: 'var(--accent-soft)',
                                      color: 'var(--accent-strong)',
                                      borderRadius: '999px',
                                      padding: '0.3rem 0.7rem',
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {topic.title}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {backlinkTopics.length > 0 && (
                            <div style={{ marginBottom: relatedTopics.length > 0 ? '0.75rem' : 0 }}>
                              <p style={{ margin: '0 0 0.4rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Backlinks ({backlinkTopics.length})
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {backlinkTopics.map((topic) => (
                                  <button
                                    key={`backlink-${topic.id}`}
                                    type="button"
                                    data-testid={`backlink-topic-${topic.id}`}
                                    onClick={() => openRelatedTopic(topic)}
                                    style={{
                                      border: '1px solid var(--clay-border)',
                                      background: 'var(--clay-soft)',
                                      color: 'var(--clay)',
                                      borderRadius: '999px',
                                      padding: '0.3rem 0.7rem',
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {topic.title}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {relatedTopics.length > 0 && (
                            <div>
                              <p style={{ margin: '0 0 0.4rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Same Category ({relatedTopics.length})
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {relatedTopics.map((topic) => (
                                  <button
                                    key={`related-${topic.id}`}
                                    type="button"
                                    data-testid={`related-topic-${topic.id}`}
                                    onClick={() => openRelatedTopic(topic)}
                                    style={{
                                      border: '1px solid var(--border-color)',
                                      background: 'var(--bg-tertiary)',
                                      color: 'var(--text-secondary)',
                                      borderRadius: '999px',
                                      padding: '0.3rem 0.7rem',
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {topic.title}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </section>
                      )}
                    </div>
                    {hasPreview && (
                      <div style={{ flex: '1 1 400px', minWidth: 'min(100%, 320px)', height: '72vh', position: 'sticky', top: 0, display: 'flex' }}>
                        <LinkPreview url={previewUrl} onClose={() => setPreviewUrl('')} />
                      </div>
                    )}
                  </div>
                )}
                </div>
              </>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)'
              }}>
                <div style={{ textAlign: 'center', maxWidth: '24rem', padding: '2rem' }}>
                  <div style={{ color: 'var(--accent)', opacity: 0.5, display: 'flex', justifyContent: 'center' }}>
                    <BookIcon />
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '1.25rem 0 0.5rem' }}>
                    A blank page awaits
                  </h2>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
                    Choose a note from the left, or start a new one to begin writing.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {showCommandPalette && (
        <Modal
          onClose={closeCommandPalette}
          labelledBy="command-palette-title"
          describedBy="command-palette-help"
          initialFocusRef={commandPaletteInputRef}
        >
          <h2 id="command-palette-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Command Palette
          </h2>
          <p id="command-palette-help" style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Use arrow keys to move and Enter to run a command.
          </p>
          <input
            ref={commandPaletteInputRef}
            data-testid="command-palette-input"
            value={commandQuery}
            onChange={(event) => setCommandQuery(event.target.value)}
            onKeyDown={handleCommandPaletteInputKeyDown}
            placeholder="Type a command..."
            style={{
              width: '100%',
              padding: '0.7rem 0.8rem',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '0.75rem',
              fontSize: '0.92rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          />

          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {filteredCommandActions.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>No commands found.</p>
            ) : filteredCommandActions.map((action, index) => {
              const isActive = index === commandHighlightIndex;
              return (
                <button
                  key={action.id}
                  type="button"
                  data-testid={`command-action-${action.id}`}
                  onClick={() => executeCommandAction(action)}
                  style={{
                    textAlign: 'left',
                    width: '100%',
                    border: isActive ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.6rem 0.75rem',
                    backgroundColor: isActive ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{action.label}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{action.shortcut}</span>
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      {showNewTopicModal && (
        <Modal
          onClose={closeNewTopicModal}
          labelledBy={newTopicHeadingId}
          initialFocusRef={newTopicTitleRef}
        >
          <h2 id={newTopicHeadingId} style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            New Topic
          </h2>
          <form onSubmit={(e) => { e.preventDefault(); handleAddTopic(); }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Title</label>
                <input
                  type="text"
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  ref={newTopicTitleRef}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter topic title"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Category</label>
                <input
                  type="text"
                  value={newTopicCategory}
                  onChange={(e) => setNewTopicCategory(e.target.value)}
                  ref={newTopicCategoryRef}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter category"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="submit"
                data-testid="btn-create-topic"
                disabled={!newTopicTitle.trim()}
                style={{
                  flex: 1,
                  background: 'var(--button-primary)',
                  color: '#fffdf8',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '600',
                  fontSize: '0.9375rem',
                  border: 'none',
                  cursor: !newTopicTitle.trim() ? 'not-allowed' : 'pointer',
                  opacity: !newTopicTitle.trim() ? 0.7 : 1,
                  boxShadow: !newTopicTitle.trim() 
                    ? 'var(--shadow-xs)' 
                    : 'var(--shadow-md)',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  if (newTopicTitle.trim()) {
                    e.currentTarget.style.background = 'var(--button-primary-hover)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (newTopicTitle.trim()) {
                    e.currentTarget.style.background = 'var(--button-primary)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }
                }}
              >
                Create Topic
              </button>
              <button
                type="button"
                onClick={closeNewTopicModal}
                aria-describedby={newTopicCancelDescriptionId}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--button-secondary)',
                  color: 'var(--text-secondary)',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <span id={newTopicCancelDescriptionId} style={srOnlyStyles}>
                Close the new topic dialog without creating a topic.
              </span>
            </div>
          </form>
        </Modal>
      )}

      {showImageModal && (
        <Modal
          onClose={closeImageModal}
          labelledBy={imageModalHeadingId}
          initialFocusRef={imageUrlInputRef}
        >
          <h2 id={imageModalHeadingId} style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Add Image
          </h2>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Image URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              ref={imageUrlInputRef}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
              placeholder="https://example.com/image.jpg"
              aria-describedby={imageUrlHelpId}
            />
            <span id={imageUrlHelpId} style={srOnlyStyles}>
              Provide the image source URL. Most image formats are supported.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              data-testid="btn-add-image"
              onClick={handleAddImage}
              disabled={!imageUrl.trim()}
              style={{
                flex: 1,
                backgroundColor: 'var(--button-primary)',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                opacity: !imageUrl.trim() ? 0.6 : 1
              }}
            >
              Add Image
            </button>
            <button
              onClick={closeImageModal}
              aria-describedby={imageModalCancelDescriptionId}
              style={{
                flex: 1,
                backgroundColor: 'var(--button-secondary)',
                color: 'var(--text-secondary)',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <span id={imageModalCancelDescriptionId} style={srOnlyStyles}>
              Close the add image dialog without inserting an image.
            </span>
          </div>
        </Modal>
      )}

      {showLinkModal && (
        <Modal
          onClose={closeLinkModal}
          labelledBy={linkModalHeadingId}
          initialFocusRef={linkUrlInputRef}
        >
          <h2 id={linkModalHeadingId} style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Add Link
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Link URL</label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                ref={linkUrlInputRef}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box'
                }}
                placeholder="https://example.com"
                aria-describedby={linkUrlHelpId}
              />
              <span id={linkUrlHelpId} style={srOnlyStyles}>
                Provide the destination address. If it lacks a protocol, https will be added automatically.
              </span>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Link Text (Optional)
              </label>
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box'
                }}
                placeholder="Click here"
                aria-describedby={linkTextHelpId}
              />
              <span id={linkTextHelpId} style={srOnlyStyles}>
                This text will appear as the link label. If left blank, the URL itself will be used.
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              onClick={handleAddLink}
              disabled={!linkUrl.trim()}
              style={{
                flex: 1,
                backgroundColor: 'var(--button-primary)',
                color: '#fffdf8',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                opacity: !linkUrl.trim() ? 0.6 : 1
              }}
            >
              Add Link
            </button>
            <button
              onClick={closeLinkModal}
              aria-describedby={linkModalCancelDescriptionId}
              style={{
                flex: 1,
                backgroundColor: 'var(--button-secondary)',
                color: 'var(--text-secondary)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <span id={linkModalCancelDescriptionId} style={srOnlyStyles}>
              Close the add link dialog without inserting a link.
            </span>
          </div>
        </Modal>
      )}

      {showResetConfirm && (
        <Modal
          onClose={closeResetModal}
          labelledBy={resetModalHeadingId}
          describedBy={resetModalDescriptionId}
          initialFocusRef={resetConfirmButtonRef}
        >
          <h2 id={resetModalHeadingId} style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Reset stored data?
          </h2>
          <p id={resetModalDescriptionId} style={{ marginBottom: '1rem', color: 'var(--text-tertiary)' }}>
            This will clear persisted topics in your selected storage adapter. This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              onClick={async () => {
                const ok = await adapter.clearTopics();
                setShowResetConfirm(false);
                if (ok) window.location.reload();
                else alert('Failed to clear storage');
              }}
              ref={resetConfirmButtonRef}
              style={{
                flex: 1,
                backgroundColor: 'var(--button-danger)',
                color: '#fffdf8',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Confirm
            </button>
            <button
              onClick={closeResetModal}
              aria-describedby={resetModalCancelDescriptionId}
              style={{
                flex: 1,
                backgroundColor: 'var(--button-secondary)',
                color: 'var(--text-secondary)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <span id={resetModalCancelDescriptionId} style={srOnlyStyles}>
              Close the reset confirmation dialog without clearing stored data.
            </span>
          </div>
        </Modal>
      )}

      {/* Templates Modal */}
      {showTemplateModal && (
        <Modal 
          onClose={() => setShowTemplateModal(false)} 
          labelledBy="template-modal-heading"
        >
          <h2 
            id="template-modal-heading"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}
          >
            Choose a Template
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
            Select a template to quickly start your note. This will replace current content.
          </p>
          <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
            {noteTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => handleApplyTemplate(template)}
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {template.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {template.content.split('\n')[0] || 'Empty document'}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowTemplateModal(false)}
            style={{
              marginTop: '1rem',
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </Modal>
      )}

    </>
  );
};

export default App;
