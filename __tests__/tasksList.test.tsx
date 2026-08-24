import { render, screen } from '@testing-library/react';
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

describe('TasksPage list rendering', () => {
  it('renders a row per task from a mocked 200', async () => {
    mockFetchOnce(200, [
      { id: '1', title: 'Buy milk', status: 'open' },
      { id: '2', title: 'Write report', status: 'done' },
    ]);
    renderTasksPage();

    expect(await screen.findByText(/Buy milk/)).toBeInTheDocument();
    expect(await screen.findByText(/Write report/)).toBeInTheDocument();
  });

  it('renders the empty state from a mocked []', async () => {
    mockFetchOnce(200, []);
    renderTasksPage();

    expect(await screen.findByTestId('empty')).toBeInTheDocument();
  });
});
