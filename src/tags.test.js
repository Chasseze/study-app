import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('can add tags to a note and filter sidebar by tag', async () => {
  render(<App />);

  // Create a new topic
  await userEvent.click(screen.getByTestId('btn-new-topic'));
  await userEvent.type(screen.getByPlaceholderText(/enter topic title/i), 'Tagged Note');
  await userEvent.click(screen.getByTestId('btn-create-topic'));

  // Wait for editor textarea and then start editing (topic is auto-opened in edit mode)
  const textarea = await screen.findByTestId('edit-textarea');
  expect(textarea).toBeInTheDocument();

  // Add a tag via the tag input
  const tagInput = screen.getByTestId('tag-input');
  // Use act() to flush the change event (commits tagInput state = 'science')
  act(() => {
    fireEvent.change(tagInput, { target: { value: 'science' } });
  });
  // Now tagInput state is committed. Fire Enter — onKeyDown reads tagInput = 'science'
  fireEvent.keyDown(tagInput, { key: 'Enter' });
  // Wait for editTags state to be committed (chip appears in edit mode)
  await waitFor(() => {
    expect(screen.getByTestId('tag-chip-science')).toBeInTheDocument();
  });

  // Save the note
  await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

  // Sidebar tag filter chip should appear (topics state updated)
  expect(await screen.findByTestId('tag-filter-science')).toBeInTheDocument();

  // Clicking filter chip should activate it
  await userEvent.click(screen.getByTestId('tag-filter-science'));

  // The note should still be visible (it has the tag)
  // Note appears in both sidebar and content area — at least one should be visible
  expect(screen.getAllByText('Tagged Note').length).toBeGreaterThan(0);
});
