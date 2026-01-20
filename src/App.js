import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import adapter from './lib/adapter';
import { renderMarkdown } from './lib/markdown';
import { isConfigured, onAuthChange, signInWithGoogle, signOut, signInWithEmail, createUserWithEmail } from './lib/firebaseClient';
import Modal from './components/Modal';
import Preview from './components/Preview';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Editor from './components/Editor';
import { BookIcon, EditIcon, SaveIcon, TemplateIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon } from './components/icons';
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
    storageKey, 
    storageOptions, 
    storageDescription, 
    isSwitchingStorage, 
    isInitialized,
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
  
  // Archive state
  const [showArchived, setShowArchived] = useState(false);
  
  // Template state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // Workspace insights collapsed state
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(false);
  
  // Auto-save indicator state
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'
  
  // Auth state
  const [authUser, setAuthUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmailError, setAuthEmailError] = useState('');
  const firebaseEnabled = isConfigured();
  const authEmailRef = useRef(null);
  const authPasswordRef = useRef(null);

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

  const isModalOpen = showNewTopicModal || showImageModal || showLinkModal || showResetConfirm || showAuthModal;

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

  // Filter topics based on archive state
  const visibleFilteredTopics = showArchived 
    ? filteredTopics 
    : filteredTopics.filter(t => !t.archived);

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
    setIsEditing(true);
    setPreviewUrl('');
  };

  const handleSave = () => {
    setSaveStatus('saving');
    updateTopic(selectedTopic.id, {
      content: editContent,
      lastModified: new Date().toISOString()
    });
    setIsEditing(false);
    setStatusAnnouncement('Changes saved');
    setTimeout(() => setSaveStatus('saved'), 500);
  };

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
    if (e.target.tagName === 'A') {
      e.preventDefault();
      const href = e.target.getAttribute('href');
      const noteId = e.target.getAttribute('data-note-id');
      
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
      
      // Handle external links
      if (href) {
        setPreviewUrl(href);
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

  // Auth handlers
  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setStatusAnnouncement('Signed out successfully');
    } catch (e) {
      console.warn('Sign out failed', e);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      setShowAuthModal(false);
      setStatusAnnouncement('Signed in successfully');
    } catch (e) {
      console.warn('Google sign in failed', e);
    }
  };

  const handleEmailSignIn = async () => {
    setAuthEmailError('');
    const email = authEmailRef.current?.value?.trim() || '';
    const password = authPasswordRef.current?.value || '';
    
    if (!email || !password) {
      setAuthEmailError('Please enter email and password');
      return;
    }
    
    try {
      await signInWithEmail(email, password);
      setShowAuthModal(false);
      setStatusAnnouncement('Signed in successfully');
    } catch (err) {
      try {
        await createUserWithEmail(email, password);
        setShowAuthModal(false);
        setStatusAnnouncement('Account created and signed in');
      } catch (err2) {
        setAuthEmailError(err2?.message || err?.message || 'Sign in failed');
      }
    }
  };

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
  
  // Auth state listener
  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setAuthUser(u);
    });
    return () => unsub && unsub();
  }, []);
  
  // Auto-save topics to storage (only after initial load completes)
  useEffect(() => {
    // Don't auto-save until we've loaded from storage
    if (!isInitialized) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      saveTopics(topics);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [topics, saveTopics, isInitialized]);

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
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
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
          resetButtonDescriptionId={resetButtonDescriptionId}
          setShowResetConfirm={setShowResetConfirm}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Workspace Insights */}
        <section
          aria-label="Workspace insights"
          style={{
            background: 'var(--bg-accent)',
            borderBottom: '1px solid rgba(148,163,184,0.3)'
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
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      padding: '0.375rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: '600',
                      fontSize: '0.8125rem',
                      color: '#3b82f6',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      boxShadow: 'var(--shadow-xs)'
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
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            color: 'white',
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
                            e.currentTarget.style.background = 'linear-gradient(135deg, #4f46e5, #4338ca)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
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
                          color: saveStatus === 'unsaved' ? '#f59e0b' : saveStatus === 'saving' ? '#3b82f6' : '#10b981',
                          fontWeight: 500
                        }}>
                          {saveStatus === 'unsaved' && '● Unsaved'}
                          {saveStatus === 'saving' && '○ Saving...'}
                          {saveStatus === 'saved' && <><CheckIcon /> Saved</>}
                        </span>
                      </>
                    )}
                    
                    {/* Divider */}
                    {firebaseEnabled && (
                      <div style={{ width: '1px', height: '1.25rem', backgroundColor: 'var(--border-color)', margin: '0 0.25rem' }} />
                    )}
                    
                    {/* Auth Status */}
                    {firebaseEnabled && (
                      authUser ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div 
                            style={{ 
                              width: '6px', 
                              height: '6px', 
                              borderRadius: '50%', 
                              backgroundColor: '#10b981',
                              boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
                            }} 
                          />
                          <span 
                            style={{ 
                              fontSize: '0.75rem', 
                              color: 'var(--text-secondary)',
                              maxWidth: '100px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={authUser.email}
                          >
                            {authUser.email?.split('@')[0] || 'User'}
                          </span>
                          <button
                            onClick={handleSignOut}
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.2rem 0.45rem',
                              borderRadius: '0.25rem',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-tertiary)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              fontWeight: 500
                            }}
                          >
                            Sign out
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleSignIn}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 600,
                            boxShadow: '0 1px 3px rgba(79, 70, 229, 0.3)'
                          }}
                        >
                          Sign in
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Title Area */}
                <div style={{ padding: '1.5rem 2rem 1rem' }}>
                  <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '800',
                    color: 'var(--text-primary)',
                    margin: 0,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2
                  }}>
                    {selectedTopic.title}
                  </h2>
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
                </div>
              </>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
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
          <form onSubmit={(e) => { e.preventDefault(); handleAddTopic(); }}>
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
                    borderRadius: '0.375rem',
                    color: '#3b82f6'
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
                  background: !newTopicTitle.trim() 
                    ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)' 
                    : 'var(--button-primary)',
                  color: 'white',
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

      {/* Templates Modal */}
      {showTemplateModal && (
        <Modal 
          onClose={() => setShowTemplateModal(false)} 
          labelledBy="template-modal-heading"
        >
          <h2 
            id="template-modal-heading" 
            style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}
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
                  e.currentTarget.style.borderColor = '#4f46e5';
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

      {/* Auth Modal */}
      {showAuthModal && (
        <Modal 
          onClose={() => { setShowAuthModal(false); setAuthEmailError(''); }} 
          labelledBy="auth-modal-heading" 
          initialFocusRef={authEmailRef}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div 
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
              </svg>
            </div>
            <h2 
              id="auth-modal-heading" 
              style={{ 
                margin: 0, 
                fontSize: '1.25rem', 
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}
            >
              Sync your notes
            </h2>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
              Sign in to access your notes from any device
            </p>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
          </div>

          {/* Email Sign In */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label 
                htmlFor="auth-email" 
                style={{ 
                  display: 'block', 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  color: 'var(--text-secondary)',
                  marginBottom: '0.25rem'
                }}
              >
                Email
              </label>
              <input
                id="auth-email"
                ref={authEmailRef}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                style={{ 
                  width: '100%',
                  padding: '0.65rem 0.75rem', 
                  borderRadius: '0.5rem', 
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label 
                htmlFor="auth-password" 
                style={{ 
                  display: 'block', 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  color: 'var(--text-secondary)',
                  marginBottom: '0.25rem'
                }}
              >
                Password
              </label>
              <input
                id="auth-password"
                ref={authPasswordRef}
                type="password"
                placeholder="********"
                autoComplete="current-password"
                style={{ 
                  width: '100%',
                  padding: '0.65rem 0.75rem', 
                  borderRadius: '0.5rem', 
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailSignIn()}
              />
            </div>
            
            {authEmailError && (
              <div 
                style={{ 
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '0.375rem',
                  fontSize: '0.8rem',
                  color: '#ef4444'
                }}
              >
                {authEmailError}
              </div>
            )}
            
            <button
              onClick={handleEmailSignIn}
              style={{ 
                width: '100%',
                padding: '0.75rem', 
                borderRadius: '0.5rem', 
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', 
                color: 'white', 
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Sign in with Email
            </button>
          </div>

          <p style={{ 
            margin: '1rem 0 0', 
            fontSize: '0.7rem', 
            color: 'var(--text-muted)',
            textAlign: 'center'
          }}>
            New user? We will create an account for you automatically.
          </p>
        </Modal>
      )}
    </>
  );
};

export default App;
