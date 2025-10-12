import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (data: { token: string; role: string; username: string; email?: string; id: string }) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [isParent, setIsParent] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = isParent ? { email, password } : { username, password };
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError('Invalid credentials');
        setLoading(false);
        return;
      }
      const data = await res.json();
      onLogin(data);
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
      <h2 style={{ textAlign: 'center' }}>Login</h2>
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <label>
          <input type="radio" checked={isParent} onChange={() => setIsParent(true)} /> Parent
        </label>
        <label style={{ marginLeft: 24 }}>
          <input type="radio" checked={!isParent} onChange={() => setIsParent(false)} /> Child
        </label>
      </div>
      {isParent ? (
        <div style={{ marginBottom: 16 }}>
          <input
            type="email"
            placeholder="Parent Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8, fontSize: 16 }}
          />
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Child Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: 8, fontSize: 16 }}
          />
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: 8, fontSize: 16 }}
        />
      </div>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, fontSize: 16, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
