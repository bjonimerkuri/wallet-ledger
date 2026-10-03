import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api, hasToken, setToken } from './api';

const money = (minor: number, currency = 'EUR') =>
  new Intl.NumberFormat('en', { style: 'currency', currency }).format(minor / 100);

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

  return (
    <form onSubmit={(e) => { e.preventDefault(); auth.mutate(); }}>
      <h2>{mode === 'register' ? 'Create account' : 'Log in'}</h2>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password (min 8)" value={password} onChange={(e) => setPassword(e.target.value)} />
      {auth.error && <p style={{ color: 'crimson' }}>{auth.error.message}</p>}
      <button type="submit">{mode === 'register' ? 'Register' : 'Log in'}</button>
      <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Need an account?' : 'Have an account?'}
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

  const send = useMutation({
    mutationFn: () => api.transfer(key, toEmail, Math.round(Number(amount) * 100)),
    onSuccess: () => {
      setKey(crypto.randomUUID());
      setToEmail('');
      setAmount('');
      qc.invalidateQueries();
    },
  });

  useEffect(() => {
    if (account.error) onLogout(); 
  }, [account.error, onLogout]);

  return (
    <div>
      <button onClick={onLogout} style={{ float: 'right' }}>Log out</button>
      <h2>Balance: {account.data ? money(account.data.balance, account.data.currency) : '…'}</h2>

      <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
        <h3>Send money</h3>
        <input placeholder="Recipient email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} />
        <input placeholder="Amount (e.g. 12.50)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        {send.error && <p style={{ color: 'crimson' }}>{send.error.message}</p>}
        <button type="submit" disabled={send.isPending}>Send</button>
      </form>

      <h3>History</h3>
      <ul>
        {transfers.data?.map((t) => (
          <li key={t.id}>
            {t.direction === 'sent' ? '−' : '+'}{money(t.amount)} · {t.direction} · {new Date(t.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(hasToken());
  const logout = () => { setToken(null); setAuthed(false); };
  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 520, margin: '40px auto', padding: 16, display: 'grid', gap: 8 }}>
      {authed ? <Wallet onLogout={logout} /> : <AuthForm onDone={() => setAuthed(true)} />}
    </div>
  );
}
