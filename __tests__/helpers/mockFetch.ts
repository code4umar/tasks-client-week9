export function mockFetchOnce(status: number, body?: unknown) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response)
}

export function lastRequest() {
  const calls = (global.fetch as jest.Mock).mock.calls
  const [url, init] = calls[calls.length - 1] ?? []
  return { url: String(url), init: (init ?? {}) as RequestInit }
}
