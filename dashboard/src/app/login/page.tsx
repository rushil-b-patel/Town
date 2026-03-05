'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      router.push('/city');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="pixel-card w-full max-w-sm">
        <h1 className="text-city-accent text-sm mb-6 text-center">CODETOWN</h1>
        <p className="text-[10px] text-gray-400 mb-6 text-center">Enter the Engineering City</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">EMAIL</label>
            <input
              type="email"
              className="pixel-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">PASSWORD</label>
            <input
              type="password"
              className="pixel-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-400 text-[10px]">{error}</p>}

          <button type="submit" className="pixel-btn w-full" disabled={busy}>
            {busy ? 'ENTERING...' : 'ENTER CITY'}
          </button>
        </form>

        <p className="text-[10px] text-gray-500 mt-4 text-center">
          New citizen?{' '}
          <Link href="/register" className="text-city-accent hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
