'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthContext';

const SDLC_AREAS = [
  { name: 'Requirements', color: '#da3633', icon: 'checklist',            desc: 'AI-powered idea exploration, backlog refinement, impact analysis, and bidirectional traceability.' },
  { name: 'Architecture', color: '#1f6feb', icon: 'account_tree',         desc: 'Architecture synthesisers, diagram generation, PR drift detection, compliance analysis, and FinOps.' },
  { name: 'Development',  color: 'rgb(26, 127, 55)', icon: 'code',        desc: 'AI coding assistants, agentic pull requests, custom MCP scripts, and dependency mapping.' },
  { name: 'Testing',      color: '#d29922', icon: 'science',              desc: 'E2E workflow automation, synthetic data creation, defect classification, and test generation.' },
  { name: 'Deployment',   color: '#8957e5', icon: 'rocket_launch',        desc: 'Automated release notes, capacity prediction, self-healing systems, and CI/CD quality gates.' },
];

const AMS_AREAS = [
  { name: 'Service Management',  color: '#0ea5e9', icon: 'support_agent',          desc: 'AI-driven SLA monitoring, self-service request fulfilment, and proactive service catalogue governance.' },
  { name: 'Incident Management', color: '#f43f5e', icon: 'warning_amber',          desc: 'Automated incident triage, runbook execution, self-healing remediation, and escalation intelligence.' },
  { name: 'Change Management',   color: '#f97316', icon: 'published_with_changes', desc: 'AI change risk scoring, conflict detection, blast radius prediction, and approval automation.' },
  { name: 'Problem Management',  color: '#a855f7', icon: 'manage_search',          desc: 'Automated root cause analysis, predictive anomaly detection, and structured problem resolution.' },
  { name: 'Release Management',  color: '#10b981', icon: 'rocket_launch',          desc: 'AI-powered release gate assessment, pipeline orchestration, and go/no-go recommendation engine.' },
];

const LEVELS = [
  { label: 'L0', title: 'Traditional',          color: '#484f58', desc: 'Entirely manual processes. No AI tools integrated into workflows.' },
  { label: 'L1', title: 'Assisted / Tool',       color: '#1f6feb', desc: 'Basic inline autocomplete, chat assistants, and ad-hoc AI scripts.' },
  { label: 'L2', title: 'Delegated / Assistant', color: '#8957e5', desc: 'AI acts as copilot — opening tickets, drafting analyses under supervision.' },
  { label: 'L3', title: 'Supervised Agent',      color: '#d29922', desc: 'AI agents orchestrate multi-step tasks with human approval gates.' },
  { label: 'L4', title: 'Autonomous Workforce',  color: '#2ea043', desc: 'Automated safety nets, autonomous task execution, structured evals.' },
  { label: 'L5', title: 'Agentic Enterprise',    color: '#3fb950', desc: 'Self-healing production, automatic drift remediation, fully autonomous workflows.' },
];

