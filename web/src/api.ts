const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export type Account = { id: string; userId: string; email: string; balance: number; currency: string };
export type TransferRow = {
  id: string;
  amount: number;
  currency?: string;
  direction?: 'sent' | 'received';
  counterpartyEmail?: string;
  createdAt: string;
};
export type HistoryPage = { items: TransferRow[]; nextCursor: string | null };

let token: string | null = localStorage.getItem('token');

export const hasToken = () => Boolean(token);

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem('token', t);
  else localStorage.removeItem('token');
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new Error('Cannot reach the API. Is the server running?');
  }

  const text = await res.text();
  let body: any = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = {};
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      setToken(null);
      window.dispatchEvent(new Event('unauthorized'));
    }
    const raw = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new Error(raw || `Request failed (${res.status})`);
  }

  if (res.status === 204 || !text) return undefined as T;
  return body as T;
}

export const api = {
  auth: (mode: 'login' | 'register', email: string, password: string) =>
    request<{ accessToken: string }>(`/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),
  account: () => request<Account>('/accounts/me'),
  transfers: (before?: string) =>
    request<HistoryPage>(`/transfers?limit=10${before ? `&before=${encodeURIComponent(before)}` : ''}`),
  transfer: (key: string, toEmail: string, amount: number) =>
    request<TransferRow>('/transfers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': key,
      },
      body: JSON.stringify({ toEmail, amount }),
    }),
};
