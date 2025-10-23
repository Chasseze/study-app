import sanitize from './sanitize';

describe('sanitize', () => {
  test('removes script tags and javascript: URLs', () => {
    const input = `<p>Hello <strong>world</strong></p><script>alert(1)</script><a href="javascript:alert(2)">click</a>`;
    const out = sanitize(input);
    expect(out).toContain('<p>Hello <strong>world</strong></p>');
    expect(out).not.toContain('<script>');
    expect(out).not.toContain('javascript:alert');
  });

  test('allows basic images and links with http(s)', () => {
    const input = `<p>img <img src="https://example.com/pic.png" alt="pic"></p><a href="https://example.com">link</a>`;
    const out = sanitize(input);
    expect(out).toContain('img');
    expect(out).toContain('src="https://example.com/pic.png"');
    expect(out).toContain('href="https://example.com"');
  });
});
