import { render, screen } from '@testing-library/react';
import App from './App';

test('renders workspace insights with derived metrics', () => {
  render(<App />);
  const insightsRegion = screen.getByRole('region', { name: /workspace insights/i });
  expect(insightsRegion).toBeInTheDocument();

  // Insights are rendered with data-testid="insight-{id}"
  expect(screen.getByTestId('insight-topics')).toBeInTheDocument();
  expect(screen.getByTestId('insight-categories')).toBeInTheDocument();
  expect(screen.getByTestId('insight-active')).toBeInTheDocument();
  expect(screen.getByTestId('insight-media')).toBeInTheDocument();
  expect(screen.getByTestId('insight-reading')).toBeInTheDocument();

  expect(screen.queryByText(/always in sync/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/live snapshot of your notes/i)).not.toBeInTheDocument();
});

