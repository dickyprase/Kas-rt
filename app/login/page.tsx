'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (res.ok) {
      router.push('/admin');
    } else {
      setError(data.error || 'Login failed');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[--background] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[--card-bg] rounded-2xl p-6 border border-[--card-border]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">🔐 Admin Login</h1>
          <ThemeToggle />
        </div>
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[--muted-text] mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-[--input-bg] rounded-lg px-4 py-2 border border-[--input-border] focus:border-blue-500 focus:outline-none text-[--foreground]"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[--muted-text] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[--input-bg] rounded-lg px-4 py-2 border border-[--input-border] focus:border-blue-500 focus:outline-none text-[--foreground]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg py-2 font-medium transition"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
