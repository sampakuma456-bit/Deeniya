import React, { useState, useEffect } from 'react';
import './Login.css';

const bgImages = [
  'https://cdn.pixabay.com/photo/2013/04/28/20/01/mecca-107730_1280.jpg',
  'https://cdn.pixabay.com/photo/2013/05/08/17/18/mecca-109880_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/04/10/09/06/house-of-allah-2217860_1280.jpg',
];

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setBgIndex(i => (i + 1) % bgImages.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const [loggingIn, setLoggingIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Hardcoded fallback for master admin
    if (email === 'admin@gmail.com' && password === 'Admin123') {
      onLogin(email);
      return;
    }

    setLoggingIn(true);
    try {
      const res = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid username or password');
        setLoggingIn(false);
        return;
      }
      onLogin(email);
    } catch (err) {
      setError('Connection error. Please try again.');
      setLoggingIn(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background carousel */}
      <div className="login-bg">
        {bgImages.map((src, i) => (
          <div key={i} className={`login-bg-layer ${i === bgIndex ? 'active' : ''}`} style={{ backgroundImage: `url(${src})` }} />
        ))}
        <div className="login-bg-overlay" />
        <div className="login-bg-pattern" />
        <div className="login-bg-content">
          <div className="login-bg-icon">﷽</div>
          <h1 className="login-bg-title">المسجد الحرام والمسجد النبوي</h1>
          <p className="login-bg-subtitle">Holy Makkah & Madinah — The Two Sacred Mosques</p>
          <div className="login-bg-decoration">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      {/* Login card - right side */}
      <div className="login-card-wrapper">
        <div className="login-card">
          <div className="login-card-inner">
            <div className="login-logo">
              <svg viewBox="0 0 40 40" fill="none" className="login-logo-icon">
                <rect width="40" height="40" rx="10" fill="currentColor" opacity="0.15" />
                <path d="M20 8l3.5 7.5L32 17l-6 5.5 1.5 8L20 27l-7.5 3.5L14 22.5 8 17l8.5-1.5L20 8z" fill="currentColor" />
              </svg>
              <span className="login-logo-text">Deeniya</span>
            </div>

            <h2 className="login-greeting">Welcome Back</h2>
            <p className="login-hint">Sign in to your account to continue</p>

            <form onSubmit={handleSubmit} className="login-form">
              {error && <div className="login-error">{error}</div>}

              <div className="login-field">
                <label htmlFor="email">Email</label>
                <div className="login-input-wrap">
                  <svg className="login-input-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2.5 4.5h15v11h-15z" /><path d="M2.5 4.5l7.5 5.5 7.5-5.5" />
                  </svg>
                  <input type="email" id="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gmail.com" required />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="password">Password</label>
                <div className="login-input-wrap">
                  <svg className="login-input-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3.5" y="9.5" width="13" height="8" rx="1.5" /><path d="M6.5 9.5V6a3.5 3.5 0 117 0v3.5" />
                  </svg>
                  <input type="password" id="password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required />
                </div>
              </div>

              <button type="submit" className="login-submit" disabled={loggingIn}>
                {loggingIn ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <p className="login-footer">Deeniya Donation Management System v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