export default function Home() {
  const { user } = useAuth();
  const [activeFramework, setActiveFramework] = useState('SDLC');
  const [sdlcCount, setSdlcCount] = useState(120);
  const [amsCount, setAmsCount]   = useState(10);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [r1, r2] = await Promise.all([
          fetch('/api/questions?framework=SDLC', { cache: 'no-store' }),
          fetch('/api/questions?framework=AMS',  { cache: 'no-store' }),
        ]);
        if (r1.ok) { const d = await r1.json(); setSdlcCount(d.questions?.length || 120); }
        if (r2.ok) { const d = await r2.json(); setAmsCount(d.questions?.length || 10); }
      } catch (_) {}
    }
    fetchCounts();
  }, []);

  const dashboardLink = user
    ? (user.role === 'admin' || user.email === 'admin@sdlc.com' ? '/admin' : '/dashboard')
    : null;

  const areas = activeFramework === 'SDLC' ? SDLC_AREAS : AMS_AREAS;

  return (
    <div className="landing-container">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="hero-section text-center" style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '20px', padding: '80px 40px',
        position: 'relative', overflow: 'hidden', marginBottom: '40px',
      }}>
        <div style={{
          position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '320px',
          background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.09) 0%, rgba(99,102,241,0.05) 50%, transparent 70%)',
          pointerEvents: 'none',
        }} />



        <h1 style={{
          fontSize: 'clamp(2.2rem, 5.5vw, 3.6rem)', fontWeight: 800,
          fontFamily: 'var(--font-sans)', letterSpacing: '-0.04em',
          lineHeight: 1.15, marginBottom: '20px', color: 'var(--text-primary)',
        }}>
          Measure. Benchmark.<br />
          <span style={{ background: 'linear-gradient(135deg, rgb(26, 127, 55) 0%, #1f6feb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Elevate Your AI Maturity
          </span>
        </h1>

        <p style={{ maxWidth: '700px', margin: '0 auto 32px', color: 'var(--text-secondary)', fontSize: '17px', lineHeight: 1.75 }}>
          Two precision assessment frameworks —{' '}
          <strong style={{ color: 'rgb(26, 127, 55)' }}>SDLC Assessment</strong> and{' '}
          <strong style={{ color: '#6366f1' }}>AMS Assessment</strong> — to audit your engineering and operations teams across every AI maturity dimension.
        </p>

        <div className="d-flex justify-content-center gap-3 flex-wrap">
          {user ? (
            <Link href={dashboardLink} className="btn-primary-action">Go to Dashboard →</Link>
          ) : (
            <>
              <Link href="/signup" className="btn-primary-action">Get Started Free →</Link>
              <Link href="/login"  className="btn-secondary-action">Sign In</Link>
            </>
          )}
        </div>
      </section>

      {/* ── Two Framework Cards ──────────────────────────────────────────── */}
      <section style={{ marginBottom: '48px' }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="divider flex-grow-1" />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Two Assessment Frameworks</span>
          <div className="divider flex-grow-1" />
        </div>

        <div className="row g-4">
          {/* SDLC Card */}
          <div className="col-md-6">
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: '16px', overflow: 'hidden', height: '100%',
              borderTop: '3px solid rgb(26, 127, 55)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              display: 'flex', flexDirection: 'column',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(16,185,129,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Image */}
              <div style={{ width: '100%', height: '160px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <img src="/sdlc_card.jpg" alt="SDLC pipeline illustration" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {/* Content */}
              <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', background: 'rgba(16,185,129,0.15)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-icons" style={{ color: 'rgb(26, 127, 55)', fontSize: '1.2rem' }}>developer_mode</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgb(26, 127, 55)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Framework 1</div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>SDLC Assessment</h2>
                  </div>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px', flexGrow: 1 }}>
                  Audit your engineering team&apos;s AI maturity across the full software delivery lifecycle — from requirements and architecture through code, testing, and deployment.
                </p>
                <div className="d-flex flex-wrap gap-2" style={{ marginBottom: '16px' }}>
                  {SDLC_AREAS.map(a => (
                    <span key={a.name} style={{ fontSize: '0.68rem', fontWeight: 600, color: a.color, background: `${a.color}18`, border: `1px solid ${a.color}30`, borderRadius: '100px', padding: '3px 10px' }}>{a.name}</span>
                  ))}
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'rgb(26, 127, 55)', fontSize: '1.05rem', fontWeight: 800 }}>{sdlcCount}</strong> questions · 5 domains
                  </div>
                  <Link href="/sdlc" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgb(26, 127, 55)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Explore <span className="material-icons" style={{ fontSize: '1rem' }}>arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* AMS Card */}
          <div className="col-md-6">
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: '16px', overflow: 'hidden', height: '100%',
              borderTop: '3px solid #6366f1',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              display: 'flex', flexDirection: 'column',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(99,102,241,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Image */}
              <div style={{ width: '100%', height: '160px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <img src="/ams_card.jpg" alt="AMS operations dashboard illustration" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {/* Content */}
              <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', background: 'rgba(99,102,241,0.15)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-icons" style={{ color: '#6366f1', fontSize: '1.2rem' }}>support_agent</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Framework 2</div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>AMS Assessment</h2>
                  </div>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px', flexGrow: 1 }}>
                  Evaluate your operations team&apos;s AI maturity across application management — from service catalogues and incident triage to change risk, problem resolution, and release orchestration.
                </p>
                <div className="d-flex flex-wrap gap-2" style={{ marginBottom: '16px' }}>
                  {AMS_AREAS.map(a => (
                    <span key={a.name} style={{ fontSize: '0.68rem', fontWeight: 600, color: a.color, background: `${a.color}18`, border: `1px solid ${a.color}30`, borderRadius: '100px', padding: '3px 10px' }}>{a.name}</span>
                  ))}
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <strong style={{ color: '#6366f1', fontSize: '1.05rem', fontWeight: 800 }}>{amsCount}</strong> questions · 5 domains
                  </div>
                  <Link href="/ams" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Explore <span className="material-icons" style={{ fontSize: '1rem' }}>arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Domain Explorer (tabbed) ──────────────────────────────────────── */}
      <section id="domains" style={{ marginBottom: '48px' }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="divider flex-grow-1" />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Assessment Domains</span>
          <div className="divider flex-grow-1" />
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
          {['SDLC', 'AMS'].map(fw => (
            <button key={fw} onClick={() => setActiveFramework(fw)} style={{
              padding: '8px 24px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s ease',
              background: activeFramework === fw ? (fw === 'SDLC' ? 'rgb(26, 127, 55)' : '#6366f1') : 'transparent',
              color: activeFramework === fw ? '#fff' : 'var(--text-secondary)',
            }}>
              {fw === 'SDLC' ? 'SDLC Assessment' : 'AMS Assessment'}
            </button>
          ))}
        </div>

        <div className="row g-3">
          {areas.map((area, idx) => (
            <div className="col-lg col-md-4 col-sm-6 col-12" key={idx}>
              <div style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: '12px', overflow: 'hidden', height: '100%',
                display: 'flex', flexDirection: 'column', borderTop: `2px solid ${area.color}`,
                transition: 'transform 0.2s ease',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ padding: '20px', flexGrow: 1 }}>
                  <div style={{ width: '38px', height: '38px', background: `${area.color}18`, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <span className="material-icons" style={{ color: area.color, fontSize: '1.2rem' }}>{area.icon}</span>
                  </div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{area.name}</h3>
                  <p style={{ fontSize: '0.81rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{area.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Maturity Scale ────────────────────────────────────────────────── */}
      <section id="maturity" style={{ marginBottom: '48px' }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="divider flex-grow-1" />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>AI Maturity Scale — Applies to Both Frameworks</span>
          <div className="divider flex-grow-1" />
        </div>
        <div className="row g-3">
          {LEVELS.map((lvl, idx) => (
            <div className="col-lg-4 col-md-6 col-12" key={idx}>
              <div style={{ borderLeft: `3px solid ${lvl.color}`, padding: '16px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '0 10px 10px 0' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: lvl.color, background: `${lvl.color}18`, border: `1px solid ${lvl.color}30`, borderRadius: '4px', padding: '2px 8px' }}>{lvl.label}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{lvl.title}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{lvl.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Platform Capabilities ─────────────────────────────────────────── */}
      <section id="about" style={{ marginBottom: '40px' }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="divider flex-grow-1" />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Platform Capabilities</span>
          <div className="divider flex-grow-1" />
        </div>

        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '40px' }}>
          <div className="row g-4">
            {[
              {
                icon: 'bar_chart',
                color: 'rgb(26, 127, 55)',
                title: 'Dual-Framework Evaluation',
                desc: 'Assess AI maturity across both SDLC and AMS disciplines on one unified platform — covering engineering delivery and operational excellence.',
                bullets: [
                  { icon: 'check_circle', text: `${sdlcCount} SDLC questions across 5 domains` },
                  { icon: 'check_circle', text: `${amsCount} AMS questions across 5 domains` },
                  { icon: 'check_circle', text: 'Suitable for engineering & operations teams' },
                ],
              },
              {
                icon: 'trending_up',
                color: '#6366f1',
                title: 'L0 → L5 Maturity Mapping',
                desc: 'Benchmark your team against 6 progressive maturity levels, visualised per domain with radar charts and detailed score breakdowns.',
                bullets: [
                  { icon: 'check_circle', text: 'Per-domain maturity score (0–5 scale)' },
                  { icon: 'check_circle', text: 'Interactive radar chart visualisation' },
                  { icon: 'check_circle', text: 'Comparative maturity benchmarking' },
                ],
              },
              {
                icon: 'track_changes',
                color: '#f59e0b',
                title: 'Actionable Assessment Reports',
                desc: 'Generate a professional AI-powered audit report instantly after completing an assessment, complete with domain scores, maturity levels, and targeted recommendations.',
                bullets: [
                  { icon: 'check_circle', text: 'Instant PDF-ready printable report' },
                  { icon: 'check_circle', text: 'Domain-level score breakdown' },
                  { icon: 'check_circle', text: 'Priority actions & improvement roadmap' },
                ],
              },
            ].map((f, i) => (
              <div className="col-md-4" key={i}>
                <div style={{
                  display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: '14px', padding: '28px 24px',
                  borderTop: `3px solid ${f.color}`,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 40px ${f.color}18`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Icon */}
                  <div style={{ width: '48px', height: '48px', background: `${f.color}14`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', flexShrink: 0 }}>
                    <span className="material-icons" style={{ fontSize: '1.7rem', color: f.color }}>{f.icon}</span>
                  </div>
                  {/* Title */}
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{f.title}</h4>
                  {/* Description */}
                  <p style={{ fontSize: '0.855rem', color: 'var(--text-secondary)', lineHeight: 1.72, margin: '0 0 20px', flexGrow: 1 }}>{f.desc}</p>
                  {/* Divider */}
                  <div style={{ height: '1px', background: 'var(--border)', marginBottom: '16px' }} />
                  {/* Bullets */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {f.bullets.map((b, bi) => (
                      <li key={bi} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <span className="material-icons" style={{ fontSize: '0.95rem', color: f.color, flexShrink: 0, marginTop: '1px' }}>{b.icon}</span>
                        {b.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
