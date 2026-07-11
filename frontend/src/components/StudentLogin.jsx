import React, { useState } from 'react';

export default function StudentLogin({ defaultEmail, onLogin, onClose }) {
  const [email, setEmail] = useState(defaultEmail || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [userExists, setUserExists] = useState(null);
  const [userChecked, setUserChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);


  const checkUser = async (val) => {
    if (!val) { setUserExists(null); setUserChecked(false); return; }
    setChecking(true);
    setError('');
    setUserChecked(false);
    try {
      const res = await fetch('http://localhost:5000/api/users/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: val })
      });
      const data = await res.json();
      setUserExists(data.exists ? data.user : null);
      setUserChecked(true);
    } catch {
      setUserExists(null);
      setUserChecked(true);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoggingIn(true);
    try {
      const res = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid credentials');
        setLoggingIn(false);
        return;
      }
      onLogin({ ...data.user, username: data.user.name });
    } catch {
      setError('Connection error. Please try again.');
      setLoggingIn(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: 'var(--bg, #fff)', borderRadius: 20,
        padding: 40, width: 400, maxWidth: '90vw',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 16,
          background: 'none', border: 'none', fontSize: 24,
          cursor: 'pointer', color: 'var(--text, #666)'
        }}>&times;</button>

        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'var(--accent, #aa3bff)', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, color: '#fff'
          }}>S</div>
          <h2 style={{ margin: 0, fontSize: 24, color: 'var(--text-h, #000)', fontWeight: 700 }}>
            Student Login
          </h2>
          <p style={{ margin: '6px 0 0', color: 'var(--text, #666)', fontSize: 14 }}>
            Enter your password to access the Student Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && <div style={{
            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
            padding: '10px 14px', borderRadius: 8, fontSize: 14,
            textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)'
          }}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-h, #000)' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <input type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setUserChecked(false); setUserExists(null); }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border, #e5e4e7)'; email && checkUser(email); }}
                placeholder="Enter your email"
                required
                autoFocus
                style={{
                  width: '100%', padding: '12px 40px 12px 16px', border: '1px solid var(--border, #e5e4e7)',
                  borderRadius: 10, fontSize: 15, outline: 'none',
                  background: 'var(--bg, #fff)', color: 'var(--text-h, #000)',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent, #aa3bff)'}
              />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                {checking && <span style={{ fontSize: 12, color: '#999' }}>...</span>}
                {!checking && userExists && <span style={{ fontSize: 14, color: '#10b981' }}>&#10003;</span>}
                {!checking && userChecked && !userExists && <span style={{ fontSize: 14, color: '#ef4444' }}>&#10007;</span>}
              </span>
            </div>
            {userChecked && !userExists && <span style={{ fontSize: 12, color: '#ef4444' }}>User not found</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-h, #000)' }}>Password</label>
            <input type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoFocus
              style={{
                padding: '12px 16px', border: '1px solid var(--border, #e5e4e7)',
                borderRadius: 10, fontSize: 15, outline: 'none',
                background: 'var(--bg, #fff)', color: 'var(--text-h, #000)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent, #aa3bff)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border, #e5e4e7)'}
            />
          </div>

          <button type="submit" disabled={loggingIn || !userExists} style={{
            marginTop: 8, padding: '14px', border: 'none', borderRadius: 10,
            background: userExists ? 'var(--accent, #aa3bff)' : '#ccc',
            color: '#fff', fontSize: 16, fontWeight: 600, cursor: userExists ? 'pointer' : 'not-allowed',
            transition: 'transform 0.2s', opacity: loggingIn ? 0.7 : 1
          }}
            onMouseOver={(e) => { if (userExists) e.target.style.transform = 'translateY(-1px)'; }}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >{loggingIn ? 'Signing In...' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  );
}
