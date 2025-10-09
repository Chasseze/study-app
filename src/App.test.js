import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app header title', () => {
  render(<App />);
  // match the header title exactly (avoid matching the content H1)
  const titleElement = screen.getByRole('heading', { name: /^Personal Study Note$/i });
  expect(titleElement).toBeInTheDocument();
});
