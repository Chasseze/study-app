import React from 'react';
import { ImageIcon, LinkIcon, PaletteIcon } from './icons';
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
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', height: '100%' }}>
      <div style={{ flex: '1 1 320px', minWidth: '280px', display: 'flex', flexDirection: 'column' }}>
        <div
          role="toolbar"
          aria-label="Insert content into the note"
          aria-describedby="formatting-toolbar-help"
          style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}
        >
          <span id="formatting-toolbar-help" style={{ position: 'absolute', left: -9999 }}>
            Use the formatting buttons to insert markdown at the current cursor position in the editor.
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => applyMarkdownFormatting('heading')}
              aria-label="Insert heading"
              title="Insert heading"
              style={{ width: '2.25rem', height: '2.25rem' }}
            >H</button>
            <button type="button" onClick={() => applyMarkdownFormatting('bold')} aria-label="Bold" title="Bold" style={{ width: '2.25rem', height: '2.25rem' }}>B</button>
            <button type="button" onClick={() => applyMarkdownFormatting('italic')} aria-label="Italic" title="Italic" style={{ width: '2.25rem', height: '2.25rem' }}>I</button>
            <button type="button" onClick={() => applyMarkdownFormatting('underline')} aria-label="Underline" title="Underline" style={{ width: '2.25rem', height: '2.25rem' }}>U</button>
            <button type="button" onClick={() => applyMarkdownFormatting('code')} aria-label="Inline code" title="Inline code" style={{ width: '2.25rem', height: '2.25rem' }}>`</button>
            <button type="button" onClick={() => applyMarkdownFormatting('unordered-list')} aria-label="Bulleted list" title="Bulleted list" style={{ width: '2.25rem', height: '2.25rem' }}>•</button>
            <button type="button" onClick={() => applyMarkdownFormatting('ordered-list')} aria-label="Numbered list" title="Numbered list" style={{ width: '2.25rem', height: '2.25rem' }}>1.</button>
            <button type="button" onClick={() => applyMarkdownFormatting('quote')} aria-label="Block quote" title="Block quote" style={{ width: '2.25rem', height: '2.25rem' }}>&gt;</button>
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
              <div id={textColorMenuId} role="listbox" aria-label="Text color options" style={{ position: 'absolute', top: 'calc(100% + 0.5rem)', left: 0, display: 'flex', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.375rem', boxShadow: '0 10px 25px -12px rgba(15, 23, 42, 0.45)', zIndex: 10 }}>
                {textColorOptions.map(({ key, label, hex }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { applyMarkdownFormatting('color', { colorKey: key }); setIsColorPickerOpen(false); }}
                    aria-label={`Apply ${label} text color`}
                    data-testid={`color-option-${key}`}
                    role="option"
                    aria-selected="false"
                    style={{ width: '2rem', height: '2rem', borderRadius: '9999px', border: '2px solid #e2e8f0', backgroundColor: hex, cursor: 'pointer' }}
                  />
                ))}
              </div>
            )}
          </div>

          <span aria-hidden="true" style={{ width: '1px', height: '1.75rem', backgroundColor: '#e2e8f0' }} />
          <button type="button" onClick={() => setShowImageModal(true)} style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
            <ImageIcon /> Add Image
          </button>
          <button type="button" onClick={() => setShowLinkModal(true)} style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
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
          style={{ flex: 1, padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.875rem', fontFamily: 'monospace', resize: 'none', lineHeight: 1.5 }}
        />
      </div>

      <div style={{ flex: '1 1 320px', minWidth: '280px', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontWeight: '600', marginBottom: '1rem', color: '#334155' }}>Preview</h3>
        <Preview html={previewHtml} onContentClick={handleContentClick} />
      </div>
    </div>
  );
}
