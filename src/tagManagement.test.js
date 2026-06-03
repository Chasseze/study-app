import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renames and deletes tags globally from sidebar controls', async () => {
  const promptSpy = jest.spyOn(window, 'prompt').mockReturnValue('science-renamed');
  const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

  render(<App />);

  // Create a note and add a tag so the tag management controls appear.
  await userEvent.click(screen.getByTestId('btn-new-topic'));
  await userEvent.type(screen.getByPlaceholderText(/enter topic title/i), 'Biology Note');
  await userEvent.click(screen.getByTestId('btn-create-topic'));

  const tagInput = await screen.findByTestId('tag-input');
  await userEvent.type(tagInput, 'science{enter}');
  await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

  // Select the tag in the filter dropdown so its management controls appear.
  const tagSelect = await screen.findByTestId('tag-filter-select');
  await userEvent.selectOptions(tagSelect, 'science');

  // Rename tag globally.
  await userEvent.click(await screen.findByTestId('tag-rename-science'));
  expect(promptSpy).toHaveBeenCalled();

  // The dropdown should now offer the renamed tag.
  expect(await within(tagSelect).findByRole('option', { name: '#science-renamed' })).toBeInTheDocument();

  // Delete tag globally (selection followed the rename).
  await userEvent.click(await screen.findByTestId('tag-delete-science-renamed'));
  expect(confirmSpy).toHaveBeenCalled();

  // With no tags left, the dropdown is replaced by the empty-state hint.
  expect(screen.queryByTestId('tag-filter-select')).not.toBeInTheDocument();

  const listbox = screen.getByRole('listbox', { name: /available topics/i });
  expect(within(listbox).getByText('Biology Note')).toBeInTheDocument();

  promptSpy.mockRestore();
  confirmSpy.mockRestore();
});
