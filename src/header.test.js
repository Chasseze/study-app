import { render, screen } from '@testing-library/react';
import App from './App';

test('header has Nigeria green border', () => {
  render(<App />);
  // The header element is the first region with role banner implicitly
  const header = screen.getByRole('banner') || document.querySelector('header');
  expect(header).toBeTruthy();
  // Computed styles are not available in jsdom for shorthand properties like `border` reliably,
  // so check inline style string or style attribute if present.
  const styleAttr = header.getAttribute('style') || '';
  // Expect the explicit Nigeria green border string to appear in the inline style
  expect(styleAttr).toContain('3px solid #008751');
});
