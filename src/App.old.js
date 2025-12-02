import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import adapter, { getCurrentAdapterMeta, getCurrentAdapterKey, listAdapters } from './lib/adapter';
import sanitize from './lib/sanitize';
import Modal from './components/Modal';
import Preview from './components/Preview';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Editor from './components/Editor';
import { BookIcon, EditIcon, SaveIcon, HeadingIcon, BoldIcon, ItalicIcon, UnderlineIcon, ListIcon, NumberedListIcon, QuoteIcon, CodeIcon } from './components/icons';

// --- Markdown Renderer ---
const textColorMap = {
  slate: '#334155',
  indigo: '#4338ca',
  emerald: '#047857',
  amber: '#b45309',
  rose: '#be123c',
  sky: '#0369a1'
};

const renderMarkdown = (text) => {
  if (!text || !text.trim()) {
    return '<p style="color: #94a3b8; font-style: italic;">This note is empty. Start writing!</p>';
  }

  let html = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headers
  html = html.replace(/^# (.*$)/gm, '<h1 style="font-size: 1.875rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 1rem; color: #1e293b;">$1</h1>');
  html = html.replace(/^## (.*$)/gm, '<h2 style="font-size: 1.5rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.75rem; color: #1e293b;">$1</h2>');
  html = html.replace(/^### (.*$)/gm, '<h3 style="font-size: 1.25rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; color: #334155;">$1</h3>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 600; color: #1e293b;">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em style="font-style: italic;">$1</em>');
  html = html.replace(/\+\+(.+?)\+\+/g, '<span style="text-decoration: underline;">$1</span>');
  html = html.replace(/\{\{color:([a-zA-Z0-9#]+)\|(.+?)\}\}/g, (match, colorKey, value) => {
    const normalizedKey = colorKey.toLowerCase();
    const hex = textColorMap[normalizedKey];
    if (!hex) return value;
    return `<span style="color: ${hex};">${value}</span>`;
  });

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"/>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">$1</a>');

  // Lists
  html = html.replace(/(?:^|\n)(\d+\.\s.+?)(?=\n(?:\d+\.|\n|$))/gs, '<ol style="list-style-type: decimal; margin-left: 1.5rem; margin: 1rem 0; padding-left: 0.5rem;">$1</ol>');
  html = html.replace(/(?:^|\n)(\*\s.+?)(?=\n(?:\*\s|\n|$))/gs, '<ul style="list-style-type: disc; margin-left: 1.5rem; margin: 1rem 0; padding-left: 0.5rem;">$1</ul>');
  html = html.replace(/^\*\s(.+)$/gm, '<li style="margin-bottom: 0.25rem; color: #475569;">$1</li>');
  html = html.replace(/^\d+\.\s(.+)$/gm, '<li style="margin-bottom: 0.25rem; color: #475569;">$1</li>');

  // Paragraphs
  html = html.replace(/\n{2,}/g, '</p><p style="margin-bottom: 1rem; line-height: 1.6; color: #334155;">');
  html = `<p style="margin-bottom: 1rem; line-height: 1.6; color: #334155;">${html}</p>`;

  return html;
};

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

// --- Main App ---
const App = () => {
  const seedTopics = [
    {
      id: 1,
      title: 'Getting Started',
      category: 'Tutorial',
      content: '# Welcome to Your Personal Study Note\n\nThis is your personal space for learning and note-taking.\n\n## Features:\n- **Rich Text Editing**: Write notes with markdown support\n- **Categories**: Organize topics by category\n- **Search**: Find topics quickly\n- **Images & Links**: Add images and hyperlinks to your notes\n\n## How to Use:\n1. Click the **+ New Topic** button to create a new study topic\n2. Select a topic from the left sidebar to view or edit\n3. Use markdown formatting for rich text\n4. Click "Add Image" or "Add Link" buttons while editing\n5. Click any link to preview it on the right!\n\nHappy studying!',
      lastModified: new Date().toISOString()
    }
  ];

  const [topics, setTopics] = useState(seedTopics);
  const [selectedTopic, setSelectedTopic] = useState(seedTopics[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [statusAnnouncement, setStatusAnnouncement] = useState('');
  const [previewAnnouncement] = useState('');
  const [linkPreviewAnnouncement] = useState('');
  const [topicAnnouncement] = useState('');
  const [topicCountAnnouncement] = useState('');
  const [isSkipLinkFocused, setIsSkipLinkFocused] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [storageKey, setStorageKey] = useState(() => getCurrentAdapterKey());
  const [storageMeta, setStorageMeta] = useState(() => getCurrentAdapterMeta());
  const [isSwitchingStorage, setIsSwitchingStorage] = useState(false);
  const storageOptions = listAdapters();
  const storageDescription = storageMeta?.description || '';
  const storageShortLabel = storageMeta?.shortLabel || storageMeta?.label || '';
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

  const isModalOpen = showNewTopicModal || showImageModal || showLinkModal || showResetConfirm;

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

  const categories = ['All', ...new Set(topics.map(t => t.category))];

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
  

  const filteredTopics = useMemo(() => topics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         topic.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || topic.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }), [topics, searchQuery, selectedCategory]);

  const activeTopicOptionId = selectedTopic ? `topic-option-${selectedTopic.id}` : undefined;

  const formattingButtons = useMemo(() => ([
    { key: 'heading', label: 'Insert heading', icon: <HeadingIcon /> },
    { key: 'bold', label: 'Bold', icon: <BoldIcon /> },
    { key: 'italic', label: 'Italic', icon: <ItalicIcon /> },
    { key: 'underline', label: 'Underline', icon: <UnderlineIcon /> },
    { key: 'code', label: 'Inline code', icon: <CodeIcon /> },
    { key: 'unordered-list', label: 'Bulleted list', icon: <ListIcon /> },
    { key: 'ordered-list', label: 'Numbered list', icon: <NumberedListIcon /> },
    { key: 'quote', label: 'Block quote', icon: <QuoteIcon /> }
  ]), []);

  const textColorOptions = useMemo(() => ([
    { key: 'slate', label: 'Slate', hex: textColorMap.slate },
    { key: 'indigo', label: 'Indigo', hex: textColorMap.indigo },
    { key: 'emerald', label: 'Emerald', hex: textColorMap.emerald },
    { key: 'amber', label: 'Amber', hex: textColorMap.amber },
    { key: 'rose', label: 'Rose', hex: textColorMap.rose },
    { key: 'sky', label: 'Sky', hex: textColorMap.sky }
  ]), []);

  const workspaceInsights = useMemo(() => {
    const totalTopics = topics.length;
    const uniqueCategories = new Set(topics.map(topic => topic.category).filter(Boolean));
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    const stats = topics.reduce((acc, topic) => {
      const content = topic.content || '';
      const trimmed = content.trim();
      const words = trimmed ? trimmed.split(/\s+/).length : 0;
      acc.wordCount += words;

      const mediaMatches = content.match(/!\[[^\]]*\]\([^\)]+\)|\[[^\]]+\]\((?!#)[^\)]+\)/g);
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

  const handleStorageChange = useCallback(async (event) => {
    const nextKey = event.target.value;
    if (!nextKey || nextKey === storageKey) {
      return;
    }

    setIsSwitchingStorage(true);
    try {
      adapter.setAdapter(nextKey);
      setStorageKey(nextKey);
      const nextMeta = getCurrentAdapterMeta(nextKey);
      setStorageMeta(nextMeta);
      setStatusAnnouncement(`Switched to ${nextMeta.label}`);

      const loaded = await adapter.loadTopics();
      if (Array.isArray(loaded) && loaded.length > 0) {
        setTopics(loaded);
        setSelectedTopic(loaded[0]);
        setIsEditing(false);
        setPreviewUrl('');
      }
    } catch (error) {
      setStatusAnnouncement('Failed to load topics after switching storage');
    } finally {
      setIsSwitchingStorage(false);
    }
  }, [storageKey, setTopics, setSelectedTopic, setIsEditing, setPreviewUrl, setStatusAnnouncement]);

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

  const updateSelectionRef = useCallback(() => {
    const textarea = editTextareaRef.current;
    if (!textarea) return;
    lastSelectionRef.current = {
      start: typeof textarea.selectionStart === 'number' ? textarea.selectionStart : 0,
      end: typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : 0
    };
  }, []);

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

  const handleAddTopic = () => {
    if (newTopicTitle.trim()) {
      const newTopic = {
        id: Date.now(),
        title: newTopicTitle,
        category: newTopicCategory || 'Uncategorized',
        content: '',
        lastModified: new Date().toISOString()
      };
      setTopics([...topics, newTopic]);
      setSelectedTopic(newTopic);
      setNewTopicTitle('');
      setNewTopicCategory('');
      setShowNewTopicModal(false);
      setIsEditing(true);
      setEditContent('');
    }
  };

  const handleDeleteTopic = (id) => {
    if (window.confirm('Delete this topic?')) {
      const currentIndex = filteredTopics.findIndex(t => t.id === id);
      const nextCandidate = filteredTopics[currentIndex + 1] || filteredTopics[currentIndex - 1] || null;
      const newTopics = topics.filter(t => t.id !== id);
      setTopics(newTopics);
      if (selectedTopic?.id === id) {
        setSelectedTopic(nextCandidate || null);
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
    setIsEditing(true);
    setPreviewUrl(''); // Close preview when editing
  };

  const handleSave = () => {
    const updatedTopics = topics.map(t =>
      t.id === selectedTopic.id
        ? { ...t, content: editContent, lastModified: new Date().toISOString() }
        : t
    );
    setTopics(updatedTopics);
    setSelectedTopic({ ...selectedTopic, content: editContent, lastModified: new Date().toISOString() });
    setIsEditing(false);
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      const md = `\n![Image](${imageUrl})\n`;
      setEditContent(prev => prev + md);
      setImageUrl('');
      setShowImageModal(false);
    }
  };

  const handleAddLink = () => {
    if (linkUrl.trim()) {
      const url = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;
      const title = linkTitle.trim() || url;
      const md = `\n[${title}](${url})\n`;
      setEditContent(prev => prev + md);
      setLinkUrl('');
      setLinkTitle('');
      setShowLinkModal(false);
    }
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

  const handleContentClick = (e) => {
    if (e.target.tagName === 'A') {
      e.preventDefault();
      const href = e.target.getAttribute('href');
      if (href) {
        setPreviewUrl(href);
      }
    }
  };

  const hasPreview = previewUrl && !isEditing;

  const liveAnnouncements = [previewAnnouncement, linkPreviewAnnouncement, statusAnnouncement, topicAnnouncement, topicCountAnnouncement]
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
    />

      <section
        role="region"
        aria-label="Workspace insights"
        style={{
          background: 'linear-gradient(135deg, rgba(224,242,254,0.8), rgba(224,231,255,0.9))',
          borderBottom: '1px solid rgba(148,163,184,0.3)'
        }}
      >
        <div
          style={{
            padding: '0.8rem 2.2rem 1rem'
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: '0.6rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))'
            }}
          >
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minWidth: 0
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      flex: 1,
                      minWidth: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {label}
                  </span>
                  <span
                    data-testid={`insight-${id}-value`}
                    style={{
                      fontSize: '1.3rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      lineHeight: 1,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {value}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#475569',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {hint}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar (extracted) */}
        <Sidebar
          filteredTopics={filteredTopics}
          selectedTopic={selectedTopic}
          setSelectedTopic={setSelectedTopic}
          setPreviewUrl={setPreviewUrl}
          focusTopicById={focusTopicById}
          handleDeleteTopic={handleDeleteTopic}
          topicListRef={topicListRef}
          topicsListboxId={topicsListboxId}
          activeTopicOptionId={activeTopicOptionId}
          handleTopicListKeyDown={handleTopicListKeyDown}
          topicRefs={topicRefs}
          newTopicButtonRef={newTopicButtonRef}
          setShowNewTopicModal={setShowNewTopicModal}
          showNewTopicModal={showNewTopicModal}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchHelpId={searchHelpId}
          topicCountLabelId={topicCountLabelId}
          topicCountAnnouncement={topicCountAnnouncement}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categoryFilterLabelId={categoryFilterLabelId}
          categoryFilterSelectId={categoryFilterSelectId}
          categoryFilterHelpId={categoryFilterHelpId}
        />

        {/* Main Content */}
        <main
          id="main-content"
          tabIndex={-1}
          style={{ 
            flex: hasPreview ? 1 : 2, 
            display: 'flex', 
            flexDirection: 'column',
            borderRight: hasPreview ? '1px solid #e2e8f0' : 'none'
          }}
          aria-label="Selected topic content"
        >
          {selectedTopic ? (
            <>
              <div style={{
                backgroundColor: 'rgba(79,70,229,0.07)', // slightly stronger light indigo tint
                padding: '0.15rem 1.25rem 0.6rem 1.25rem', // further reduced top padding for tighter layout
                /* removed border-bottom separator to merge topic/category area with content */
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center', // align Save button with title line
                gap: '0.75rem'
              }}>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', margin: 0, lineHeight: 1 }}>{selectedTopic.title}</h2>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.15rem 0 0' }}>
                    {selectedTopic.category} • {new Date(selectedTopic.lastModified).toLocaleString()}
                  </p>
                </div>
                {!isEditing ? (
                  <button
                    onClick={startEditing}
                    style={{
                      backgroundColor: '#4f46e5',
                      color: 'white',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '0.375rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <EditIcon />
                    <span style={{ display: 'inline-block', marginTop: '-1px' }}>Edit</span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={handleSave}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '0.375rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <SaveIcon />
                      <span style={{ display: 'inline-block', marginTop: '-1px' }}>Save</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      style={{
                        backgroundColor: '#64748b',
                        color: 'white',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '0.375rem',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div 
                style={{ 
                  flex: 1, 
                  overflow: 'auto', 
                  padding: '2rem' 
                }}
                onClick={handleContentClick}
              >
                {isEditing ? (
                  <Editor
                    editContent={editContent}
                    setEditContent={setEditContent}
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
                    previewHtml={sanitize(renderMarkdown(editContent))}
                    handleContentClick={handleContentClick}
                  />
                ) : (
                  <div style={{ lineHeight: 1.6 }}>
                    <Preview html={sanitize(renderMarkdown(selectedTopic.content))} onContentClick={handleContentClick} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div
              role="status"
              aria-live="polite"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textAlign: 'center', padding: '2rem' }}
            >
              <div>
                <BookIcon />
                <p style={{ marginTop: '1rem', fontSize: '1.25rem' }}>Select a topic to get started</p>
              </div>
            </div>
          )}
        </main>

        {/* Link Preview Pane */}
        {hasPreview && (
  <aside
    aria-label="Link preview"
    style={{ 
      width: '400px',
      backgroundColor: 'white', 
      display: 'flex', 
      flexDirection: 'column',
      borderLeft: '1px solid #e2e8f0'
    }}
  >
    <div style={{
      padding: '1rem 1.5rem',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <h3 style={{ fontWeight: '600', color: '#1e293b' }}>Link Preview</h3>
      <button 
        onClick={() => setPreviewUrl('')}
        style={{
          background: 'none',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          fontSize: '1.25rem',
          padding: '0.25rem',
          borderRadius: '0.25rem'
        }}
        aria-label="Close link preview"
        aria-expanded={hasPreview ? 'true' : 'false'}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        &times;
      </button>
    </div>
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      <iframe
        src={previewUrl}
        title="Link Preview"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          minHeight: '300px' // Fallback height
        }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={(e) => {
          const iframe = e.target;
          const fallbackMessage = document.getElementById('fallback-message');
          
          // More reliable cross-origin detection
          setTimeout(() => {
            try {
              // Try to access iframe properties that will throw on cross-origin
              const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
              // If we can access the document, it's same-origin
              if (iframeDocument && iframeDocument.body) {
                fallbackMessage.style.display = 'none';
              } else {
                fallbackMessage.style.display = 'flex';
              }
            } catch (error) {
              // Cross-origin error caught - show fallback
              fallbackMessage.style.display = 'flex';
            }
          }, 100); // Small delay to ensure iframe has loaded
        }}
        onError={() => {
          // Handle iframe loading errors
          document.getElementById('fallback-message').style.display = 'flex';
        }}
      />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        color: '#64748b',
        zIndex: 2,
        flexDirection: 'column',
        gap: '0.5rem'
      }} id="fallback-message" role="status" aria-live="polite">
        <div style={{ fontSize: '1.5rem' }}>⚠️</div>
        <p style={{ margin: 0 }}>This website cannot be embedded.</p>
        <a 
          href={previewUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: '#4f46e5', 
            textDecoration: 'underline',
            padding: '0.5rem 1rem',
            border: '1px solid #4f46e5',
            borderRadius: '0.375rem',
            marginTop: '0.5rem'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#4f46e5'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          Open in New Tab
        </a>
      </div>
    </div>
  </aside>
)}
      </div>

      {/* Modals */}
      {showNewTopicModal && (
        <Modal
          onClose={closeNewTopicModal}
          labelledBy={newTopicHeadingId}
          initialFocusRef={newTopicTitleRef}
        >
          <h2 id={newTopicHeadingId} style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Create New Topic</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Topic Title</label>
              <input
                type="text"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                ref={newTopicTitleRef}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
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
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                placeholder="Optional"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button data-testid="btn-create-topic"
              onClick={handleAddTopic}
              disabled={!newTopicTitle.trim()}
              style={{
                flex: 1,
                backgroundColor: '#4f46e5',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                opacity: !newTopicTitle.trim() ? 0.6 : 1
              }}
            >
              Create
            </button>
            <button
              onClick={() => {
                closeNewTopicModal();
                setNewTopicTitle('');
                setNewTopicCategory('');
              }}
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
          <h2 id={imageModalHeadingId} style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Add Image</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Image URL</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                ref={imageUrlInputRef}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                placeholder="https://example.com/image.jpg"
                aria-describedby={imageUrlHelpId}
              />
              <span id={imageUrlHelpId} style={srOnlyStyles}>
                Enter a direct image link. The image will be inserted into your note using Markdown syntax.
              </span>
            </div>
            {imageUrl && (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Preview:</p>
                <img src={imageUrl} alt="Preview" style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              data-testid="btn-add-image"
              onClick={handleAddImage}
              disabled={!imageUrl.trim()}
              style={{
                flex: 1,
                backgroundColor: '#3b82f6',
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
              onClick={() => { setShowImageModal(false); setImageUrl(''); }}
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
          <h2 id={linkModalHeadingId} style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Add Link</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Link URL</label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                ref={linkUrlInputRef}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                placeholder="https://example.com"
                aria-describedby={linkUrlHelpId}
              />
              <span id={linkUrlHelpId} style={srOnlyStyles}>
                Provide the destination address. If it lacks a protocol, https will be added automatically.
              </span>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Link Text (Optional)</label>
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
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
          <h2 id={resetModalHeadingId} style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Reset stored data?</h2>
          <p id={resetModalDescriptionId} style={{ marginBottom: '1rem', color: '#475569' }}>This will clear persisted topics in your selected storage adapter. This action cannot be undone.</p>
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
    </div>
    </>
  );
};

export default App;
