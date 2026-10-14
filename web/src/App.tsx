import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { api, hasToken, setToken } from './api';

const money = (minor: number, currency = 'EUR') =>
  new Intl.NumberFormat('en', { style: 'currency', currency }).format(minor / 100);

const parseAmount = (input: string): number | null => {
  if (!/^\d+(\.\d{1,2})?$/.test(input)) return null;
  const cents = Math.round(Number(input) * 100);
  return cents > 0 ? cents : null;
};

function AuthForm({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = useMutation({
    mutationFn: () => api.auth(mode, email, password),
    onSuccess: (r) => {
      setToken(r.accessToken);
      onDone();
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    auth.mutate();
  };

  return (
    <form className="card" onSubmit={submit}>
      <h1>{mode === 'register' ? 'Create account' : 'Log in'}</h1>
      <p className="muted">
        {mode === 'register'
          ? 'Register to get a wallet with 100.00 in demo funds.'
          : 'Welcome back. Enter your credentials.'}
      </p>
      <label>
        Email
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </label>
      <label>
        Password
        <input
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          minLength={8}
          required
        />
      </label>
      {auth.error && <p className="error">{auth.error.message}</p>}
      <button className="primary" type="submit" disabled={auth.isPending}>
        {auth.isPending
          ? mode === 'register'
            ? 'Creating account…'
            : 'Logging in…'
          : mode === 'register'
            ? 'Register'
            : 'Log in'}
      </button>
      <button
        className="link"
        type="button"
        onClick={() => {
          setMode(mode === 'login' ? 'register' : 'login');
          auth.reset();
        }}
      >
        {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log in'}
      </button>
    </form>
  );
}

function Wallet({ onLogout }: { onLogout: () => void }) {
  const qc = useQueryClient();
  const account = useQuery({ queryKey: ['account'], queryFn: api.account, retry: false });
  const transfers = useQuery({ queryKey: ['transfers'], queryFn: api.transfers, retry: false });
  const [toEmail, setToEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [notice, setNotice] = useState<string | null>(null);

  const cents = amount ? parseAmount(amount) : null;
  const invalidAmount = amount.length > 0 && cents === null;

  const send = useMutation({
    mutationFn: () => api.transfer(key, toEmail, cents!),
    onSuccess: () => {
      setKey(crypto.randomUUID());
      setToEmail('');
      setAmount('');
      setNotice('Transfer sent.');
      qc.invalidateQueries();
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    if (cents === null) return;
    send.mutate();
  };

  return (
    <div className="stack">
      <header className="topbar">
        <span className="brand">Wallet</span>
        <button className="ghost" onClick={onLogout}>
          Log out
        </button>
      </header>

      <section className="card balance-card">
        <p className="muted">Available balance</p>
        <h1 className="balance">
          {account.data ? money(account.data.balance, account.data.currency) : '—'}
        </h1>
      </section>

      <form className="card" onSubmit={submit}>
        <h2>Send money</h2>
        <label>
          Recipient email
          <input
            type="email"
            placeholder="friend@example.com"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Amount
          <input
            inputMode="decimal"
            placeholder="e.g. 12.50"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
        {invalidAmount && <p className="error">Enter a positive amount with up to 2 decimals.</p>}
        {send.error && <p className="error">{send.error.message}</p>}
        {notice && !send.error && <p className="success">{notice}</p>}
        <button
          className="primary"
          type="submit"
          disabled={send.isPending || cents === null}
        >
          {send.isPending ? 'Sending…' : 'Send'}
        </button>
      </form>

      <section className="card">
        <h2>History</h2>
        {transfers.isLoading && <p className="muted">Loading…</p>}
        {transfers.error && <p className="error">{transfers.error.message}</p>}
        {transfers.data?.length === 0 && <p className="muted">No transfers yet.</p>}
        {transfers.data && transfers.data.length > 0 && (
          <ul className="history">
            {transfers.data.map((t) => (
              <li key={t.id}>
                <span className={t.direction === 'sent' ? 'minus' : 'plus'}>
                  {t.direction === 'sent' ? '−' : '+'}
                  {money(t.amount)}
                </span>
                <span className="muted">{t.direction === 'sent' ? 'Sent' : 'Received'}</span>
                <span className="muted date">{new Date(t.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(hasToken());

  const logout = () => {
    setToken(null);
    setAuthed(false);
  };

  useEffect(() => {
    const onUnauthorized = () => setAuthed(false);
    window.addEventListener('unauthorized', onUnauthorized);
    return () => window.removeEventListener('unauthorized', onUnauthorized);
  }, []);

  return (
    <main className="app">
      {authed ? <Wallet onLogout={logout} /> : <AuthForm onDone={() => setAuthed(true)} />}
    </main>
  );
}
