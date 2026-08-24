'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { api, ApiError } from '@/lib/api';

interface Task {
  id: string;
  title: string;
  status: string;
}

type ListState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; tasks: Task[] };

export default function TasksPage() {
  const { signOut } = useAuth();
  const [state, setState] = useState<ListState>({ kind: 'loading' });
  const [statusFilter, setStatusFilter] = useState('');
  const [title, setTitle] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    setState({ kind: 'loading' });
    try {
      // The filter is a query param on the request — filtering happens
      // in the API, never on tasks already downloaded to the browser.
      const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
      const tasks = await api<Task[]>(`/tasks${query}`);
      setState({ kind: 'ready', tasks });
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof ApiError ? err.message : 'Failed to load tasks.',
      });
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    try {
      const created = await api<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
      if (state.kind === 'ready') {
        setState({ kind: 'ready', tasks: [...state.tasks, created] });
      }
      setTitle('');
    } catch (err) {
      if (err instanceof ApiError) {
        if (Object.keys(err.fieldMessages).length > 0) {
          setFieldErrors(err.fieldMessages);
        }
        if (err.generalMessages.length > 0) {
          setFormError(err.generalMessages.join(' '));
        } else if (Object.keys(err.fieldMessages).length === 0) {
          setFormError(err.message);
        }
      } else {
        setFormError('Failed to create task.');
      }
      // form is intentionally not cleared — the typed value stays put
    }
  }

  async function handleDelete(id: string) {
    setDeleteError(null);
    try {
      await api<void>(`/tasks/${id}`, { method: 'DELETE' });
      if (state.kind === 'ready') {
        setState({ kind: 'ready', tasks: state.tasks.filter((t) => t.id !== id) });
      }
    } catch {
      setDeleteError('Could not delete that task. It is still in the list.');
    }
  }

  return (
    <main className="p-8 max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <button onClick={signOut} className="text-sm underline">
          Sign out
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="status" className="mr-2 text-sm">
          Filter by status
        </label>
        <select
          id="status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="done">Done</option>
        </select>
      </div>

      <form onSubmit={handleCreate} className="mb-6 space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task title"
          className="border rounded px-2 py-1 w-full"
        />
        {fieldErrors.title && (
          <p className="text-red-600 text-sm">{fieldErrors.title.join(' ')}</p>
        )}
        {formError && (
          <p className="text-red-600 text-sm" role="alert">
            {formError}
          </p>
        )}
        <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2">
          Add task
        </button>
      </form>

      {deleteError && <p className="text-red-600 text-sm mb-2">{deleteError}</p>}

      {state.kind === 'loading' && <p data-testid="loading">Loading tasks…</p>}
      {state.kind === 'error' && (
        <p data-testid="error" className="text-red-600">
          {state.message}
        </p>
      )}
      {state.kind === 'ready' && state.tasks.length === 0 && (
        <p data-testid="empty">No tasks yet.</p>
      )}
      {state.kind === 'ready' && state.tasks.length > 0 && (
        <ul className="space-y-2">
          {state.tasks.map((task) => (
            <li
              key={task.id}
              className="border rounded px-3 py-2 flex justify-between items-center"
            >
              <span>
                {task.title} — {task.status}
              </span>
              <button
                onClick={() => handleDelete(task.id)}
                className="text-red-600 text-sm underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
