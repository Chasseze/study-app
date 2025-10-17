import { render, screen, within } from '@testing-library/react';
import App from './App';

test('header has Nigeria green border', () => {
  render(<App />);
  const header = screen.getByTestId('app-header');
  expect(header).toBeInTheDocument();
  const styleAttr = header.getAttribute('style') || '';
  expect(styleAttr).toContain('3px solid #008751');
});

test('header displays storage selector with icon badge', () => {
  render(<App />);
  const storageBadge = screen.getByTitle(/notes are saved to this browser/i);
  expect(storageBadge).toBeInTheDocument();
  expect(storageBadge.textContent).toMatch(/ll/i);

  const select = screen.getByLabelText(/choose where notes are stored/i);
  expect(select).toBeInTheDocument();
  expect(select).toHaveValue('local');
  expect(within(select).getByText(/idb/i)).toBeInTheDocument();
});
