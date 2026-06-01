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

  // Rename tag globally.
  await userEvent.click(await screen.findByTestId('tag-rename-science'));
  expect(promptSpy).toHaveBeenCalled();

  const renamedFilter = await screen.findByTestId('tag-filter-science-renamed');
  expect(renamedFilter).toBeInTheDocument();

  // Delete tag globally.
  await userEvent.click(screen.getByTestId('tag-delete-science-renamed'));
  expect(confirmSpy).toHaveBeenCalled();

  expect(screen.queryByTestId('tag-filter-science-renamed')).not.toBeInTheDocument();

  const listbox = screen.getByRole('listbox', { name: /available topics/i });
  expect(within(listbox).getByText('Biology Note')).toBeInTheDocument();

  promptSpy.mockRestore();
  confirmSpy.mockRestore();
});
