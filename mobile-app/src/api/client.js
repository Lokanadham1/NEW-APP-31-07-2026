import { API_URL } from '../config';

// The auth token is injected by AuthContext after login so every API call
// (including ones made outside a component, e.g. in effects) can use it
// without threading it through every function signature.
let authToken = null;
export function setAuthToken(token) {
  authToken = token;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // The server returned something that isn't JSON — a stale/mismatched
      // backend, a proxy error page, a wrong API_URL, etc. Surface a message
      // that points at the actual problem instead of a raw parse error.
      throw new ApiError(
        `Server returned an unexpected response (status ${res.status}). ` +
        'Make sure the backend is running the latest version and EXPO_PUBLIC_API_URL is correct.',
        res.status
      );
    }
  }

  if (!res.ok) {
    throw new ApiError(data?.error || 'Something went wrong. Please try again.', res.status);
  }
  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};
