const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export type Account = { id: string; balance: number; currency: string };
export type TransferRow = { id: string; amount: number; direction?: 'sent' | 'received'; createdAt: string };

let token: string | null = localStorage.getItem('token');
export const hasToken = () => Boolean(token);
export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem('token', t);
  else localStorage.removeItem('token');
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new Error(msg ?? 'Request failed');
  }
  return body as T;
}

export const api = {
  auth: (mode: 'login' | 'register', email: string, password: string) =>
    request<{ accessToken: string }>(`/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  account: () => request<Account>('/accounts/me'),
  transfers: () => request<TransferRow[]>('/transfers'),
  transfer: (key: string, toEmail: string, amount: number) =>
    request<TransferRow>('/transfers', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify({ toEmail, amount }),
    }),
};
