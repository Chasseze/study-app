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
// Note: marked v17+ uses object parameters for renderer methods
const renderer = {
  // Custom heading renderer with inline styles
  heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const styles = {
      1: 'font-size: 1.875rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 1rem; color: #1e293b;',
      2: 'font-size: 1.5rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.75rem; color: #1e293b;',
      3: 'font-size: 1.25rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; color: #334155;',
      4: 'font-size: 1.125rem; font-weight: 600; margin-top: 0.75rem; margin-bottom: 0.5rem; color: #334155;',
      5: 'font-size: 1rem; font-weight: 600; margin-top: 0.5rem; margin-bottom: 0.25rem; color: #475569;',
      6: 'font-size: 0.875rem; font-weight: 600; margin-top: 0.5rem; margin-bottom: 0.25rem; color: #475569;'
    };
    return `<h${depth} style="${styles[depth] || ''}">${text}</h${depth}>\n`;
  },

  // Custom paragraph renderer
  paragraph({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<p style="margin-bottom: 1rem; line-height: 1.6; color: #334155;">${text}</p>\n`;
  },

  // Custom strong (bold) renderer
  strong({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<strong style="font-weight: 600; color: #1e293b;">${text}</strong>`;
  },

  // Custom emphasis (italic) renderer
  em({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<em style="font-style: italic;">${text}</em>`;
  },

  // Custom image renderer
  image({ href, title, text }) {
    const titleAttr = title ? ` title="${title}"` : '';
    return `<img src="${href}" alt="${text}"${titleAttr} style="max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"/>`;
  },

  // Custom link renderer
  link({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    const titleAttr = title ? ` title="${title}"` : '';
    return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">${text}</a>`;
  },

  // Custom list renderer
  list({ ordered, items }) {
    const tag = ordered ? 'ol' : 'ul';
    const listStyle = ordered ? 'list-style-type: decimal;' : 'list-style-type: disc;';
    const body = items.map(item => this.listitem(item)).join('');
    return `<${tag} style="${listStyle} margin-left: 1.5rem; margin: 1rem 0; padding-left: 0.5rem;">${body}</${tag}>\n`;
  },

  // Custom list item renderer
  listitem({ tokens }) {
    const text = this.parser.parse(tokens, !!this.options?.mangle);
    return `<li style="margin-bottom: 0.25rem; color: #475569;">${text}</li>\n`;
  },

  // Custom code renderer (inline)
  codespan({ text }) {
    return `<code style="background-color: #f1f5f9; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875em; font-family: monospace; color: #334155;">${text}</code>`;
  },

  // Custom code block renderer
  code({ text, lang }) {
    return `<pre style="background-color: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0;"><code>${text}</code></pre>\n`;
  },

  // Custom blockquote renderer
  blockquote({ tokens }) {
    const quote = this.parser.parse(tokens);
    return `<blockquote style="border-left: 4px solid #94a3b8; padding-left: 1rem; margin: 1rem 0; color: #64748b; font-style: italic;">${quote}</blockquote>\n`;
  }
};

// Apply custom renderer
marked.use({ renderer });

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true
});

/**
 * Render markdown to HTML with custom color syntax support and sanitization
 * @param {string} text - Markdown text to render
 * @param {Array} topics - Optional array of topics for note linking
 * @returns {string} Sanitized HTML
 */
export function renderMarkdown(text, topics = []) {
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

  // Handle note linking syntax [[note title]]
  processed = processed.replace(/\[\[(.+?)\]\]/g, (match, noteTitle) => {
    const linkedTopic = topics.find(t => 
      t.title.toLowerCase() === noteTitle.toLowerCase()
    );
    if (linkedTopic) {
      return `<a href="#note-${linkedTopic.id}" class="note-link" data-note-id="${linkedTopic.id}" style="color: #7c3aed; text-decoration: none; background-color: #f5f3ff; padding: 0.1rem 0.4rem; border-radius: 0.25rem; font-weight: 500; cursor: pointer;">📝 ${noteTitle}</a>`;
    }
    // Note not found - show as broken link
    return `<span style="color: #ef4444; text-decoration: line-through; opacity: 0.7;">[[${noteTitle}]]</span>`;
  });

  // Parse markdown with marked
  let html = marked.parse(processed);

  // Sanitize the output
  return sanitize(html);
}
