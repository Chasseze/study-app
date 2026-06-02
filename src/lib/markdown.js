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

// Configure marked with a minimal, semantic renderer.
// Structural styling (headings, paragraphs, lists, tables, code, etc.) lives
// in the theme-aware `.prose` stylesheet (theme.css) so note content adapts to
// light/dark and uses the editorial typography. We keep markup here clean and
// only emit inline styling for genuinely content-specific cases (handled in
// renderMarkdown: custom colors, underline, note links).
const renderer = {
  heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    return `<h${depth}>${text}</h${depth}>\n`;
  },

  paragraph({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<p>${text}</p>\n`;
  },

  strong({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<strong>${text}</strong>`;
  },

  em({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<em>${text}</em>`;
  },

  image({ href, title, text }) {
    const titleAttr = title ? ` title="${title}"` : '';
    const altAttr = text ? ` alt="${text}"` : ' alt=""';
    // Layout-only inline style guarantees responsiveness regardless of
    // container; visual treatment (radius, margin, shadow) comes from `.prose img`.
    return `<img src="${href}"${altAttr}${titleAttr} style="max-width: 100%; height: auto;"/>`;
  },

  link({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    const titleAttr = title ? ` title="${title}"` : '';
    // No target="_blank" so the in-app click handler can intercept for preview.
    return `<a href="${href}"${titleAttr} rel="noopener noreferrer">${text}</a>`;
  },

  list({ ordered, items }) {
    const tag = ordered ? 'ol' : 'ul';
    const body = items.map(item => this.listitem(item)).join('');
    return `<${tag}>${body}</${tag}>\n`;
  },

  listitem({ tokens }) {
    const text = this.parser.parse(tokens, !!this.options?.mangle);
    return `<li>${text}</li>\n`;
  },

  codespan({ text }) {
    return `<code>${text}</code>`;
  },

  code({ text, lang }) {
    return `<pre><code>${text}</code></pre>\n`;
  },

  blockquote({ tokens }) {
    const quote = this.parser.parse(tokens);
    return `<blockquote>${quote}</blockquote>\n`;
  },

  table({ header, rows }) {
    let tableHTML = '<table>\n<thead>\n<tr>';
    header.forEach((cell) => {
      const cellText = this.parser.parseInline(cell.tokens);
      tableHTML += `<th>${cellText}</th>`;
    });
    tableHTML += '</tr>\n</thead>\n<tbody>\n';
    rows.forEach((row) => {
      tableHTML += '<tr>';
      row.forEach((cell) => {
        const cellText = this.parser.parseInline(cell.tokens);
        tableHTML += `<td>${cellText}</td>`;
      });
      tableHTML += '</tr>\n';
    });
    tableHTML += '</tbody>\n</table>\n';
    return tableHTML;
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
    return '<p class="note-empty">This note is empty. Start writing!</p>';
  }

  // Protect data URIs from custom syntax preprocessing.
  // Base64 data can contain characters like + that would be corrupted by
  // the underline (++text++) regex. We temporarily replace data URIs with
  // placeholders, run our custom preprocessing, then restore them.
  const dataUriPlaceholders = [];
  let processed = text.replace(/!\[([^\]]*)\]\((data:[^)]+)\)/g, (match, alt, dataUri) => {
    const idx = dataUriPlaceholders.length;
    dataUriPlaceholders.push({ alt, dataUri });
    return `__DATA_URI_PLACEHOLDER_${idx}__`;
  });

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
      return `<a href="#note-${linkedTopic.id}" class="note-link" data-note-id="${linkedTopic.id}">📝 ${noteTitle}</a>`;
    }
    // Note not found - show as broken link
    return `<span style="color: #c2410c; text-decoration: line-through; opacity: 0.7;">[[${noteTitle}]]</span>`;
  });

  // Restore data URI placeholders before parsing
  processed = processed.replace(/__DATA_URI_PLACEHOLDER_(\d+)__/g, (match, idxStr) => {
    const idx = parseInt(idxStr, 10);
    const { alt, dataUri } = dataUriPlaceholders[idx] || { alt: '', dataUri: '' };
    return `![${alt}](${dataUri})`;
  });

  // Temporarily replace HTML tags and parse their content
  const htmlTagPlaceholders = [];
  processed = processed.replace(/<(sub|sup)>(.+?)<\/(sub|sup)>/g, (match, openTag, content, closeTag) => {
    const idx = htmlTagPlaceholders.length;
    // Parse the content as markdown first
    const parsedContent = marked.parseInline(content);
    htmlTagPlaceholders.push({ tag: openTag, content: parsedContent });
    // Use a placeholder that won't be parsed by markdown
    return `__SUBSCRIPT_SUPERSCRIPT_PLACEHOLDER_${idx}__`;
  });

  // Parse markdown with marked
  let html = marked.parse(processed);

  // Restore HTML tags after markdown parsing
  html = html.replace(/__SUBSCRIPT_SUPERSCRIPT_PLACEHOLDER_(\d+)__/g, (match, idxStr) => {
    const idx = parseInt(idxStr, 10);
    const { tag, content } = htmlTagPlaceholders[idx] || { tag: 'sub', content: '' };
    return `<${tag}>${content}</${tag}>`;
  });

  // Sanitize the output
  return sanitize(html);
}
