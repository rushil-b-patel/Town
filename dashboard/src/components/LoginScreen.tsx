'use client';
import React, { useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';

export default function LoginScreen() {
  const { login, register, loginDemo, error, loading } = useOfficeStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [trigram, setTrigram] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      await login(email, password);
    } else {
      await register(email, password, name, trigram, 'developer');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-[#1a1d27] px-6 py-3 pixel-border mb-4">
            <span className="font-pixel text-lg text-[#73eff7]">🏘 TOWN</span>
          </div>
          <p className="text-sm text-[#8b92a8]">Engineering Workspace</p>
        </div>

        {/* Form */}
        <div className="bg-[#1a1d27] rounded-2xl border border-[#2e3347] p-6">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-[#242837] rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all
                ${mode === 'login' ? 'bg-[#4A90D9] text-white' : 'text-[#8b92a8] hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all
                ${mode === 'register' ? 'bg-[#4A90D9] text-white' : 'text-[#8b92a8] hover:text-white'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#8b92a8] mb-1.5">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-[#242837] border border-[#2e3347] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555d75] focus:outline-none focus:border-[#4A90D9] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8b92a8] mb-1.5">Trigram</label>
                  <input
                    type="text"
                    value={trigram}
                    onChange={(e) => setTrigram(e.target.value.toUpperCase().slice(0, 3))}
                    maxLength={3}
                    placeholder="ABC"
                    className="w-full bg-[#242837] border border-[#2e3347] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555d75] focus:outline-none focus:border-[#4A90D9] transition-colors uppercase tracking-widest"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-[#8b92a8] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-[#242837] border border-[#2e3347] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555d75] focus:outline-none focus:border-[#4A90D9] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8b92a8] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#242837] border border-[#2e3347] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555d75] focus:outline-none focus:border-[#4A90D9] transition-colors"
              />
            </div>

            {error && (
              <div className="bg-[#b13e53]/15 border border-[#b13e53]/30 text-[#b13e53] px-3 py-2 rounded-lg text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-[#4A90D9] hover:bg-[#3a80c9] disabled:opacity-50 transition-all"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#2e3347]" />
            <span className="text-[10px] text-[#555d75]">or</span>
            <div className="flex-1 h-px bg-[#2e3347]" />
          </div>

          {/* Demo button */}
          <button
            onClick={loginDemo}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-[#8b92a8] bg-[#242837] hover:bg-[#2e3347] border border-[#2e3347] transition-all"
          >
            🎮 Try Demo Mode
          </button>
        </div>

        <p className="text-center text-[10px] text-[#555d75] mt-4">
          Demo mode lets you explore with sample data — no account needed
        </p>
      </div>
    </div>
  );
}
