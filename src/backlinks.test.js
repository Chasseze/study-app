import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('shows backlinks for notes that reference the current note', async () => {
  render(<App />);

  // Create target note first
  await userEvent.click(screen.getByTestId('btn-new-topic'));
  await userEvent.type(screen.getByPlaceholderText(/enter topic title/i), 'Target Note');
  await userEvent.click(screen.getByTestId('btn-create-topic'));
  // Exit edit mode for target note (created with empty content)
  await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

  // Create source note that links to the target note
  await userEvent.click(screen.getByTestId('btn-new-topic'));
  await userEvent.type(screen.getByPlaceholderText(/enter topic title/i), 'Source Note');
  await userEvent.click(screen.getByTestId('btn-create-topic'));

  // Use fireEvent.change to atomically set the linked content, avoiding
  // key-by-key simulation issues with [[ ]] in React 19 concurrent mode.
  const textarea = await screen.findByTestId('edit-textarea');
  act(() => {
    fireEvent.change(textarea, { target: { value: 'This links to [[Target Note]]' } });
  });
  await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

  // After saving Source Note in read mode, connections panel should show outbound link.
  expect(await screen.findByText(/Links In This Note/i)).toBeInTheDocument();
  await userEvent.click(screen.getByTestId(/^linked-topic-/));

  // Now viewing Target Note — it should show Source Note as a backlink.
  expect(await screen.findByText(/Backlinks/i)).toBeInTheDocument();
  expect(await screen.findByTestId(/^backlink-topic-/)).toBeInTheDocument();
});