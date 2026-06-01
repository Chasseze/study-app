import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

function openCommandPalette() {
  fireEvent.keyDown(window, {
    key: 'k',
    metaKey: true,
    ctrlKey: false
  });
  fireEvent.keyDown(window, {
    key: 'k',
    metaKey: false,
    ctrlKey: true
  });
}

test('opens command palette and runs default command', async () => {
  render(<App />);

  openCommandPalette();

  expect(await screen.findByTestId('command-palette-input')).toBeInTheDocument();
  await userEvent.click(screen.getByTestId('command-action-new-topic'));

  expect(await screen.findByTestId('btn-create-topic')).toBeInTheDocument();
});

test('filters commands and executes toggle theme', async () => {
  render(<App />);

  const themeButton = screen.getByRole('button', { name: /switch to dark mode/i });
  expect(themeButton).toBeInTheDocument();

  openCommandPalette();

  const input = await screen.findByTestId('command-palette-input');
  await userEvent.type(input, 'theme');
  await userEvent.click(screen.getByTestId('command-action-toggle-theme'));

  expect(await screen.findByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
});
