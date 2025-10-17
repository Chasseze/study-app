import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import adapter, { getCurrentAdapterMeta, getCurrentAdapterKey, listAdapters } from './lib/adapter';
import Modal from './components/Modal';
import { BookIcon, PlusIcon, EditIcon, SaveIcon, TrashIcon, ImageIcon, LinkIcon, SearchIcon, FolderIcon, BoldIcon, ItalicIcon, HeadingIcon, UnderlineIcon, ListIcon, NumberedListIcon, QuoteIcon, CodeIcon, PaletteIcon, StorageIcon } from './components/icons';

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
  const saveTimer = useRef(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [savedStatus, setSavedStatus] = useState(null); // null | 'saved' | 'error'
  const savedTimer = useRef(null);
  const [previewAnnouncement, setPreviewAnnouncement] = useState('');
  const [linkPreviewAnnouncement, setLinkPreviewAnnouncement] = useState('');
  const [statusAnnouncement, setStatusAnnouncement] = useState('');
  const [topicAnnouncement, setTopicAnnouncement] = useState('');
  const [topicCountAnnouncement, setTopicCountAnnouncement] = useState('');
  const [isSkipLinkFocused, setIsSkipLinkFocused] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [storageKey, setStorageKey] = useState(() => getCurrentAdapterKey());
  const [storageMeta, setStorageMeta] = useState(() => getCurrentAdapterMeta());
  const [isSwitchingStorage, setIsSwitchingStorage] = useState(false);
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

  const categories = ['All', ...new Set(topics.map(t => t.category))];

  const newTopicHeadingId = 'modal-new-topic-title';
  const imageModalHeadingId = 'modal-image-title';
  const linkModalHeadingId = 'modal-link-title';
  const resetModalHeadingId = 'modal-reset-title';
  const resetModalDescriptionId = 'modal-reset-description';
  const resetButtonDescriptionId = 'reset-button-description';
  const storageDescriptionId = 'storage-indicator-description';
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
  const formattingToolbarHelpId = 'formatting-toolbar-help';

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
        if (!Number.isNaN(modifiedTime) && now - modifiedTime <= sevenDaysMs) {
          acc.activeThisWeek += 1;
        }
      }

      return acc;
    }, { wordCount: 0, mediaCount: 0, activeThisWeek: 0 });

    const readingMinutes = stats.wordCount > 0
      ? Math.max(1, Math.round(stats.wordCount / 180))
      : 0;

    return [
      {
        id: 'topics',
        label: 'Topics',
        value: totalTopics.toLocaleString(),
        hint: 'Total notes saved in your workspace.'
      },
      {
        id: 'categories',
        label: 'Categories',
        value: uniqueCategories.size.toLocaleString(),
        hint: 'Distinct study areas represented.'
      },
      {
        id: 'active',
        label: 'Active this week',
        value: stats.activeThisWeek.toLocaleString(),
        hint: 'Notes updated in the last 7 days.'
      },
      {
        id: 'media',
        label: 'Media attachments',
        value: stats.mediaCount.toLocaleString(),
        hint: 'Links and images tracked across notes.'
      },
      {
        id: 'reading',
        label: 'Reading minutes',
        value: readingMinutes > 0 ? `${readingMinutes} min` : '—',
        hint: 'Estimated skim time at 180 words per minute.'
      }
    ];
  }, [topics]);

  const storageOptions = useMemo(() => {
    const supportedKeys = new Set(['local', 'idb']);
    return listAdapters().filter(({ key }) => supportedKeys.has(key));
  }, []);

  const storageLabel = storageMeta?.label || 'Unknown storage';
  const storageShortLabel = storageMeta?.shortLabel || 'Unknown';
  const storageDescription = storageMeta?.description || 'Storage provider could not be determined.';

  useEffect(() => {
    const count = filteredTopics.length;
    if (count === 0) {
      setTopicCountAnnouncement('No topics match the current filters');
    } else {
      setTopicCountAnnouncement(`Showing ${count} topic${count === 1 ? '' : 's'} in the list`);
    }
  }, [filteredTopics.length]);

  // Load persisted topics on mount (async adapter)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const loaded = await adapter.loadTopics();
        if (mounted && Array.isArray(loaded) && loaded.length > 0) {
          setTopics(loaded);
          setSelectedTopic(loaded[0] || null);
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Auto-save while editing
  useEffect(() => {
    if (isEditing && selectedTopic) {
      const timer = setTimeout(() => {
        const updatedTopics = topics.map(t =>
          t.id === selectedTopic.id
            ? { ...t, content: editContent, lastModified: new Date().toISOString() }
            : t
        );
        setTopics(updatedTopics);
        setSelectedTopic({ ...selectedTopic, content: editContent, lastModified: new Date().toISOString() });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [editContent, isEditing, selectedTopic, topics]);

  // Persist topics via adapter (debounced, async)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const ok = await adapter.saveTopics(topics);
        setSavedStatus(ok ? 'saved' : 'error');
      } catch (e) {
        setSavedStatus('error');
      }
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSavedStatus(null), 1200);
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [topics]);

  useEffect(() => {
    if (!isEditing) return;
    setPreviewAnnouncement('Preview updated');
    const timer = setTimeout(() => setPreviewAnnouncement(''), 800);
    return () => clearTimeout(timer);
  }, [editContent, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setIsColorPickerOpen(false);
      return;
    }

    const textarea = editTextareaRef.current;
    if (textarea) {
      lastSelectionRef.current = {
        start: typeof textarea.selectionStart === 'number' ? textarea.selectionStart : textarea.value.length,
        end: typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : textarea.value.length
      };
    }
  }, [isEditing]);

  useEffect(() => {
    if (previewUrl) {
      setLinkPreviewAnnouncement('Link preview opened');
    } else {
      setLinkPreviewAnnouncement('');
    }
  }, [previewUrl]);

  useEffect(() => {
    if (savedStatus === 'saved') {
      setStatusAnnouncement('All changes saved');
    } else if (savedStatus === 'error') {
      setStatusAnnouncement('Saving failed');
    } else {
      setStatusAnnouncement('');
    }
  }, [savedStatus]);

  useEffect(() => {
    if (!selectedTopic) {
      setTopicAnnouncement('No topic selected');
      return;
    }
    setTopicAnnouncement(`Selected topic ${selectedTopic.title} in category ${selectedTopic.category}`);
  }, [selectedTopic]);

  const focusTopicById = useCallback((id) => {
    if (!id) return;
    requestAnimationFrame(() => {
      const node = topicRefs.current.get(id);
      if (node && typeof node.focus === 'function') {
        node.focus();
      }
    });
  }, []);

  const focusTopicList = useCallback(() => {
    requestAnimationFrame(() => {
      topicListRef.current?.focus?.();
    });
  }, []);

  const isModalOpen = showNewTopicModal || showImageModal || showLinkModal || showResetConfirm;

  const updateSelectionRef = useCallback(() => {
    const textarea = editTextareaRef.current;
    if (!textarea) return;
    lastSelectionRef.current = {
      start: textarea.selectionStart ?? 0,
      end: textarea.selectionEnd ?? 0
    };
  }, []);

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
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#f8fafc',
      position: 'relative'
    }}>
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
  {/* Header - CENTERED TITLE */}
  <header data-testid="app-header" style={{
        /* Nigeria flag slanted: green white green stripes (diagonal) */
        background: 'linear-gradient(135deg, #008751 0%, #008751 33%, #ffffff 33%, #ffffff 66%, #008751 66%, #008751 100%)',
        border: '3px solid #008751', // Nigeria green border
  padding: '0.6rem 1.6rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <BookIcon />
          <h1 style={{ color: '#003d1a', fontSize: '2.5rem', fontWeight: '800', letterSpacing: '0.5px' }}>
            Personal Study Note
          </h1>
        </div>
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
          <div
            aria-describedby={storageDescriptionId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: '#0f172a',
              backgroundColor: 'rgba(255,255,255,0.72)',
              borderRadius: '0.4rem',
              padding: '0.03rem 0.55rem',
              border: '1px solid rgba(15,23,42,0.08)'
            }}
            title={storageDescription}
          >
            <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center', color: '#475569' }}>
              <StorageIcon />
            </span>
            <span style={srOnlyStyles}>Active storage</span>
            <span>{storageShortLabel}</span>
          </div>
          <label htmlFor={storageSelectId} id={storageSelectLabelId} style={srOnlyStyles}>
            Choose where notes are stored
          </label>
          <select
            id={storageSelectId}
            aria-labelledby={storageSelectLabelId}
            value={storageKey}
            onChange={handleStorageChange}
            disabled={isSwitchingStorage}
            style={{
              fontSize: '0.8rem',
              borderRadius: '0.3rem',
              border: '1px solid rgba(15,23,42,0.16)',
              backgroundColor: 'rgba(255,255,255,0.9)',
              padding: '0.2rem 0.45rem',
              color: '#0f172a',
              cursor: isSwitchingStorage ? 'progress' : 'pointer',
              minWidth: '4.5rem'
            }}
            title="Switch storage backend"
          >
            {storageOptions.map(option => (
              <option key={option.key} value={option.key}>
                {option.shortLabel}
              </option>
            ))}
          </select>
          <span id={storageDescriptionId} style={srOnlyStyles}>
            {storageDescription}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div
              style={{ minWidth: 80, textAlign: 'right' }}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {savedStatus === 'saved' && <span style={{ color: '#063f0a', background: 'rgba(255,255,255,0.6)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: 600 }}>Saved</span>}
              {savedStatus === 'error' && <span style={{ color: '#7f1d1d', background: 'rgba(255,255,255,0.6)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: 600 }}>Save failed</span>}
            </div>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              title="Reset stored data"
              aria-describedby={resetButtonDescriptionId}
              aria-haspopup="dialog"
              aria-expanded={showResetConfirm ? 'true' : 'false'}
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              Reset Data
            </button>
            <span id={resetButtonDescriptionId} style={srOnlyStyles}>
              Clears all persisted topics from the configured storage adapter and reloads the page.
            </span>
          </div>
        </div>
      </header>

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
        {/* Sidebar */}
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
              <label htmlFor="topic-search" style={srOnlyStyles}>Search topics</label>
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
              <span id={searchHelpId} style={srOnlyStyles}>
                Search topics by title or note content. Results update immediately and appear in the topics list below.
              </span>
              <span
                id={topicCountLabelId}
                aria-live="polite"
                style={srOnlyStyles}
              >
                {topicCountAnnouncement}
              </span>
            </div>
          </div>

          <div
            style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}
          >
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
            <span id={categoryFilterHelpId} style={srOnlyStyles}>
              Choose a category from the dropdown to narrow the topics list. Select All to clear the filter.
            </span>
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
              <div
                role="status"
                aria-live="polite"
                style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}
              >
                <div style={{ marginBottom: '1rem' }}><FolderIcon /></div>
                <p>No topics found</p>
              </div>
            ) : (
              filteredTopics.map(topic => (
                <div
                  key={topic.id}
                  onClick={() => { setSelectedTopic(topic); setPreviewUrl(''); focusTopicById(topic.id); }}
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
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
                      <h3 style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topic.title}</h3>
                      <span style={{
                        fontSize: '0.75rem',
                        backgroundColor: '#eef2ff',
                        color: '#4f46e5',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px'
                      }}>
                        {topic.category}
                      </span>
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
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                    Modified: {new Date(topic.lastModified).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>

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
                backgroundColor: 'white',
                padding: '1.5rem 2rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>{selectedTopic.title}</h2>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    Category: {selectedTopic.category} • Last modified: {new Date(selectedTopic.lastModified).toLocaleString()}
                  </p>
                </div>
                {!isEditing ? (
                  <button
                    onClick={startEditing}
                    style={{
                      backgroundColor: '#4f46e5',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <EditIcon /> Edit
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={handleSave}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.375rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <SaveIcon /> Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      style={{
                        backgroundColor: '#64748b',
                        color: 'white',
                        padding: '0.5rem 1rem',
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', height: '100%' }}>
                    <div style={{ flex: '1 1 320px', minWidth: '280px', display: 'flex', flexDirection: 'column' }}>
                      <div
                        role="toolbar"
                        aria-label="Insert content into the note"
                        aria-describedby={formattingToolbarHelpId}
                        style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}
                      >
                        <span id={formattingToolbarHelpId} style={srOnlyStyles}>
                          Use the formatting buttons to insert markdown at the current cursor position in the editor.
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {formattingButtons.map(({ key, label, icon }) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => applyMarkdownFormatting(key)}
                              aria-label={label}
                              title={label}
                              style={{
                                width: '2.25rem',
                                height: '2.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: '0.375rem',
                                color: '#334155',
                                cursor: 'pointer',
                                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)'
                              }}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            aria-haspopup="true"
                            aria-expanded={isColorPickerOpen ? 'true' : 'false'}
                            aria-controls={textColorMenuId}
                            aria-describedby={textColorHelpId}
                            onClick={() => setIsColorPickerOpen(prev => !prev)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '0.375rem',
                              color: '#334155',
                              cursor: 'pointer',
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.875rem',
                              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)'
                            }}
                          >
                            <PaletteIcon />
                            Text color
                          </button>
                          <span id={textColorHelpId} style={srOnlyStyles}>
                            Opens a list of text color options that wrap the selection with markdown syntax.
                          </span>
                          {isColorPickerOpen && (
                            <div
                              id={textColorMenuId}
                              role="listbox"
                              aria-label="Text color options"
                              style={{
                                position: 'absolute',
                                top: 'calc(100% + 0.5rem)',
                                left: 0,
                                display: 'flex',
                                gap: '0.5rem',
                                padding: '0.5rem',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.375rem',
                                boxShadow: '0 10px 25px -12px rgba(15, 23, 42, 0.45)',
                                zIndex: 10
                              }}
                            >
                              {textColorOptions.map(({ key, label, hex }) => (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => {
                                    applyMarkdownFormatting('color', { colorKey: key });
                                    setIsColorPickerOpen(false);
                                  }}
                                  aria-label={`Apply ${label} text color`}
                                  data-testid={`color-option-${key}`}
                                  role="option"
                                  aria-selected="false"
                                  style={{
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '9999px',
                                    border: '2px solid #e2e8f0',
                                    backgroundColor: hex,
                                    cursor: 'pointer'
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <span aria-hidden="true" style={{ width: '1px', height: '1.75rem', backgroundColor: '#e2e8f0' }} />
                        <button
                          type="button"
                          onClick={() => setShowImageModal(true)}
                          aria-haspopup="dialog"
                          aria-expanded={showImageModal ? 'true' : 'false'}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0.375rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          <ImageIcon /> Add Image
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowLinkModal(true)}
                          aria-haspopup="dialog"
                          aria-expanded={showLinkModal ? 'true' : 'false'}
                          style={{
                            backgroundColor: '#8b5cf6',
                            color: 'white',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0.375rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          <LinkIcon /> Add Link
                        </button>
                      </div>
                      <label htmlFor="topic-content" style={srOnlyStyles}>Topic content editor</label>
                      <textarea data-testid="edit-textarea"
                        id="topic-content"
                        value={editContent}
                        onChange={(e) => {
                          setEditContent(e.target.value);
                          updateSelectionRef();
                        }}
                        onSelect={updateSelectionRef}
                        onKeyUp={updateSelectionRef}
                        onMouseUp={updateSelectionRef}
                        placeholder="Write your notes here... (Markdown supported)"
                        ref={editTextareaRef}
                        style={{
                          flex: 1,
                          padding: '1rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontFamily: 'monospace',
                          resize: 'none',
                          lineHeight: 1.5
                        }}
                      />
                    </div>

                    <div style={{ flex: '1 1 320px', minWidth: '280px', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontWeight: '600', marginBottom: '1rem', color: '#334155' }}>Preview</h3>
                      <div
                        style={{ lineHeight: 1.6 }}
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent) }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ lineHeight: 1.6 }}>
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedTopic.content) }} />
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
  );
};

export default App;
