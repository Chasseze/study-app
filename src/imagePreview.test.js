import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('image modal shows preview when a valid URL is entered', async () => {
  render(<App />);
  const user = userEvent;

  // Enter edit mode
  const editButton = screen.getByRole('button', { name: /edit/i });
  await user.click(editButton);

  // Open Add Image modal
  const addImageButton = screen.getByRole('button', { name: /add image/i });
  await user.click(addImageButton);

  // Type a valid image URL and assert preview appears
  const urlInput = screen.getByPlaceholderText(/https:\/\/example.com\/image.jpg/i);
  const testUrl = 'https://via.placeholder.com/150';
  await user.type(urlInput, testUrl);

  // Click modal Add Image button
  await user.click(screen.getByTestId('btn-add-image'));

  // The preview <img> should be present
  const previewImg = await screen.findByRole('img');
  expect(previewImg).toBeInTheDocument();
  expect(previewImg).toHaveAttribute('src', testUrl);
});
