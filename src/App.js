import React, { useState, useEffect, useRef } from 'react';
import adapter from './lib/adapter';
import Modal from './components/Modal';
import { BookIcon, PlusIcon, EditIcon, SaveIcon, TrashIcon, ImageIcon, LinkIcon, SearchIcon, FolderIcon } from './components/icons';

// --- Markdown Renderer ---
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

  const categories = ['All', ...new Set(topics.map(t => t.category))];

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         topic.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || topic.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
      const newTopics = topics.filter(t => t.id !== id);
      setTopics(newTopics);
      if (selectedTopic?.id === id) {
        setSelectedTopic(newTopics[0] || null);
        setIsEditing(false);
        setPreviewUrl('');
      }
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

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#f8fafc'
    }}>
  {/* Header - CENTERED TITLE */}
  <header data-testid="app-header" style={{
        /* Nigeria flag slanted: green white green stripes (diagonal) */
        background: 'linear-gradient(135deg, #008751 0%, #008751 33%, #ffffff 33%, #ffffff 66%, #008751 66%, #008751 100%)',
        border: '3px solid #008751', // Nigeria green border
        padding: '1.25rem 2rem',
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
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ minWidth: 80, textAlign: 'right' }}>
            {savedStatus === 'saved' && <span style={{ color: '#063f0a', background: 'rgba(255,255,255,0.6)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: 600 }}>Saved</span>}
            {savedStatus === 'error' && <span style={{ color: '#7f1d1d', background: 'rgba(255,255,255,0.6)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: 600 }}>Save failed</span>}
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            title="Reset stored data"
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
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: '280px',
          backgroundColor: 'white',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <button
              data-testid="btn-new-topic"
              onClick={() => setShowNewTopicModal(true)}
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
              <span style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: '#94a3b8' }}>
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '2.25rem',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  backgroundColor: selectedCategory === cat ? '#4f46e5' : 'white',
                  color: selectedCategory === cat ? 'white' : '#475569',
                  border: selectedCategory === cat ? 'none' : '1px solid #cbd5e1',
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredTopics.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ marginBottom: '1rem' }}><FolderIcon /></div>
                <p>No topics found</p>
              </div>
            ) : (
              filteredTopics.map(topic => (
                <div
                  key={topic.id}
                  onClick={() => { setSelectedTopic(topic); setPreviewUrl(''); }}
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: selectedTopic?.id === topic.id ? '#eef2ff' : 'white',
                    borderLeft: selectedTopic?.id === topic.id ? '4px solid #4f46e5' : 'none'
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
        </div>

        {/* Main Content */}
        <div style={{ 
          flex: hasPreview ? 1 : 2, 
          display: 'flex', 
          flexDirection: 'column',
          borderRight: hasPreview ? '1px solid #e2e8f0' : 'none'
        }}>
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
                  <div style={{ display: 'flex', height: '100%', gap: '2rem', flexDirection: 'column', '@media (min-width: 768px)': { flexDirection: 'row' } }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setShowImageModal(true)}
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
                          onClick={() => setShowLinkModal(true)}
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
                      <textarea data-testid="edit-textarea"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Write your notes here... (Markdown supported)"
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

                    <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
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
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
              <div>
                <BookIcon />
                <p style={{ marginTop: '1rem', fontSize: '1.25rem' }}>Select a topic to get started</p>
              </div>
            </div>
          )}
        </div>

        {/* Link Preview Pane */}
        {hasPreview && (
  <div style={{ 
    width: '400px',
    backgroundColor: 'white', 
    display: 'flex', 
    flexDirection: 'column',
    borderLeft: '1px solid #e2e8f0'
  }}>
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
      }} id="fallback-message">
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
  </div>
)}
      </div>

      {/* Modals */}
      {showNewTopicModal && (
        <Modal onClose={() => setShowNewTopicModal(false)}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Create New Topic</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Topic Title</label>
              <input
                type="text"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                placeholder="Enter topic title"
                autoFocus
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Category</label>
              <input
                type="text"
                value={newTopicCategory}
                onChange={(e) => setNewTopicCategory(e.target.value)}
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
                setShowNewTopicModal(false);
                setNewTopicTitle('');
                setNewTopicCategory('');
              }}
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
          </div>
        </Modal>
      )}

      {showImageModal && (
        <Modal onClose={() => { setShowImageModal(false); setImageUrl(''); }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Add Image</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Image URL</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                placeholder="https://example.com/image.jpg"
                autoFocus
              />
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
          </div>
        </Modal>
      )}

      {showLinkModal && (
        <Modal onClose={() => { setShowLinkModal(false); setLinkUrl(''); setLinkTitle(''); }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Add Link</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Link URL</label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                placeholder="https://example.com"
                autoFocus
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Link Text (Optional)</label>
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                placeholder="Click here"
              />
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
              onClick={() => { setShowLinkModal(false); setLinkUrl(''); setLinkTitle(''); }}
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
          </div>
        </Modal>
      )}

      {showResetConfirm && (
        <Modal onClose={() => setShowResetConfirm(false)}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Reset stored data?</h2>
          <p style={{ marginBottom: '1rem', color: '#475569' }}>This will clear persisted topics in your selected storage adapter. This action cannot be undone.</p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              onClick={async () => {
                const ok = await adapter.clearTopics();
                setShowResetConfirm(false);
                if (ok) window.location.reload();
                else alert('Failed to clear storage');
              }}
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
              onClick={() => setShowResetConfirm(false)}
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
          </div>
        </Modal>
      )}
    </div>
  );
};

export default App;
