import { render, screen } from '@testing-library/react';
import App from './App';

test('renders workspace insights with derived metrics', () => {
  render(<App />);
  const insightsRegion = screen.getByRole('region', { name: /workspace insights/i });
  expect(insightsRegion).toBeInTheDocument();

  expect(screen.getByTestId('insight-topics-value')).toHaveTextContent('1');
  expect(screen.getByTestId('insight-categories-value')).toHaveTextContent('1');
  expect(screen.getByTestId('insight-active-value')).toHaveTextContent('1');
  expect(screen.getByTestId('insight-media-value')).toHaveTextContent('0');

  const readingValue = screen.getByTestId('insight-reading-value');
  expect(readingValue).toHaveTextContent(/(\d+\s*min|—)/i);

  expect(screen.queryByText(/always in sync/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/live snapshot of your notes/i)).not.toBeInTheDocument();
});
