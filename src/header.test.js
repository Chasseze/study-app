import { render, screen, within } from '@testing-library/react';
import App from './App';

test('header renders the editorial wordmark', () => {
  render(<App />);
  const header = screen.getByTestId('app-header');
  expect(header).toBeInTheDocument();
  // Wordmark is present in the redesigned editorial header.
  expect(within(header).getByRole('heading', { name: /personal study note/i })).toBeInTheDocument();
});

test('header shows the cloud sync indicator', () => {
  render(<App />);
  const header = screen.getByTestId('app-header');
  // Cloud-only storage: the header surfaces sync status rather than a storage picker.
  expect(within(header).getByText(/cloud|syncing/i)).toBeInTheDocument();
});
