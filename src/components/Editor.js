import React, { useRef } from 'react';
import { ImageIcon, LinkIcon, PaletteIcon, UploadImageIcon } from './icons';
import Preview from './Preview';

export default function Editor({
  editContent,
  setEditContent,
  updateSelectionRef,
  applyMarkdownFormatting,
  isColorPickerOpen,
  setIsColorPickerOpen,
  textColorOptions,
  textColorMenuId,
  textColorHelpId,
  setShowImageModal,
  setShowLinkModal,
  editTextareaRef,
  previewHtml,
  handleContentClick
}) {
  const uploadInputRef = useRef(null);

  const insertTextAtCursor = (textToInsert) => {
    const textarea = editTextareaRef?.current;
    if (!textarea) {
      setEditContent((editContent || '') + textToInsert);
      return;
    }

    const start = textarea.selectionStart ?? (editContent || '').length;
    const end = textarea.selectionEnd ?? start;
    const before = (editContent || '').slice(0, start);
    const after = (editContent || '').slice(end);
    const next = before + textToInsert + after;
    setEditContent(next);

    // Best-effort caret restore
    requestAnimationFrame(() => {
      try {
        textarea.focus();
        const caret = start + textToInsert.length;
        textarea.setSelectionRange(caret, caret);
      } catch (e) {
        // no-op
      }
      updateSelectionRef();
    });
  };

  const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  const getImageDimensions = (src) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    img.onerror = () => resolve({ width: null, height: null });
    img.src = src;
  });

  const handleUploadChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    // Reset input so selecting the same file again triggers onChange
    e.target.value = '';

    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) return;

    try {
      const dataUrl = await readFileAsDataURL(file);
      const { width, height } = await getImageDimensions(dataUrl);
      const safeAlt = (file.name || 'Image').replace(/\.[^/.]+$/, '');
      const metaTitle = width && height ? `w=${width} h=${height}` : '';
      const titlePart = metaTitle ? ` "${metaTitle}"` : '';
      const md = `\n\n![${safeAlt}](${dataUrl}${titlePart})\n\n`;
      insertTextAtCursor(md);
    } catch (err) {
      // If something goes wrong, fail quietly (no modal/toast in current UX)
      // console.warn('Image upload failed', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', height: '100%' }}>
      <div style={{ flex: '1 1 320px', minWidth: '280px', display: 'flex', flexDirection: 'column' }}>
        <div
          role="toolbar"
          aria-label="Insert content into the note"
          aria-describedby="formatting-toolbar-help"
          style={{ 
            marginBottom: '1.5rem', 
            display: 'flex', 
            gap: '0.75rem', 
            flexWrap: 'wrap', 
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <span id="formatting-toolbar-help" style={{ position: 'absolute', left: -9999 }}>
            Use the formatting buttons to insert markdown at the current cursor position in the editor.
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { key: 'heading', label: 'H', title: 'Insert heading' },
              { key: 'bold', label: 'B', title: 'Bold' },
              { key: 'italic', label: 'I', title: 'Italic' },
              { key: 'underline', label: 'U', title: 'Underline' },
              { key: 'code', label: '`', title: 'Inline code' },
              { key: 'unordered-list', label: '•', title: 'Bulleted list' },
              { key: 'ordered-list', label: '1.', title: 'Numbered list' },
              { key: 'quote', label: '>', title: 'Block quote' }
            ].map(({ key, label, title }) => (
              <button
                key={key}
                type="button"
                onClick={() => applyMarkdownFormatting(key)}
                aria-label={title}
                title={title}
                style={{ 
                  width: '2.5rem', 
                  height: '2.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  boxShadow: 'var(--shadow-xs)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = 'var(--border-focus)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            {/* Icon-only palette button inline with other formatting icons */}
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={isColorPickerOpen ? 'true' : 'false'}
              aria-controls={textColorMenuId}
              aria-describedby={textColorHelpId}
              onClick={() => setIsColorPickerOpen(prev => !prev)}
              title="Text color"
              aria-label="Text color"
              style={{ width: '2.25rem', height: '2.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <PaletteIcon />
            </button>
            <span id={textColorHelpId} style={{ position: 'absolute', left: -9999 }}>
              Opens a list of text color options that wrap the selection with markdown syntax.
            </span>
            {isColorPickerOpen && (
              <div id={textColorMenuId} role="listbox" aria-label="Text color options" style={{ position: 'absolute', top: 'calc(100% + 0.5rem)', left: 0, display: 'flex', gap: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', boxShadow: 'var(--shadow-md)', zIndex: 10 }}>
                {textColorOptions.map(({ key, label, hex }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { applyMarkdownFormatting('color', { colorKey: key }); setIsColorPickerOpen(false); }}
                    aria-label={`Apply ${label} text color`}
                    data-testid={`color-option-${key}`}
                    role="option"
                    aria-selected="false"
                    style={{ width: '2rem', height: '2rem', borderRadius: '9999px', border: '2px solid var(--border-color)', backgroundColor: hex, cursor: 'pointer' }}
                  />
                ))}
              </div>
            )}
          </div>

          <span aria-hidden="true" style={{ width: '1px', height: '2rem', backgroundColor: 'var(--border-color)' }} />
          <button 
            type="button" 
            onClick={() => setShowImageModal(true)} 
            style={{ 
              background: 'var(--button-info)',
              color: 'white', 
              padding: '0.6rem 1rem', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '0.875rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
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
            <ImageIcon /> Add Image
          </button>
          <button
            type="button"
            onClick={() => uploadInputRef.current && uploadInputRef.current.click()}
            aria-label="Upload Image"
            title="Upload Image"
            style={{ 
              background: 'var(--button-info)',
              color: 'white', 
              padding: '0.6rem 1rem', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '0.875rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
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
            <UploadImageIcon /> Upload
          </button>
          <input
            ref={uploadInputRef}
            data-testid="image-upload-input"
            type="file"
            accept="image/*"
            onChange={handleUploadChange}
            style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
            tabIndex={-1}
            aria-hidden="true"
          />
          <button 
            type="button" 
            onClick={() => setShowLinkModal(true)} 
            style={{ 
              background: 'var(--button-primary)',
              color: 'white', 
              padding: '0.6rem 1rem', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '0.875rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
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
            <LinkIcon /> Add Link
          </button>
        </div>

        <label htmlFor="topic-content" style={{ position: 'absolute', left: -9999 }}>Topic content editor</label>
        <textarea data-testid="edit-textarea"
          id="topic-content"
          value={editContent}
          onChange={(e) => { setEditContent(e.target.value); updateSelectionRef(); }}
          onSelect={updateSelectionRef}
          onKeyUp={updateSelectionRef}
          onMouseUp={updateSelectionRef}
          placeholder="Write your notes here... (Markdown supported)"
          ref={editTextareaRef}
          style={{ 
            flex: 1, 
            padding: '1.25rem', 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--radius-lg)', 
            fontSize: '0.9375rem', 
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace', 
            resize: 'none', 
            lineHeight: 1.7, 
            backgroundColor: 'var(--bg-secondary)', 
            color: 'var(--text-primary)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all var(--transition-fast)'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-focus)';
            e.currentTarget.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.05), 0 0 0 3px rgba(139,92,246,0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.05)';
          }}
        />
      </div>

      <div style={{ 
        flex: '1 1 320px', 
        minWidth: '280px', 
        backgroundColor: 'var(--bg-secondary)', 
        padding: '1.5rem', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{ 
          fontWeight: '700', 
          marginBottom: '1.25rem', 
          color: 'var(--text-primary)',
          fontSize: '1.125rem',
          paddingBottom: '0.75rem',
          borderBottom: '2px solid var(--border-light)'
        }}>Preview</h3>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Preview html={previewHtml} onContentClick={handleContentClick} />
        </div>
      </div>
    </div>
  );
}
