import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('saves current filters as preset and reapplies it', async () => {
  const promptSpy = jest
    .spyOn(window, 'prompt')
    .mockReturnValueOnce('Exam Prep View')
    .mockReturnValueOnce('Renamed Prep View');

  render(<App />);

  // Create a topic in a new category so we can filter by that category.
  await userEvent.click(screen.getByTestId('btn-new-topic'));
  await userEvent.type(screen.getByPlaceholderText(/enter topic title/i), 'Algebra Notes');
  await userEvent.type(screen.getByPlaceholderText(/enter category/i), 'Math');
  await userEvent.click(screen.getByTestId('btn-create-topic'));

  const categoryDropdown = screen.getByLabelText(/filter by category/i);

  // Apply a non-default filter and save it as preset.
  await userEvent.selectOptions(categoryDropdown, 'Math');
  await userEvent.click(screen.getByTestId('btn-save-filter-preset'));

  expect(await screen.findByText('Exam Prep View')).toBeInTheDocument();

  const presetButtons = screen.getAllByTestId(/filter-preset-/i);
  const firstPresetId = presetButtons[0].getAttribute('data-testid')?.replace('filter-preset-', '');

  await userEvent.click(screen.getByTestId(`rename-filter-preset-${firstPresetId}`));
  expect(await screen.findByText('Renamed Prep View')).toBeInTheDocument();

  // Move away from the saved state.
  await userEvent.selectOptions(categoryDropdown, 'All');
  expect(categoryDropdown).toHaveDisplayValue('All');

  // Re-apply the first saved preset.
  await userEvent.click(presetButtons[0]);

  expect(categoryDropdown).toHaveDisplayValue('Math');

  // Ensure topic list reflects preset filter by keeping the Math note visible.
  const listbox = screen.getByRole('listbox', { name: /available topics/i });
  expect(within(listbox).getByText('Algebra Notes')).toBeInTheDocument();

  promptSpy.mockRestore();
});
