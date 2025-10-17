import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import App from './App';

describe('editor formatting toolbar', () => {
  test('underline button inserts markdown placeholder', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /edit/i }));

    const textarea = screen.getByTestId('edit-textarea');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Sample note');

    await userEvent.click(screen.getByRole('button', { name: /underline/i }));

    expect(textarea.value).toContain('++underlined text++');
  });

  test('color picker wraps selection with color markdown', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /edit/i }));

    const textarea = screen.getByTestId('edit-textarea');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Color demo');

    act(() => {
      textarea.setSelectionRange(0, 5);
      fireEvent.select(textarea);
    });

    await userEvent.click(screen.getByRole('button', { name: /text color/i }));
    await userEvent.click(screen.getByTestId('color-option-indigo'));

    expect(textarea.value).toContain('{{color:indigo|Color}} demo');
  const previewHeading = screen.getByRole('heading', { name: /preview/i });
  const previewContainer = previewHeading.parentElement;
    expect(previewContainer).toBeInTheDocument();
    if (!previewContainer) {
      throw new Error('Preview container not found');
    }
    const coloredSpan = within(previewContainer).getByText('Color', { selector: 'span' });
    expect(coloredSpan).toHaveStyle({ color: '#4338ca' });
  });
});
