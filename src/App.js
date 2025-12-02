import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import adapter from './lib/adapter';
import { renderMarkdown } from './lib/markdown';
import { exportAsMarkdown, exportAsPDF, exportAllAsJSON, importFromJSON } from './lib/export';
import Modal from './components/Modal';
import Preview from './components/Preview';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Editor from './components/Editor';
import { BookIcon, EditIcon, SaveIcon } from './components/icons';
import './theme.css';

// Custom hooks
import useTopics from './hooks/useTopics';
import useStorage from './hooks/useStorage';
import useSearch from './hooks/useSearch';
import useWorkspaceInsights from './hooks/useWorkspaceInsights';
import useUndoRedo from './hooks/useUndoRedo';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import useTheme from './hooks/useTheme';

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
  backgroundColor: '#ffffff',
  color: '#1e293b',
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
      content: '# Welcome to Your Personal Study Note\n\nThis is your personal space for learning and note-taking.\n\n## Features:\n- **Rich Text Editing**: Write notes with markdown support\n- **Categories**: Organize topics by category\n- **Search**: Find topics quickly\n- **Images & Links**: Add images and hyperlinks to your notes\n- **Undo/Redo**: Use Cmd/Ctrl+Z to undo, Cmd/Ctrl+Shift+Z to redo\n- **Keyboard Shortcuts**: Cmd/Ctrl+B for bold, Cmd/Ctrl+I for italic, Cmd/Ctrl+K for links\n\n## How to Use:\n1. Click the **+ New Topic** button to create a new study topic\n2. Select a topic from the left sidebar to view or edit\n3. Use markdown formatting or the toolbar for rich text\n4. Press Cmd/Ctrl+S to save your changes\n5. Click any link to preview it on the right!\n\nHappy studying!',
      lastModified: new Date().toISOString()
    }
  ];

  // Custom hooks
  const { topics, selectedTopic, setSelectedTopic, addTopic, updateTopic, deleteTopic, loadTopics: setTopicsFromStorage } = useTopics(seedTopics);
  
  const { 
    storageKey, 
    storageOptions, 
    storageDescription, 
    storageShortLabel,
    isSwitchingStorage, 
    statusMessage,
    switchStorage,
    saveTopics
  } = useStorage((newTopics) => {
    setTopicsFromStorage(newTopics);
  });

  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, categories, filteredTopics } = useSearch(topics);
  const workspaceInsights = useWorkspaceInsights(topics);
  const { theme, toggleTheme } = useTheme();

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  
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

  // Refs
  const topicRefs = useRef(new Map());
  const topicListRef = useRef(null);
  const newTopicButtonRef = useRef(null);
  const newTopicTitleRef = useRef(null);
  const newTopicCategoryRef = useRef(null);
  const imageUrlInputRef = useRef(null);
  const linkUrlInputRef = useRef(null);
  const resetConfirmButtonRef = useRef(null);
  const editTextareaRef = useRef(null);
  const lastSelectionRef = useRef({ start: 0, end: 0 });
  const previewContentRef = useRef(null);

  const isModalOpen = showNewTopicModal || showImageModal || showLinkModal || showResetConfirm;

  // --- IDs for accessibility ---
  const newTopicHeadingId = 'modal-new-topic-title';
  const imageModalHeadingId = 'modal-image-title';
  const linkModalHeadingId = 'modal-link-title';
  const resetModalHeadingId = 'modal-reset-title';
  const resetModalDescriptionId = 'modal-reset-description';
  const resetButtonDescriptionId = 'reset-button-description';
  const storageSelectLabelId = 'storage-select-label';
  const storageSelectId = 'storage-select';
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
    bold: () => isEditing && applyMarkdownFormatting('bold'),
    italic: () => isEditing && applyMarkdownFormatting('italic'),
    underline: () => isEditing && applyMarkdownFormatting('underline'),
    link: () => isEditing && setShowLinkModal(true),
    image: () => isEditing && setShowImageModal(true),
    undo: () => {
      if (isEditing && undoRedo.canUndo) {
        undoRedo.undo();
        setEditContent(undoRedo.value);
      }
    },
    redo: () => {
      if (isEditing && undoRedo.canRedo) {
        undoRedo.redo();
        setEditContent(undoRedo.value);
      }
    },
    save: () => isEditing && handleSave()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [isEditing, undoRedo]);

  useKeyboardShortcuts(keyboardHandlers, !isModalOpen);

  // --- Event handlers ---
  const handleStorageChange = useCallback((event) => {
    const nextKey = event.target.value;
    switchStorage(nextKey);
  }, [switchStorage]);

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

  const startEditing = () => {
    setEditContent(selectedTopic.content);
    undoRedo.reset(selectedTopic.content);
    setIsEditing(true);
    setPreviewUrl('');
  };

  const handleSave = () => {
    updateTopic(selectedTopic.id, {
      content: editContent,
      lastModified: new Date().toISOString()
    });
    setIsEditing(false);
    setStatusAnnouncement('Changes saved');
  };

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
    if (e.target.tagName === 'A') {
      e.preventDefault();
      const href = e.target.getAttribute('href');
      if (href) {
        setPreviewUrl(href);
      }
    }
  };

  const handleExportMarkdown = () => {
    exportAsMarkdown(selectedTopic);
    setShowExportMenu(false);
    setStatusAnnouncement('Topic exported as Markdown');
  };

  const handleExportPDF = async () => {
    if (previewContentRef.current) {
      const success = await exportAsPDF(selectedTopic, previewContentRef.current);
      setShowExportMenu(false);
      setStatusAnnouncement(success ? 'Topic exported as PDF' : 'PDF export failed');
    }
  };

  const handleExportAll = () => {
    exportAllAsJSON(topics);
    setShowExportMenu(false);
    setStatusAnnouncement('All topics exported as JSON');
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
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
  
  // Auto-save topics to storage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveTopics(topics);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [topics, saveTopics]);

  // Load initial topics
  useEffect(() => {
    const loadInitial = async () => {
      const loaded = await adapter.loadTopics();
      if (Array.isArray(loaded) && loaded.length > 0) {
        setTopicsFromStorage(loaded);
      }
    };
    loadInitial();
  }, [setTopicsFromStorage]);

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
    return renderMarkdown(content);
  }, [isEditing, editContent, selectedTopic?.content]);

  const hasPreview = previewUrl && !isEditing;

  const liveAnnouncements = [statusMessage, statusAnnouncement]
    .filter(Boolean)
    .join(' ');

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
        backgroundColor: '#f8fafc',
        position: 'relative'
      }}>
        <Header
          storageSelectId={storageSelectId}
          storageSelectLabelId={storageSelectLabelId}
          storageKey={storageKey}
          storageOptions={storageOptions}
          isSwitchingStorage={isSwitchingStorage}
          handleStorageChange={handleStorageChange}
          storageDescription={storageDescription}
          storageShortLabel={storageShortLabel}
          resetButtonDescriptionId={resetButtonDescriptionId}
          setShowResetConfirm={setShowResetConfirm}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Workspace Insights */}
        <section
          aria-label="Workspace insights"
          style={{
            background: 'linear-gradient(135deg, rgba(224,242,254,0.8), rgba(224,231,255,0.9))',
            borderBottom: '1px solid rgba(148,163,184,0.3)'
          }}
        >
          <div style={{ padding: '0.8rem 2.2rem 1rem' }}>
            <div style={{
              display: 'grid',
              gap: '0.6rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))'
            }}>
              {workspaceInsights.map(({ id, label, value, hint }) => (
                <div
                  key={id}
                  data-testid={`insight-${id}`}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    borderRadius: '0.7rem',
                    border: '1px solid rgba(148,163,184,0.2)',
                    padding: '0.3rem 0.6rem',
                    boxShadow: '0 10px 18px -18px rgba(15,23,42,0.45)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minWidth: 0
                  }}>
                    <span style={{
                      fontSize: '0.775rem',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em'
                    }}>
                      {label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    <span style={{
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      color: '#1e293b'
                    }}>
                      {value}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      color: '#94a3b8'
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
            filteredTopics={filteredTopics}
            topicCountLabelId={topicCountLabelId}
            topicsListboxId={topicsListboxId}
            activeTopicOptionId={activeTopicOptionId}
            topicListRef={topicListRef}
            handleTopicListKeyDown={handleTopicListKeyDown}
            selectedTopic={selectedTopic}
            setSelectedTopic={setSelectedTopic}
            setIsEditing={setIsEditing}
            setPreviewUrl={setPreviewUrl}
            topicRefs={topicRefs}
            handleDeleteTopic={handleDeleteTopic}
            newTopicButtonRef={newTopicButtonRef}
            setShowNewTopicModal={setShowNewTopicModal}
          />

          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            padding: '2rem'
          }}>
            {selectedTopic ? (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <div>
                    <h2 style={{
                      fontSize: '1.875rem',
                      fontWeight: '700',
                      color: '#1e293b',
                      marginBottom: '0.5rem'
                    }}>
                      {selectedTopic.title}
                    </h2>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                      <span>{selectedTopic.category}</span>
                      <span>•</span>
                      <span>Last edited: {new Date(selectedTopic.lastModified).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {!isEditing && (
                    <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                      <button
                        onClick={startEditing}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          backgroundColor: '#8b5cf6',
                          color: 'white',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '0.5rem',
                          fontWeight: '600',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <EditIcon /> Edit
                      </button>
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '0.5rem',
                          fontWeight: '600',
                          border: 'none',
                          cursor: 'pointer'
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
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.5rem',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                          zIndex: 10,
                          minWidth: '200px'
                        }}>
                          <button
                            onClick={handleExportMarkdown}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              textAlign: 'left',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              fontWeight: '500',
                              color: '#334155',
                              borderBottom: '1px solid #f1f5f9'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            📄 Export as Markdown
                          </button>
                          <button
                            onClick={handleExportPDF}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              textAlign: 'left',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              fontWeight: '500',
                              color: '#334155',
                              borderBottom: '1px solid #f1f5f9'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            📑 Export as PDF
                          </button>
                          <button
                            onClick={handleExportAll}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              textAlign: 'left',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              fontWeight: '500',
                              color: '#334155',
                              borderBottom: '1px solid #f1f5f9'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            💾 Export All (JSON)
                          </button>
                          <label
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              textAlign: 'left',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              fontWeight: '500',
                              color: '#334155',
                              display: 'block'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            📥 Import from JSON
                            <input
                              type="file"
                              accept=".json"
                              onChange={handleImport}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                  {isEditing && (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={() => setIsEditing(false)}
                        style={{
                          backgroundColor: '#e2e8f0',
                          color: '#334155',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '0.5rem',
                          fontWeight: '600',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          backgroundColor: '#10b981',
                          color: 'white',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '0.5rem',
                          fontWeight: '600',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <SaveIcon /> Save (Cmd/Ctrl+S)
                      </button>
                    </div>
                  )}
                </div>

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
                  />
                ) : (
                  <div style={{ display: 'flex', gap: '2rem', height: '100%' }}>
                    <Preview
                      previewHtml={previewHtml}
                      handleContentClick={handleContentClick}
                      previewRef={previewContentRef}
                    />
                    {hasPreview && (
                      <div style={{ flex: '1 1 400px', minWidth: '280px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '1rem'
                        }}>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Link Preview</h3>
                          <button
                            onClick={() => setPreviewUrl('')}
                            style={{
                              backgroundColor: 'transparent',
                              color: '#64748b',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '1.5rem',
                              padding: '0.25rem'
                            }}
                          >
                            ×
                          </button>
                        </div>
                        <iframe
                          src={previewUrl}
                          title="Link preview"
                          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                          style={{
                            width: '100%',
                            height: 'calc(100% - 3rem)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.5rem'
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#94a3b8',
                fontSize: '1.125rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <BookIcon />
                  <p style={{ marginTop: '1rem' }}>Select a topic to get started</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {showNewTopicModal && (
        <Modal
          onClose={closeNewTopicModal}
          labelledBy={newTopicHeadingId}
          initialFocusRef={newTopicTitleRef}
        >
          <h2 id={newTopicHeadingId} style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
            New Topic
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Title</label>
              <input
                type="text"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                ref={newTopicTitleRef}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.375rem'
                }}
                placeholder="Enter topic title"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Category</label>
              <input
                type="text"
                value={newTopicCategory}
                onChange={(e) => setNewTopicCategory(e.target.value)}
                ref={newTopicCategoryRef}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.375rem'
                }}
                placeholder="Enter category"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              onClick={handleAddTopic}
              disabled={!newTopicTitle.trim()}
              style={{
                flex: 1,
                backgroundColor: '#8b5cf6',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                opacity: !newTopicTitle.trim() ? 0.6 : 1
              }}
            >
              Create Topic
            </button>
            <button
              onClick={closeNewTopicModal}
              aria-describedby={newTopicCancelDescriptionId}
              style={{
                flex: 1,
                backgroundColor: '#e2e8f0',
                color: '#334155',
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
        </Modal>
      )}

      {showImageModal && (
        <Modal
          onClose={closeImageModal}
          labelledBy={imageModalHeadingId}
          initialFocusRef={imageUrlInputRef}
        >
          <h2 id={imageModalHeadingId} style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
            Add Image
          </h2>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Image URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              ref={imageUrlInputRef}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.375rem'
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
              onClick={handleAddImage}
              disabled={!imageUrl.trim()}
              style={{
                flex: 1,
                backgroundColor: '#8b5cf6',
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
                backgroundColor: '#e2e8f0',
                color: '#334155',
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
          <h2 id={linkModalHeadingId} style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
            Add Link
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Link URL</label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                ref={linkUrlInputRef}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.375rem'
                }}
                placeholder="https://example.com"
                aria-describedby={linkUrlHelpId}
              />
              <span id={linkUrlHelpId} style={srOnlyStyles}>
                Provide the destination address. If it lacks a protocol, https will be added automatically.
              </span>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Link Text (Optional)
              </label>
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.375rem'
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
                backgroundColor: '#8b5cf6',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.375rem',
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
                backgroundColor: '#e2e8f0',
                color: '#334155',
                padding: '0.75rem',
                borderRadius: '0.375rem',
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
          <h2 id={resetModalHeadingId} style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
            Reset stored data?
          </h2>
          <p id={resetModalDescriptionId} style={{ marginBottom: '1rem', color: '#475569' }}>
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
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.375rem',
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
                backgroundColor: '#e2e8f0',
                color: '#334155',
                padding: '0.75rem',
                borderRadius: '0.375rem',
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
    </>
  );
};

export default App;
