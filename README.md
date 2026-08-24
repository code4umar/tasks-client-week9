# Tasks Client

A Next.js App Router client for the Week 8 Tasks API — sign in, list tasks,
filter by status, create, and delete, all from Client Components with the
token kept in browser storage.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | No (falls back to an empty base) | Base URL of the Week 8 API, e.g. `http://localhost:3001`. Prefixed `NEXT_PUBLIC_`, so it is inlined into the browser bundle at build time — anyone loading the page can read it. Never put a secret in a `NEXT_PUBLIC_` variable. |

Copy `.env.example` to `.env.local` and fill in your API's URL. `.env.local`
is git-ignored; only `.env.example` is committed.

## Running both halves side by side

```bash
# terminal 1 — the Week 8 API
cd week8-api
npm run start:dev

# terminal 2 — this client
cd tasks-client
npm install
npm run dev
```

The client runs at `http://localhost:3000`, the API at whatever port your
Week 8 project uses (`http://localhost:3001` by default in `.env.example`).
Make sure the API's CORS configuration allows `http://localhost:3000` as an
origin, or every request from the browser will fail before it reaches your
wrapper.

## Getting an account and signing in

This app has no sign-up screen — accounts are created directly against the
Week 8 API (e.g. via its own seed script or a `POST /auth/register` call
with curl/Postman, however your Week 8 project creates users). Once an
account exists, go to `/login`, enter that email and password, and submit.
On success you're redirected to `/tasks`. A wrong password re-renders the
API's own error message in the form without losing what you typed.

## Where the token lives, and what that costs

The JWT returned by `POST /auth/login` is stored in `window.localStorage`
(see `lib/session.ts`, the only module that touches storage) and attached
as an `Authorization: Bearer <token>` header by `lib/api.ts` on every
request. It is restored on mount by `AuthProvider`, which is why a
hard-refresh keeps you signed in instead of flashing a signed-out state.

The cost: `localStorage` is readable by any JavaScript running on the page,
which means it's vulnerable to XSS in a way an `httpOnly` cookie is not — a
malicious script injected into the page (through a dependency, a bad
third-party script, or a stored-XSS bug) can read the token and exfiltrate
it. An `httpOnly` cookie would hide the token from JavaScript entirely, but
it needs the API and this client on the same origin (or a same-site,
HTTPS-only cross-origin setup) to work reliably — a cross-origin cookie over
plain `http`, which is what local dev usually is, fails silently. For this
assignment, where the two run on different local ports with no HTTPS,
`localStorage` is the simplification that lets the client and API stay
decoupled; a production deployment on a shared domain would be a reasonable
place to move to an `httpOnly` cookie instead.

## Testing

```bash
npm test
```

Runs three Jest specs in `jsdom` with `fetch` fully mocked — no API, no
database, no network. `npm test` and `npm run build` both succeed with
`NEXT_PUBLIC_API_URL` unset and nothing listening on the API port.
