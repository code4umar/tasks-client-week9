import { api } from '@/lib/api';
import { setSession, clearSession } from '@/lib/session';
import { mockFetchOnce, lastRequest } from './helpers/mockFetch';

describe('api()', () => {
  it('attaches Authorization when a session exists, and omits it when signed out', async () => {
    clearSession();
    mockFetchOnce(200, { ok: true });
    await api('/tasks');
    let { init } = lastRequest();
    let headers = new Headers(init.headers);
    expect(headers.has('Authorization')).toBe(false);

    setSession('abc123', { email: 'a@b.com' });
    mockFetchOnce(200, { ok: true });
    await api('/tasks');
    ({ init } = lastRequest());
    headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBe('Bearer abc123');
  });
});
