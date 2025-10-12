import React, { useState } from 'react';

interface CreateChildFormProps {
  onChildCreated?: (child: { id: string; username: string; role: string; parentId: string }) => void;
}

export default function CreateChildForm({ onChildCreated }: CreateChildFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/create-child`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const msg = await res.text();
        setError(msg || 'Failed to create child account');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSuccess('Child account created!');
      setUsername('');
      setPassword('');
      if (onChildCreated) onChildCreated(data);
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
      <h3 style={{ textAlign: 'center' }}>Create Child Account</h3>
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
      {success && <div style={{ color: 'green', marginBottom: 12 }}>{success}</div>}
      <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, fontSize: 16, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }}>
        {loading ? 'Creating...' : 'Create Child'}
      </button>
    </form>
  );
}
