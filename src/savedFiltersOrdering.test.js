import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

function getPresetButtons() {
  return screen.getAllByTestId(/^filter-preset-/i);
}

test('can pin and reorder saved views', async () => {
  const promptSpy = jest
    .spyOn(window, 'prompt')
    .mockReturnValueOnce('First View')
    .mockReturnValueOnce('Second View');

  render(<App />);

  const categoryDropdown = screen.getByLabelText(/filter by category/i);

  await userEvent.selectOptions(categoryDropdown, 'Tutorial');
  await userEvent.click(screen.getByTestId('btn-save-filter-preset'));

  // Keep an active filter so save remains enabled for the second preset.
  await userEvent.selectOptions(categoryDropdown, 'Tutorial');
  await userEvent.click(screen.getByTestId('btn-save-filter-preset'));

  // Initial order: newest first -> second save should be first.
  let presetButtons = getPresetButtons();
  expect(presetButtons[0]).toHaveTextContent('Second View');
  expect(presetButtons[1]).toHaveTextContent('First View');

  // Move First View up.
  const firstViewPresetId = presetButtons[1].getAttribute('data-testid')?.replace('filter-preset-', '');
  await userEvent.click(screen.getByTestId(`move-up-filter-preset-${firstViewPresetId}`));

  presetButtons = getPresetButtons();
  expect(presetButtons[0]).toHaveTextContent('First View');

  // Pin Second View (should move to top and show pinned marker).
  const secondViewPresetId = presetButtons[1].getAttribute('data-testid')?.replace('filter-preset-', '');
  await userEvent.click(screen.getByTestId(`pin-filter-preset-${secondViewPresetId}`));

  presetButtons = getPresetButtons();
  expect(presetButtons[0]).toHaveTextContent('Second View');
  expect(presetButtons[0]).toHaveTextContent('★');

  promptSpy.mockRestore();
});
