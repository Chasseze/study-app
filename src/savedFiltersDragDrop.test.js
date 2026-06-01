import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

function getPresetButtons() {
  return screen.getAllByTestId(/^filter-preset-/i);
}

test('reorders saved views via drag and drop', async () => {
  const promptSpy = jest
    .spyOn(window, 'prompt')
    .mockReturnValueOnce('First View')
    .mockReturnValueOnce('Second View');

  render(<App />);

  const categoryDropdown = screen.getByLabelText(/filter by category/i);

  await userEvent.selectOptions(categoryDropdown, 'Tutorial');
  await userEvent.click(screen.getByTestId('btn-save-filter-preset'));

  await userEvent.selectOptions(categoryDropdown, 'Tutorial');
  await userEvent.click(screen.getByTestId('btn-save-filter-preset'));

  let presetButtons = getPresetButtons();
  expect(presetButtons[0]).toHaveTextContent('Second View');
  expect(presetButtons[1]).toHaveTextContent('First View');

  const secondId = presetButtons[0].getAttribute('data-testid')?.replace('filter-preset-', '');
  const firstId = presetButtons[1].getAttribute('data-testid')?.replace('filter-preset-', '');

  const draggedRow = screen.getByTestId(`saved-filter-row-${secondId}`);
  const targetRow = screen.getByTestId(`saved-filter-row-${firstId}`);

  fireEvent.dragStart(draggedRow);
  fireEvent.dragOver(targetRow);
  fireEvent.drop(targetRow);

  presetButtons = getPresetButtons();
  expect(presetButtons[0]).toHaveTextContent('First View');
  expect(presetButtons[1]).toHaveTextContent('Second View');

  promptSpy.mockRestore();
});
