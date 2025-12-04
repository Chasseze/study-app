import { render, screen, within } from '@testing-library/react';
import App from './App';

test('header has Nigeria green border', () => {
  render(<App />);
  const header = screen.getByTestId('app-header');
  expect(header).toBeInTheDocument();
  const styleAttr = header.getAttribute('style') || '';
  expect(styleAttr).toContain('3px solid #008751');
});

test('header displays storage selector', () => {
  render(<App />);
  const select = screen.getByLabelText(/choose where notes are stored/i);
  expect(select).toBeInTheDocument();
  expect(select).toHaveValue('firebase');
  expect(within(select).getByText(/offline storage/i)).toBeInTheDocument();
  expect(within(select).getByText(/cloud sync/i)).toBeInTheDocument();
});
