import React from 'react';

// Simple preview component that receives sanitized HTML and renders it.
// Keeps markup rendering behavior centralized and provides a click
// handler for link previews.
export default function Preview({ html, onContentClick, style, className }) {
  return (
    <div
      className={className}
      style={style}
      onClick={onContentClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
