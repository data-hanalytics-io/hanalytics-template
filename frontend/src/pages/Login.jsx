import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      } else {
        setError(data.error || 'Erreur de connexion');
      }
    } catch (err) {
      setError('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #F5F5F5 0%, #C7B7E3 100%)' }}>
      <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.95)', padding: 40, borderRadius: 20, boxShadow: '0 8px 32px rgba(129,126,225,0.13)', minWidth: 340, maxWidth: 380, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h2 style={{ color: '#B5A2D8', fontWeight: 900, fontSize: 28, letterSpacing: 1, margin: 0, fontFamily: 'Inter, sans-serif' }}>Connexion</h2>
          <p style={{ color: '#7F6F9D', fontSize: 15, margin: 0, marginTop: 4 }}>Accédez à votre dashboard Hanalytics</p>
        </div>
        <div style={{ marginBottom: 18, width: '100%' }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#2E1065', fontWeight: 600 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #D9D1E3', fontSize: 15, fontFamily: 'Inter', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 18, width: '100%' }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#2E1065', fontWeight: 600 }}>Mot de passe</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #D9D1E3', fontSize: 15, fontFamily: 'Inter', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }} />
        </div>
        {error && <div style={{ color: '#FF3F52', background: '#FFE6EA', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontWeight: 600, fontSize: 14 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ width: '100%', background: 'linear-gradient(90deg, #B5A2D8 0%, #7F6F9D 100%)', color: '#fff', padding: 14, border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 17, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(181,162,216,0.10)', marginTop: 8, letterSpacing: 1 }}>{loading ? 'Connexion...' : 'Se connecter'}</button>
      </form>
    </div>
  );
} 