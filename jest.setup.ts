import '@testing-library/jest-dom'

// No .env is committed, so the base URL is unset under `npm test`. Seed a
// fake one: every request is mocked, so it is never dialled — it only has to exist.
process.env.NEXT_PUBLIC_API_URL ??= 'http://api.test'

beforeEach(() => {
  global.fetch = jest.fn()
  window.localStorage.clear()
})

afterEach(() => jest.resetAllMocks())
