import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  describe('basic markdown', () => {
    it('should render headings', () => {
      const result = renderMarkdown('# Heading 1');
      expect(result).toContain('<h1');
      expect(result).toContain('Heading 1');
    });

    it('should render bold text', () => {
      const result = renderMarkdown('**bold text**');
      expect(result).toContain('<strong');
      expect(result).toContain('bold text');
    });

    it('should render italic text', () => {
      const result = renderMarkdown('*italic text*');
      expect(result).toContain('<em');
      expect(result).toContain('italic text');
    });

    it('should render links', () => {
      const result = renderMarkdown('[link](https://example.com)');
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('link');
    });

    it('should render images', () => {
      const result = renderMarkdown('![alt](https://example.com/img.jpg)');
      expect(result).toContain('<img');
      expect(result).toContain('src="https://example.com/img.jpg"');
    });

    it('should render code blocks', () => {
      const result = renderMarkdown('```\ncode\n```');
      expect(result).toContain('<pre');
      expect(result).toContain('<code');
    });

    it('should render inline code', () => {
      const result = renderMarkdown('`inline code`');
      expect(result).toContain('<code');
      expect(result).toContain('inline code');
    });

    it('should render blockquotes', () => {
      const result = renderMarkdown('> quote');
      expect(result).toContain('<blockquote');
      expect(result).toContain('quote');
    });

    it('should render unordered lists', () => {
      const result = renderMarkdown('- item 1\n- item 2');
      expect(result).toContain('<ul');
      expect(result).toContain('<li');
      expect(result).toContain('item 1');
    });

    it('should render ordered lists', () => {
      const result = renderMarkdown('1. first\n2. second');
      expect(result).toContain('<ol');
      expect(result).toContain('<li');
    });
  });

  describe('custom syntax', () => {
    it('should render underline syntax (++text++)', () => {
      const result = renderMarkdown('++underlined++');
      expect(result).toContain('text-decoration: underline');
      expect(result).toContain('underlined');
    });

    it('should render color syntax with named color', () => {
      const result = renderMarkdown('{{color:emerald|green text}}');
      expect(result).toContain('color: #047857');
      expect(result).toContain('green text');
    });

    it('should render color syntax with hex color', () => {
      const result = renderMarkdown('{{color:#ff0000|red text}}');
      expect(result).toContain('color: #ff0000');
      expect(result).toContain('red text');
    });
  });

  describe('note linking', () => {
    const mockTopics = [
      { id: 1, title: 'Getting Started', category: 'Tutorial' },
      { id: 2, title: 'Advanced Guide', category: 'Tutorial' },
    ];

    it('should render note links for existing notes', () => {
      const result = renderMarkdown('Check [[Getting Started]]', mockTopics);
      expect(result).toContain('data-note-id="1"');
      expect(result).toContain('Getting Started');
      expect(result).toContain('📝');
    });

    it('should render broken note links for non-existing notes', () => {
      const result = renderMarkdown('Check [[Nonexistent Note]]', mockTopics);
      expect(result).toContain('text-decoration: line-through');
      expect(result).toContain('[[Nonexistent Note]]');
    });

    it('should be case-insensitive for note matching', () => {
      const result = renderMarkdown('Check [[getting started]]', mockTopics);
      expect(result).toContain('data-note-id="1"');
    });

    it('should handle multiple note links', () => {
      const result = renderMarkdown('See [[Getting Started]] and [[Advanced Guide]]', mockTopics);
      expect(result).toContain('data-note-id="1"');
      expect(result).toContain('data-note-id="2"');
    });
  });

  describe('empty content', () => {
    it('should return placeholder for empty string', () => {
      const result = renderMarkdown('');
      expect(result).toContain('This note is empty');
    });

    it('should return placeholder for whitespace only', () => {
      const result = renderMarkdown('   \n  ');
      expect(result).toContain('This note is empty');
    });

    it('should return placeholder for null/undefined', () => {
      const result = renderMarkdown(null);
      expect(result).toContain('This note is empty');
    });
  });

  describe('XSS prevention', () => {
    it('should sanitize script tags', () => {
      const result = renderMarkdown('<script>alert("xss")</script>');
      expect(result).not.toContain('<script');
    });

    it('should sanitize onclick handlers', () => {
      const result = renderMarkdown('<div onclick="alert(1)">click</div>');
      expect(result).not.toContain('onclick');
    });

    it('should sanitize javascript: links', () => {
      const result = renderMarkdown('[click](javascript:alert(1))');
      expect(result).not.toContain('javascript:');
    });
  });
});
