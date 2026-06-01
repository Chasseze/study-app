import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

function getPresetButtons() {
  return screen.getAllByTestId(/^filter-preset-/i);
}

test('supports top and bottom reorder controls for saved views', async () => {
  const promptSpy = jest
    .spyOn(window, 'prompt')
    .mockReturnValueOnce('One')
    .mockReturnValueOnce('Two')
    .mockReturnValueOnce('Three');

  render(<App />);

  const categoryDropdown = screen.getByLabelText(/filter by category/i);
  await userEvent.selectOptions(categoryDropdown, 'Tutorial');

  await userEvent.click(screen.getByTestId('btn-save-filter-preset'));
  await userEvent.click(screen.getByTestId('btn-save-filter-preset'));
  await userEvent.click(screen.getByTestId('btn-save-filter-preset'));

  let presets = getPresetButtons();
  expect(presets[0]).toHaveTextContent('Three');
  expect(presets[1]).toHaveTextContent('Two');
  expect(presets[2]).toHaveTextContent('One');

  const topId = presets[0].getAttribute('data-testid')?.replace('filter-preset-', '');
  await userEvent.click(screen.getByTestId(`move-bottom-filter-preset-${topId}`));

  presets = getPresetButtons();
  expect(presets[0]).toHaveTextContent('Two');
  expect(presets[1]).toHaveTextContent('One');
  expect(presets[2]).toHaveTextContent('Three');

  const middleId = presets[1].getAttribute('data-testid')?.replace('filter-preset-', '');
  await userEvent.click(screen.getByTestId(`move-top-filter-preset-${middleId}`));

  presets = getPresetButtons();
  expect(presets[0]).toHaveTextContent('One');
  expect(presets[1]).toHaveTextContent('Two');
  expect(presets[2]).toHaveTextContent('Three');

  promptSpy.mockRestore();
});
