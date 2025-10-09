import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('edit mode updates preview when typing', async () => {
  render(<App />);

  // Click the Edit button for the seeded topic
  const editButton = screen.getByRole('button', { name: /edit/i });
  await userEvent.click(editButton);

  // Type into the textarea (use stable test id)
  const textarea = screen.getByTestId('edit-textarea');
  await userEvent.clear(textarea);
  await userEvent.type(textarea, '# Hello Test');

  // The preview pane (in edit mode) should show rendered H1
  const previewHeading = await screen.findByRole('heading', { name: /hello test/i });
  expect(previewHeading).toBeInTheDocument();
});
