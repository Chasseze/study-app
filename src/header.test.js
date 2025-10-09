import { render, screen } from '@testing-library/react';
import App from './App';

test('header has Nigeria green border', () => {
  render(<App />);
  const header = screen.getByTestId('app-header');
  expect(header).toBeInTheDocument();
  const styleAttr = header.getAttribute('style') || '';
  expect(styleAttr).toContain('3px solid #008751');
});
