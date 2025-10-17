import { render, screen, within } from '@testing-library/react';
import App from './App';

test('renders app header title', () => {
  render(<App />);
  // match the header title exactly (avoid matching the content H1)
  const titleElement = screen.getByRole('heading', { name: /^Personal Study Note$/i });
  expect(titleElement).toBeInTheDocument();
});

test('renders category filter dropdown with expected options', () => {
  render(<App />);
  const dropdown = screen.getByLabelText(/filter by category/i);
  expect(dropdown.tagName).toBe('SELECT');
  expect(dropdown).toHaveDisplayValue('All');

  const options = within(dropdown).getAllByRole('option');
  expect(options.map(opt => opt.textContent)).toEqual(['All', 'Tutorial']);
});
