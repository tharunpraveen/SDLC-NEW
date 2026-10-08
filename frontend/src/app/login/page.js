'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../AuthContext';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(user.role === 'admin' || user.email === 'admin@sdlc.com' ? '/admin' : '/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const fullEmail = email.includes('@') ? email : `${email}@tcs.com`;
    const res = await login(fullEmail, password);
    if (res && res.success === false) setError(res.message || 'Invalid credentials');
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner-border" role="status" style={{ color: 'var(--green-primary)', width: '2rem', height: '2rem' }}>
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .auth-shell {
          min-height: 86vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 0;
        }
        .auth-card {
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          max-width: 900px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,0.18);
          border: 1px solid var(--border);
          min-height: 580px;
        }
        .auth-panel-left {
          position: relative;
          overflow: hidden;
          min-height: 540px;
        }
        .auth-panel-left-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        .auth-panel-left-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(6,13,28,0.45) 0%,
            rgba(6,13,28,0.25) 40%,
            rgba(6,13,28,0.72) 100%
          );
          z-index: 1;
        }
        .auth-panel-left-content {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 28px;
          gap: 10px;
        }
        .auth-panel-right {
          background: var(--bg-surface);
          padding: 48px 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0;
        }
        .auth-glow-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .auth-illus { display: none; }
        .auth-brand-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 24px;
          padding: 7px 16px;
          width: fit-content;
        }
        .auth-brand-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #3fb950;
          box-shadow: 0 0 6px #3fb950;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%,100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .auth-brand-text {
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(220,235,255,0.75);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .auth-logo-box {
          width: 52px; height: 52px;
          background: var(--green-primary);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; font-weight: 900; color: #fff;
          box-shadow: 0 6px 22px rgba(26,127,55,0.4);
          flex-shrink: 0;
          margin-bottom: 4px;
        }
        .auth-title {
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: var(--text-primary);
          margin: 0 0 6px;
          line-height: 1.2;
        }
        .auth-subtitle {
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin: 0 0 28px;
          line-height: 1.5;
        }
        .auth-field-group {
          margin-bottom: 18px;
        }
        .auth-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 7px;
          letter-spacing: 0.01em;
        }
        .auth-input-wrap {
          position: relative;
        }
        .auth-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          font-size: 0.92rem;
          font-family: var(--font-sans);
          color: var(--text-primary);
          background: var(--bg-elevated);
          transition: border-color 0.18s, box-shadow 0.18s;
          outline: none;
        }
        .auth-input:focus {
          border-color: var(--green-primary);
          box-shadow: 0 0 0 3px rgba(26,127,55,0.12);
          background: #fff;
        }
        .auth-input.has-icon {
          padding-left: 40px;
        }
        .auth-input.has-toggle {
          padding-right: 44px;
        }
        .auth-input-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.05rem;
          color: var(--text-muted);
          pointer-events: none;
          user-select: none;
        }
        .auth-pwd-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          font-size: 1.05rem;
          transition: color 0.15s;
        }
        .auth-pwd-toggle:hover { color: var(--green-primary); }
        .auth-hint {
          font-size: 0.74rem;
          color: var(--text-muted);
          margin-top: 5px;
        }
        .auth-submit-btn {
          width: 100%;
          padding: 13px;
          background: var(--green-primary);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: var(--font-sans);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
          transition: background 0.18s, box-shadow 0.18s, transform 0.12s;
          box-shadow: 0 4px 14px rgba(26,127,55,0.3);
        }
        .auth-submit-btn:hover:not(:disabled) {
          background: #1a6b2e;
          box-shadow: 0 6px 20px rgba(26,127,55,0.4);
          transform: translateY(-1px);
        }
        .auth-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0;
        }
        .auth-divider-line {
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .auth-divider-text {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .auth-footer-link {
          text-align: center;
          font-size: 0.86rem;
          color: var(--text-secondary);
          margin-top: 20px;
        }
        .auth-footer-link a {
          color: var(--green-primary);
          font-weight: 700;
          text-decoration: none;
        }
        .auth-footer-link a:hover { text-decoration: underline; }
        .auth-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff5f5;
          border: 1.5px solid #fca5a5;
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 0.86rem;
          color: #b91c1c;
          margin-bottom: 18px;
        }
        .auth-legal {
          text-align: center;
          font-size: 0.73rem;
          color: var(--text-muted);
          margin-top: 16px;
          line-height: 1.5;
        }
        @media (max-width: 700px) {
          .auth-card { grid-template-columns: 1fr !important; border-radius: 16px; }
          .auth-panel-left { display: none; }
          .auth-panel-right { padding: 36px 24px; }
          .auth-title { font-size: 1.4rem; }
        }
      `}</style>

      <div className="auth-shell">
        <div className="auth-card">

          {/* ── LEFT: Illustration Panel ── */}
          <div className="auth-panel-left">
            <div className="auth-glow-blob" style={{
              top: '-80px', left: '-60px', width: '320px', height: '320px',
              background: 'radial-gradient(ellipse, rgba(31,111,235,0.3) 0%, transparent 70%)',
            }} />
            <div className="auth-glow-blob" style={{
              bottom: '-60px', right: '-40px', width: '260px', height: '260px',
              background: 'radial-gradient(ellipse, rgba(26,127,55,0.22) 0%, transparent 70%)',
            }} />

            {/* Full-bleed image */}
            <img src="/login_illustration.jpg" alt="AI Maturity Platform" className="auth-panel-left-img" style={{ objectPosition: 'center center' }} />

            {/* Dark gradient overlay */}
            <div className="auth-panel-left-overlay" />

            {/* Branding content pinned to bottom */}
            <div className="auth-panel-left-content">
              <div className="auth-brand-pill">
                <span className="auth-brand-dot" />
                <span className="auth-brand-text">TCS MaturityIQ</span>
              </div>
              <p style={{
                fontSize: '1.15rem', fontWeight: 700, color: '#fff',
                margin: 0, lineHeight: 1.3, letterSpacing: '-0.02em',
              }}>
                Benchmark AI maturity<br />across your organisation
              </p>
              <p style={{
                fontSize: '0.78rem', color: 'rgba(200,220,255,0.6)',
                margin: 0, lineHeight: 1.5,
              }}>
                SDLC &amp; AMS · L0–L5 levels · 5 domains
              </p>
            </div>
          </div>

          {/* ── RIGHT: Form Panel ── */}
          <div className="auth-panel-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
              <div className="auth-logo-box">Σ</div>
              <div>
                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-subtitle" style={{ marginBottom: 0 }}>Sign in to your TCS MaturityIQ account</p>
              </div>
            </div>

            {error && (
              <div className="auth-error">
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>error_outline</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="auth-field-group">
                <label htmlFor="login-email" className="auth-label">Email Address</label>
                <div className="auth-input-wrap">
                  <span className="material-icons auth-input-icon">alternate_email</span>
                  <input
                    id="login-email"
                    type="text"
                    className="auth-input has-icon"
                    placeholder="firstname.lastname or full @tcs.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <p className="auth-hint">Enter your TCS email or just <em>firstname.lastname</em> (auto-appends @tcs.com)</p>
              </div>

              {/* Password */}
              <div className="auth-field-group">
                <label htmlFor="login-password" className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <span className="material-icons auth-input-icon">lock_outline</span>
                  <input
                    id="login-password"
                    type={showPwd ? 'text' : 'password'}
                    className="auth-input has-icon has-toggle"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-pwd-toggle"
                    onClick={() => setShowPwd(v => !v)}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-icons" style={{ fontSize: '1.05rem' }}>
                      {showPwd ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={submitting}>
                {submitting ? (
                  <><span className="spinner-border spinner-border-sm" role="status" /> Signing in…</>
                ) : (
                  <><span className="material-icons" style={{ fontSize: '1.1rem' }}>login</span> Sign In</>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">New to MaturityIQ?</span>
              <span className="auth-divider-line" />
            </div>

            <Link href="/signup" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              padding: '11px', border: '1.5px solid var(--border)', borderRadius: '10px',
              fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)',
              textDecoration: 'none', transition: 'border-color 0.18s, background 0.18s',
              background: 'var(--bg-elevated)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green-primary)'; e.currentTarget.style.color = 'var(--green-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            >
              <span className="material-icons" style={{ fontSize: '1.1rem' }}>person_add</span>
              Create a new account
            </Link>

            <p className="auth-legal">
              By signing in you agree to use TCS MaturityIQ for authorised assessment purposes only.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
