import { marked } from 'marked';
import sanitize from './sanitize';

// Text color mapping for custom syntax
const textColorMap = {
  slate: '#334155',
  indigo: '#4338ca',
  emerald: '#047857',
  amber: '#b45309',
  rose: '#be123c',
  sky: '#0369a1'
};

// Configure marked with custom renderer
const renderer = new marked.Renderer();

// Custom heading renderer with inline styles
renderer.heading = (text, level) => {
  const styles = {
    1: 'font-size: 1.875rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 1rem; color: #1e293b;',
    2: 'font-size: 1.5rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.75rem; color: #1e293b;',
    3: 'font-size: 1.25rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; color: #334155;',
    4: 'font-size: 1.125rem; font-weight: 600; margin-top: 0.75rem; margin-bottom: 0.5rem; color: #334155;',
    5: 'font-size: 1rem; font-weight: 600; margin-top: 0.5rem; margin-bottom: 0.25rem; color: #475569;',
    6: 'font-size: 0.875rem; font-weight: 600; margin-top: 0.5rem; margin-bottom: 0.25rem; color: #475569;'
  };
  return `<h${level} style="${styles[level] || ''}">${text}</h${level}>`;
};

// Custom paragraph renderer
renderer.paragraph = (text) => {
  return `<p style="margin-bottom: 1rem; line-height: 1.6; color: #334155;">${text}</p>`;
};

// Custom strong (bold) renderer
renderer.strong = (text) => {
  return `<strong style="font-weight: 600; color: #1e293b;">${text}</strong>`;
};

// Custom emphasis (italic) renderer
renderer.em = (text) => {
  return `<em style="font-style: italic;">${text}</em>`;
};

// Custom image renderer
renderer.image = (href, title, text) => {
  const titleAttr = title ? ` title="${title}"` : '';
  return `<img src="${href}" alt="${text}"${titleAttr} style="max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"/>`;
};

// Custom link renderer
renderer.link = (href, title, text) => {
  const titleAttr = title ? ` title="${title}"` : '';
  return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">${text}</a>`;
};

// Custom list renderer
renderer.list = (body, ordered) => {
  const tag = ordered ? 'ol' : 'ul';
  const listStyle = ordered ? 'list-style-type: decimal;' : 'list-style-type: disc;';
  return `<${tag} style="${listStyle} margin-left: 1.5rem; margin: 1rem 0; padding-left: 0.5rem;">${body}</${tag}>`;
};

// Custom list item renderer
renderer.listitem = (text) => {
  return `<li style="margin-bottom: 0.25rem; color: #475569;">${text}</li>`;
};

// Custom code renderer (inline)
renderer.codespan = (code) => {
  return `<code style="background-color: #f1f5f9; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875em; font-family: monospace; color: #334155;">${code}</code>`;
};

// Custom code block renderer
renderer.code = (code, language) => {
  return `<pre style="background-color: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0;"><code>${code}</code></pre>`;
};

// Custom blockquote renderer
renderer.blockquote = (quote) => {
  return `<blockquote style="border-left: 4px solid #94a3b8; padding-left: 1rem; margin: 1rem 0; color: #64748b; font-style: italic;">${quote}</blockquote>`;
};

// Configure marked options
marked.setOptions({
  renderer,
  breaks: true,
  gfm: true
});

/**
 * Render markdown to HTML with custom color syntax support and sanitization
 * @param {string} text - Markdown text to render
 * @returns {string} Sanitized HTML
 */
export function renderMarkdown(text) {
  if (!text || !text.trim()) {
    return '<p style="color: #94a3b8; font-style: italic;">This note is empty. Start writing!</p>';
  }

  let processed = text;

  // Handle custom underline syntax (++text++)
  processed = processed.replace(/\+\+(.+?)\+\+/g, '<span style="text-decoration: underline;">$1</span>');

  // Handle custom color syntax {{color:key|text}}
  processed = processed.replace(/\{\{color:([a-zA-Z0-9#]+)\|(.+?)\}\}/g, (match, colorKey, value) => {
    const normalizedKey = colorKey.toLowerCase();
    const hex = textColorMap[normalizedKey] || colorKey;
    return `<span style="color: ${hex};">${value}</span>`;
  });

  // Parse markdown with marked
  let html = marked.parse(processed);

  // Sanitize the output
  return sanitize(html);
}
