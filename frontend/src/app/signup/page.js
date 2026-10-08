'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../AuthContext';
import { useRouter } from 'next/navigation';

const TCS_BUSINESS_GROUPS = [
  'BFSI (Banking, Financial Services & Insurance)',
  'LSHCERU (Life Sciences, Healthcare, Energy, Resources & Utilities)',
  'Manufacturing',
  'Retail & Consumer Business',
  'Communications, Media & Technology',
  'Hi-Tech',
  'Travel & Logistics',
  'Public Services & Government',
  'iON (Small & Medium Business)',
  'TCS Interactive',
  'Quartz (Blockchain & Crypto)',
  'Ignio (AI/ML Division)',
  'Other',
];

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '', email: '', employeeId: '',
    businessGroup: '', account: '',
    password: '', confirmPassword: '',
  });
  const [showPwd, setShowPwd]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup, user, loading }   = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.endsWith('@tcs.com')) {
      setError('Please use your official TCS email address (@tcs.com)');
      return;
    }
    if (!/^[A-Z0-9]{5,12}$/i.test(formData.employeeId)) {
      setError('Employee ID must be 5–12 alphanumeric characters');
      return;
    }
    if (!formData.businessGroup) {
      setError('Please select your Business Group');
      return;
    }
    if (!formData.account.trim()) {
      setError('Please enter your Account / Client name');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    const res = await signup(formData.email, formData.password, {
      name:          formData.name,
      employeeId:    formData.employeeId,
      businessGroup: formData.businessGroup,
      account:       formData.account,
    });
    if (res && res.success === false) setError(res.message || 'Error creating account');
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
        .signup-shell {
          min-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 36px 0;
        }
        .signup-card {
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          width: 100%;
          max-width: 960px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,0.18);
          border: 1px solid var(--border);
          min-height: 640px;
        }
        .signup-panel-left {
          position: relative;
          overflow: hidden;
          min-height: 600px;
        }
        .signup-panel-left-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          display: block;
        }
        .signup-panel-left-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(6,13,28,0.35) 0%,
            rgba(6,13,28,0.15) 35%,
            rgba(6,13,28,0.75) 100%
          );
          z-index: 1;
        }
        .signup-panel-left-content {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 28px;
          gap: 10px;
        }
        .signup-panel-right {
          background: var(--bg-surface);
          padding: 36px 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow-y: auto;
        }
        .signup-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .signup-illus { display: none; }
        .fw-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .fw-pill {
          border-radius: 20px;
          padding: 5px 13px;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        .fw-pill-blue {
          background: rgba(31,111,235,0.14);
          border: 1px solid rgba(31,111,235,0.38);
          color: rgba(100,160,255,0.9);
        }
        .fw-pill-amber {
          background: rgba(210,153,34,0.12);
          border: 1px solid rgba(210,153,34,0.38);
          color: rgba(210,153,34,0.9);
        }
        .signup-logo-box {
          width: 48px; height: 48px;
          background: var(--green-primary);
          border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; font-weight: 900; color: #fff;
          box-shadow: 0 6px 20px rgba(26,127,55,0.38);
          flex-shrink: 0;
        }
        .signup-title {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: var(--text-primary);
          margin: 0 0 4px;
        }
        .signup-subtitle {
          font-size: 0.86rem;
          color: var(--text-secondary);
          margin: 0 0 22px;
        }
        .signup-section-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin: 18px 0 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .signup-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .su-field {
          margin-bottom: 14px;
        }
        .su-label {
          display: block;
          font-size: 0.81rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .su-label .req {
          color: var(--green-primary);
          margin-left: 2px;
        }
        .su-input-wrap { position: relative; }
        .su-input {
          width: 100%;
          padding: 10px 13px;
          border: 1.5px solid var(--border);
          border-radius: 9px;
          font-size: 0.9rem;
          font-family: var(--font-sans);
          color: var(--text-primary);
          background: var(--bg-elevated);
          transition: border-color 0.18s, box-shadow 0.18s;
          outline: none;
        }
        .su-input:focus {
          border-color: var(--green-primary);
          box-shadow: 0 0 0 3px rgba(26,127,55,0.1);
          background: #fff;
        }
        .su-input.has-icon { padding-left: 38px; }
        .su-input.has-toggle { padding-right: 42px; }
        .su-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          color: var(--text-muted);
          pointer-events: none;
        }
        .su-toggle {
          position: absolute;
          right: 11px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .su-toggle:hover { color: var(--green-primary); }
        .su-hint {
          font-size: 0.73rem;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .su-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .su-submit {
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
          margin-top: 20px;
          transition: background 0.18s, box-shadow 0.18s, transform 0.12s;
          box-shadow: 0 4px 14px rgba(26,127,55,0.3);
        }
        .su-submit:hover:not(:disabled) {
          background: #1a6b2e;
          box-shadow: 0 6px 20px rgba(26,127,55,0.42);
          transform: translateY(-1px);
        }
        .su-submit:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
        .su-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff5f5;
          border: 1.5px solid #fca5a5;
          border-radius: 9px;
          padding: 10px 13px;
          font-size: 0.85rem;
          color: #b91c1c;
          margin-bottom: 14px;
        }
        .su-footer-link {
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 16px;
        }
        .su-footer-link a { color: var(--green-primary); font-weight: 700; text-decoration: none; }
        .su-footer-link a:hover { text-decoration: underline; }
        .su-legal {
          text-align: center;
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-top: 10px;
          line-height: 1.5;
        }
        @media (max-width: 740px) {
          .signup-card { grid-template-columns: 1fr !important; border-radius: 16px; }
          .signup-panel-left { display: none; }
          .signup-panel-right { padding: 32px 20px; }
          .su-grid-2 { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="signup-shell">
        <div className="signup-card">

          {/* ── LEFT: Full-bleed illustration ── */}
          <div className="signup-panel-left">
            <div className="signup-glow" style={{
              top: '-80px', left: '-60px', width: '300px', height: '300px',
              background: 'radial-gradient(ellipse, rgba(31,111,235,0.28) 0%, transparent 70%)',
            }} />
            <div className="signup-glow" style={{
              bottom: '-60px', right: '-40px', width: '240px', height: '240px',
              background: 'radial-gradient(ellipse, rgba(210,153,34,0.2) 0%, transparent 70%)',
            }} />

            {/* Full-bleed image */}
            <img src="/signup_illustration.jpg" alt="SDLC & AMS AI Frameworks" className="signup-panel-left-img" />

            {/* Dark gradient overlay */}
            <div className="signup-panel-left-overlay" />

            {/* Branding content pinned to bottom */}
            <div className="signup-panel-left-content">
              <div className="fw-pills">
                <span className="fw-pill fw-pill-blue">◈ SDLC Assessment</span>
                <span className="fw-pill fw-pill-amber">◈ AMS Assessment</span>
              </div>
              <p style={{
                fontSize: '1.1rem', fontWeight: 700, color: '#fff',
                margin: 0, lineHeight: 1.3, letterSpacing: '-0.02em',
              }}>
                AI Maturity Assessment<br />for TCS Accounts
              </p>
              <p style={{
                fontSize: '0.77rem', color: 'rgba(200,220,255,0.6)',
                margin: 0, lineHeight: 1.5,
              }}>
                5 domains · L0–L5 maturity levels<br />SDLC &amp; AMS frameworks
              </p>
            </div>
          </div>

          {/* ── RIGHT: Form Panel ── */}
          <div className="signup-panel-right">

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
              <div className="signup-logo-box">Σ</div>
              <div>
                <h1 className="signup-title">Create your account</h1>
                <p className="signup-subtitle">Join TCS MaturityIQ to begin your AI maturity assessment</p>
              </div>
            </div>

            {error && (
              <div className="su-error">
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>error_outline</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* ── Section: Personal Info ── */}
              <div className="signup-section-label">
                <span className="material-icons" style={{ fontSize: '0.95rem' }}>person</span>
                Personal Information
              </div>

              <div className="su-field">
                <label htmlFor="su-name" className="su-label">Full Name <span className="req">*</span></label>
                <div className="su-input-wrap">
                  <span className="material-icons su-icon">badge</span>
                  <input id="su-name" name="name" type="text" className="su-input has-icon"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name} onChange={handleChange}
                    required autoComplete="name" />
                </div>
              </div>

              <div className="su-field">
                <label htmlFor="su-email" className="su-label">TCS Email Address <span className="req">*</span></label>
                <div className="su-input-wrap">
                  <span className="material-icons su-icon">alternate_email</span>
                  <input id="su-email" name="email" type="email" className="su-input has-icon"
                    placeholder="firstname.lastname@tcs.com"
                    value={formData.email} onChange={handleChange}
                    required autoComplete="email" />
                </div>
                <p className="su-hint">Must be a valid @tcs.com email address</p>
              </div>

              {/* ── Section: TCS Details ── */}
              <div className="signup-section-label">
                <span className="material-icons" style={{ fontSize: '0.95rem' }}>corporate_fare</span>
                TCS Details
              </div>

              <div className="su-grid-2">
                <div className="su-field">
                  <label htmlFor="su-empid" className="su-label">Employee ID <span className="req">*</span></label>
                  <div className="su-input-wrap">
                    <span className="material-icons su-icon">tag</span>
                    <input id="su-empid" name="employeeId" type="text" className="su-input has-icon"
                      placeholder="e.g. 1234567"
                      value={formData.employeeId} onChange={handleChange}
                      required maxLength={12} />
                  </div>
                  <p className="su-hint">5–12 alphanumeric characters</p>
                </div>

                <div className="su-field">
                  <label htmlFor="su-account" className="su-label">Account / Client <span className="req">*</span></label>
                  <div className="su-input-wrap">
                    <span className="material-icons su-icon">domain</span>
                    <input id="su-account" name="account" type="text" className="su-input has-icon"
                      placeholder="e.g. JP Morgan, Walgreens"
                      value={formData.account} onChange={handleChange}
                      required />
                  </div>
                </div>
              </div>

              <div className="su-field">
                <label htmlFor="su-bg" className="su-label">Business Group <span className="req">*</span></label>
                <div className="su-input-wrap">
                  <span className="material-icons su-icon">business</span>
                  <select id="su-bg" name="businessGroup" className="su-input has-icon"
                    value={formData.businessGroup} onChange={handleChange} required
                    style={{ appearance: 'none', cursor: 'pointer' }}>
                    <option value="">— Select your Business Group —</option>
                    {TCS_BUSINESS_GROUPS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── Section: Security ── */}
              <div className="signup-section-label">
                <span className="material-icons" style={{ fontSize: '0.95rem' }}>security</span>
                Security
              </div>

              <div className="su-grid-2">
                <div className="su-field">
                  <label htmlFor="su-password" className="su-label">Password <span className="req">*</span></label>
                  <div className="su-input-wrap">
                    <span className="material-icons su-icon">lock_outline</span>
                    <input id="su-password" name="password"
                      type={showPwd ? 'text' : 'password'}
                      className="su-input has-icon has-toggle"
                      placeholder="Min. 6 characters"
                      value={formData.password} onChange={handleChange}
                      required autoComplete="new-password" />
                    <button type="button" className="su-toggle"
                      onClick={() => setShowPwd(v => !v)}
                      aria-label={showPwd ? 'Hide' : 'Show'}>
                      <span className="material-icons" style={{ fontSize: '1rem' }}>
                        {showPwd ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="su-field">
                  <label htmlFor="su-confirm" className="su-label">Confirm Password <span className="req">*</span></label>
                  <div className="su-input-wrap">
                    <span className="material-icons su-icon">lock_outline</span>
                    <input id="su-confirm" name="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      className="su-input has-icon has-toggle"
                      placeholder="Repeat password"
                      value={formData.confirmPassword} onChange={handleChange}
                      required autoComplete="new-password" />
                    <button type="button" className="su-toggle"
                      onClick={() => setShowConfirm(v => !v)}
                      aria-label={showConfirm ? 'Hide' : 'Show'}>
                      <span className="material-icons" style={{ fontSize: '1rem' }}>
                        {showConfirm ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="su-submit" disabled={submitting}>
                {submitting
                  ? <><span className="spinner-border spinner-border-sm" role="status" /> Creating account…</>
                  : <><span className="material-icons" style={{ fontSize: '1.1rem' }}>how_to_reg</span> Create Account</>}
              </button>
            </form>

            <p className="su-footer-link">
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
            <p className="su-legal">
              By creating an account you agree to use TCS MaturityIQ for authorised assessment purposes only.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
