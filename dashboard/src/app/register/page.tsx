'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'developer' | 'manager'>('developer');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(email, password, displayName, role);
      router.push('/city');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="pixel-card w-full max-w-sm">
        <h1 className="text-city-accent text-sm mb-6 text-center">NEW CITIZEN</h1>
        <p className="text-[10px] text-gray-400 mb-6 text-center">Join the Engineering City</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">DISPLAY NAME</label>
            <input
              type="text"
              className="pixel-input"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
            />
          </div>
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
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-400 mb-2">I AM A...</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole('developer')}
                className={`flex-1 border-2 p-2 text-[10px] text-center transition-colors ${
                  role === 'developer'
                    ? 'border-city-accent text-city-accent bg-city-accent/10'
                    : 'border-city-border text-gray-400 hover:border-gray-500'
                }`}
              >
                DEVELOPER
              </button>
              <button
                type="button"
                onClick={() => setRole('manager')}
                className={`flex-1 border-2 p-2 text-[10px] text-center transition-colors ${
                  role === 'manager'
                    ? 'border-city-gold text-city-gold bg-city-gold/10'
                    : 'border-city-border text-gray-400 hover:border-gray-500'
                }`}
              >
                MANAGER
              </button>
            </div>
            <p className="text-[8px] text-gray-500 mt-1">
              {role === 'manager'
                ? 'Managers create teams and manage hierarchy'
                : 'Developers join teams and build things'}
            </p>
          </div>

          {error && <p className="text-red-400 text-[10px]">{error}</p>}

          <button type="submit" className="pixel-btn w-full" disabled={busy}>
            {busy ? 'CREATING...' : 'CREATE CITIZEN'}
          </button>
        </form>

        <p className="text-[10px] text-gray-500 mt-4 text-center">
          Already a citizen?{' '}
          <Link href="/login" className="text-city-accent hover:underline">
            Enter here
          </Link>
        </p>
      </div>
    </div>
  );
}
