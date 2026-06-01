import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('can switch saved views between expanded and compact modes', async () => {
  const promptSpy = jest.spyOn(window, 'prompt').mockReturnValueOnce('Density View');

  render(<App />);

  const categoryDropdown = screen.getByLabelText(/filter by category/i);
  await userEvent.selectOptions(categoryDropdown, 'Tutorial');
  await userEvent.click(screen.getByTestId('btn-save-filter-preset'));

  const presetButton = screen.getByTestId(/^filter-preset-/i);
  const presetId = presetButton.getAttribute('data-testid')?.replace('filter-preset-', '');

  // Expanded mode: inline controls visible.
  expect(screen.getByTestId(`move-top-filter-preset-${presetId}`)).toBeInTheDocument();
  expect(screen.queryByTestId(`saved-view-overflow-btn-${presetId}`)).not.toBeInTheDocument();

  // Switch to compact.
  await userEvent.click(screen.getByTestId('btn-toggle-saved-views-density'));

  expect(screen.queryByTestId(`move-top-filter-preset-${presetId}`)).not.toBeInTheDocument();
  expect(screen.getByTestId(`saved-view-overflow-btn-${presetId}`)).toBeInTheDocument();
  expect(screen.queryByTestId(`saved-view-overflow-menu-${presetId}`)).not.toBeInTheDocument();
  expect(screen.getByTestId('btn-toggle-saved-views-density')).toHaveTextContent('Compact');

  // Open overflow menu.
  await userEvent.click(screen.getByTestId(`saved-view-overflow-btn-${presetId}`));
  expect(screen.getByTestId(`saved-view-overflow-menu-${presetId}`)).toBeInTheDocument();
  expect(screen.getByTestId(`overflow-pin-${presetId}`)).toBeInTheDocument();
  expect(screen.getByTestId(`overflow-rename-${presetId}`)).toBeInTheDocument();
  expect(screen.getByTestId(`overflow-delete-${presetId}`)).toBeInTheDocument();

  // Clicking an action closes the menu.
  await userEvent.click(screen.getByTestId(`overflow-move-top-${presetId}`));
  expect(screen.queryByTestId(`saved-view-overflow-menu-${presetId}`)).not.toBeInTheDocument();

  // Switch back to expanded.
  await userEvent.click(screen.getByTestId('btn-toggle-saved-views-density'));
  expect(screen.getByTestId(`move-top-filter-preset-${presetId}`)).toBeInTheDocument();
  expect(screen.queryByTestId(`saved-view-overflow-btn-${presetId}`)).not.toBeInTheDocument();
  expect(screen.getByTestId('btn-toggle-saved-views-density')).toHaveTextContent('Expanded');

  promptSpy.mockRestore();
});

test('compact mode overflow rename action works', async () => {
  const promptSpy = jest
    .spyOn(window, 'prompt')
    .mockReturnValueOnce('Overflow View')
    .mockReturnValueOnce('Renamed Via Overflow');

  render(<App />);

  const categoryDropdown = screen.getByLabelText(/filter by category/i);
  await userEvent.selectOptions(categoryDropdown, 'Tutorial');
  await userEvent.click(screen.getByTestId('btn-save-filter-preset'));

  await userEvent.click(screen.getByTestId('btn-toggle-saved-views-density'));

  const presetButton = screen.getAllByTestId(/^filter-preset-/i)[0];
  const presetId = presetButton.getAttribute('data-testid')?.replace('filter-preset-', '');

  await userEvent.click(screen.getByTestId(`saved-view-overflow-btn-${presetId}`));
  await userEvent.click(screen.getByTestId(`overflow-rename-${presetId}`));

  expect(await screen.findByText('Renamed Via Overflow')).toBeInTheDocument();

  promptSpy.mockRestore();
});
