import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('local image upload', () => {
  const OriginalFileReader = global.FileReader;
  const OriginalImage = global.Image;

  beforeEach(() => {
    // Mock FileReader to return a data URL immediately
    global.FileReader = class MockFileReader {
      constructor() {
        this.result = null;
        this.onload = null;
        this.onerror = null;
      }
      readAsDataURL(file) {
        // minimal, deterministic data URL
        this.result = `data:${file.type};base64,AAAA`;
        if (this.onload) this.onload();
      }
    };

    // Mock Image so getImageDimensions resolves predictably
    global.Image = class MockImage {
      constructor() {
        this.onload = null;
        this.onerror = null;
        this.naturalWidth = 640;
        this.naturalHeight = 360;
      }
      set src(_) {
        if (this.onload) this.onload();
      }
      get src() {
        return '';
      }
    };
  });

  afterEach(() => {
    global.FileReader = OriginalFileReader;
    global.Image = OriginalImage;
  });

  test('uploading an image inserts markdown and preview contains a contained img', async () => {
    render(<App />);
    const user = userEvent;

    // Enter edit mode
    await user.click(screen.getByRole('button', { name: /edit/i }));

    // Upload an image via the hidden input
    const fileInput = screen.getByTestId('image-upload-input');
    const file = new File(['dummy'], 'photo.png', { type: 'image/png' });
    await user.upload(fileInput, file);

    // The preview should render the uploaded image as a data URL
    const img = await screen.findByRole('img');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src') || '').toMatch(/^data:image\/png;base64,/);

    // Uploaded images should use responsive styling matching linked images
    const styleAttr = img.getAttribute('style') || '';
    expect(styleAttr).toContain('max-width: 100%');
    expect(styleAttr).toContain('height: auto');
  });
});
