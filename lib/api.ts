// lib/api.ts
// The only module that calls fetch. Every page, component, and hook
// calls api<T>() instead — this is where the URL is built, the token is
// attached, errors are decoded, and a 401 is decided once for the whole app.

import { getToken, clearSession } from './session';

type FieldMessages = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  fieldMessages: FieldMessages;
  generalMessages: string[];

  constructor(status: number, message: string, fieldMessages: FieldMessages, generalMessages: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldMessages = fieldMessages;
    this.generalMessages = generalMessages;
  }
}

interface ErrorEnvelope {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

// class-validator messages are shaped "<field> <rest of sentence>", e.g.
// "email must be an email". We key on the first word. Anything that doesn't
// match that shape (a generic "Unauthorized", say) falls back to a general,
// unkeyed message instead of being silently dropped.
function bucketMessages(raw: string | string[]): { fieldMessages: FieldMessages; generalMessages: string[] } {
  const messages = Array.isArray(raw) ? raw : [raw];
  const fieldMessages: FieldMessages = {};
  const generalMessages: string[] = [];

  for (const msg of messages) {
    const match = msg.match(/^([a-zA-Z0-9_]+)\s+(.+)$/);
    if (match) {
      const [, field, rest] = match;
      if (!fieldMessages[field]) fieldMessages[field] = [];
      fieldMessages[field].push(rest);
    } else {
      generalMessages.push(msg);
    }
  }

  return { fieldMessages, generalMessages };
}

function baseUrl(): string {
  // Falls back to an empty string, never a host literal — that would
  // silently point every machine that forgot the env var at someone
  // else's laptop. An empty base just makes the request fail visibly.
  return process.env.NEXT_PUBLIC_API_URL ?? '';
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${baseUrl()}${path}`, { ...init, headers });

  // A 204 has no body — never parsed.
  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    let envelope: ErrorEnvelope | undefined;
    try {
      envelope = (await res.json()) as ErrorEnvelope;
    } catch {
      // no parseable body
    }

    const rawMessage = envelope?.message ?? res.statusText;
    const { fieldMessages, generalMessages } = bucketMessages(rawMessage);
    const summary = Array.isArray(rawMessage) ? rawMessage.join(' ') : rawMessage;

    // A 401 from anywhere except sign-in means the session is dead.
    // Sign-in's own 401 just means a wrong password, handled by the caller.
    if (res.status === 401 && path !== '/auth/login') {
      clearSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    throw new ApiError(res.status, summary, fieldMessages, generalMessages);
  }

  return (await res.json()) as T;
}
