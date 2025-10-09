import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('can create a new topic via the New Topic modal', async () => {
  render(<App />);

  // Open New Topic modal
  const newTopicButton = screen.getByTestId('btn-new-topic');
  await userEvent.click(newTopicButton);

  // Enter title and create
  const titleInput = screen.getByPlaceholderText(/enter topic title/i);
  await userEvent.type(titleInput, 'Test Topic');

  const createButton = screen.getByTestId('btn-create-topic');
  await userEvent.click(createButton);

  // After creation, the new topic should appear (may appear in multiple places)
  const createdAll = await screen.findAllByText('Test Topic');
  expect(createdAll.length).toBeGreaterThan(0);
});
