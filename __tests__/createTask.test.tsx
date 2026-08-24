import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/components/AuthProvider';
import TasksPage from '@/app/tasks/page';
import { mockFetchOnce } from './helpers/mockFetch';

function renderTasksPage() {
  return render(
    <AuthProvider>
      <TasksPage />
    </AuthProvider>
  );
}

describe('creating a task', () => {
  it('appends the new task to the list on a 201, without a reload', async () => {
    const user = userEvent.setup();
    mockFetchOnce(200, []); // initial GET /tasks
    renderTasksPage();
    await screen.findByTestId('empty');

    mockFetchOnce(201, { id: '9', title: 'New task', status: 'open' });
    await user.type(screen.getByPlaceholderText('New task title'), 'New task');
    await user.click(screen.getByText('Add task'));

    expect(await screen.findByText(/New task/)).toBeInTheDocument();
  });

  it('renders the API field message on a 400 and keeps the typed value', async () => {
    const user = userEvent.setup();
    mockFetchOnce(200, []);
    renderTasksPage();
    await screen.findByTestId('empty');

    mockFetchOnce(400, {
      statusCode: 400,
      message: ['title should not be empty'],
      error: 'Bad Request',
      timestamp: new Date().toISOString(),
      path: '/tasks',
    });
    const input = screen.getByPlaceholderText('New task title');
    await user.type(input, 'x');
    await user.click(screen.getByText('Add task'));

    expect(await screen.findByText(/should not be empty/)).toBeInTheDocument();
    expect(input).toHaveValue('x');
  });
});
