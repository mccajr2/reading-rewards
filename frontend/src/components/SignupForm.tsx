import React, { useState } from 'react';

interface SignupFormProps {
  onSignup: (data: { id: string; email: string; username: string; role: string }) => void;
}

export default function SignupForm({ onSignup }: SignupFormProps) {
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
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      if (!res.ok) {
        const msg = await res.text();
        setError(msg || 'Signup failed');
        setLoading(false);
        return;
      }
      const data = await res.json();
      onSignup(data);
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
      <h2 style={{ textAlign: 'center' }}>Parent Signup</h2>
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
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          style={{ width: '100%', padding: 8, fontSize: 16 }}
        />
      </div>
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
      <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, fontSize: 16, background: '#388e3c', color: '#fff', border: 'none', borderRadius: 4 }}>
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  );
}
