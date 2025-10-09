import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('adding an image inserts markdown and preview shows the image', async () => {
  render(<App />);

  // Enter edit mode
  await userEvent.click(screen.getByRole('button', { name: /edit/i }));

  // Open Add Image modal
  await userEvent.click(screen.getByRole('button', { name: /add image/i }));

  const url = 'https://via.placeholder.com/120';
  const urlInput = screen.getByPlaceholderText(/https:\/\/example.com\/image.jpg/i);
  await userEvent.type(urlInput, url);

  // Click Add Image (in modal) using the stable test id
  await userEvent.click(screen.getByTestId('btn-add-image'));

  // The editor preview (right column in edit mode) should show an <img>
  const img = await screen.findByRole('img');
  expect(img).toBeInTheDocument();
  expect(img).toHaveAttribute('src', url);
});
