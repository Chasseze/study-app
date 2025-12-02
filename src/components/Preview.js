import React from 'react';

// Simple preview component that receives sanitized HTML and renders it.
// Keeps markup rendering behavior centralized and provides a click
// handler for link previews.
export default function Preview({ html, previewHtml, onContentClick, handleContentClick, style, className, previewRef }) {
  const content = html || previewHtml;
  const clickHandler = onContentClick || handleContentClick;
  
  return (
    <div
      ref={previewRef}
      className={className}
      style={style}
      onClick={clickHandler}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
