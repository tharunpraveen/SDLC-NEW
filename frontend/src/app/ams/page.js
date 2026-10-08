'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../AuthContext';

const AMS_AREAS = [
  { name: 'Service Management',  color: '#0ea5e9', desc: 'AI-driven SLA monitoring and alerting before breaches occur, automated self-service request fulfilment, and proactive service catalogue governance.' },
  { name: 'Incident Management', color: '#f43f5e', desc: 'Automated incident triage and classification, runbook execution and self-healing remediation, escalation intelligence, and real-time impact scoring.' },
  { name: 'Change Management',   color: '#f97316', desc: 'AI change risk scoring and conflict detection, automated blast radius prediction, downstream impact analysis, and approval workflow automation.' },
  { name: 'Problem Management',  color: '#a855f7', desc: 'AI-assisted root cause analysis, predictive anomaly detection, structured problem resolution, and proactive problem identification from telemetry.' },
  { name: 'Release Management',  color: '#10b981', desc: 'AI-powered release gate assessment, end-to-end pipeline orchestration, go/no-go recommendation engine, and automated release readiness scoring.' },
];

const LEVELS = [
  { label: 'L0', title: 'Traditional',          color: '#484f58', desc: 'Entirely manual operations. No AI tools embedded in service or incident workflows.' },
  { label: 'L1', title: 'Assisted / Tool',       color: '#1f6feb', desc: 'Basic AI chatbots, knowledge base search, and ad-hoc ticket classification.' },
  { label: 'L2', title: 'Delegated / Assistant', color: '#8957e5', desc: 'AI assists with triage, drafts RCA reports, and classifies incidents under human review.' },
  { label: 'L3', title: 'Supervised Agent',      color: '#d29922', desc: 'AI agents execute runbooks and orchestrate multi-step remediation with human approval gates.' },
  { label: 'L4', title: 'Autonomous Workforce',  color: '#2ea043', desc: 'Agents handle known incidents end-to-end with automated rollback and safety guardrails.' },
  { label: 'L5', title: 'Agentic Enterprise',    color: '#3fb950', desc: 'Self-healing operations, predictive problem prevention, and fully autonomous release pipelines.' },
];

// AMS domain SVG illustrations matching the SDLC style
function getAMSDomainDiagram(name) {
  switch (name) {
    case 'Service Management':
      return (
        <svg width="100%" height="100%" viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#FFFFFF" />
          <rect x="25" y="20" width="190" height="100" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
          {/* SLA gauge */}
          <circle cx="80" cy="75" r="28" stroke="#E2E8F0" strokeWidth="4" />
          <circle cx="80" cy="75" r="28" stroke="#0EA5E9" strokeWidth="4" strokeDasharray="120 55" strokeDashoffset="40" />
          <text x="80" y="72" fontFamily="Inter, sans-serif" fontSize="8" fontWeight="700" fill="#0EA5E9" textAnchor="middle">SLA</text>
          <text x="80" y="82" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="600" fill="#64748B" textAnchor="middle">98.5%</text>
          {/* Tickets */}
          <rect x="125" y="32" width="72" height="18" rx="4" fill="#0EA5E9" fillOpacity="0.1" stroke="#0EA5E9" strokeWidth="1.2" />
          <circle cx="134" cy="41" r="4" fill="#0EA5E9" />
          <rect x="143" y="38" width="45" height="4" rx="2" fill="#CBD5E1" />
          <rect x="125" y="56" width="72" height="18" rx="4" fill="#E2E8F0" />
          <circle cx="134" cy="65" r="4" fill="#10B981" />
          <rect x="143" y="62" width="38" height="4" rx="2" fill="#CBD5E1" />
          <rect x="125" y="80" width="72" height="18" rx="4" fill="#E2E8F0" />
          <circle cx="134" cy="89" r="4" fill="#F59E0B" />
          <rect x="143" y="86" width="52" height="4" rx="2" fill="#CBD5E1" />
          <rect x="125" y="104" width="72" height="12" rx="3" fill="#E2E8F0" />
          <rect x="143" y="108" width="30" height="4" rx="2" fill="#CBD5E1" />
        </svg>
      );
    case 'Incident Management':
      return (
        <svg width="100%" height="100%" viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#FFFFFF" />
          <rect x="25" y="20" width="190" height="100" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
          {/* Alert triangle */}
          <path d="M55 100L85 40L115 100H55Z" fill="#F43F5E" fillOpacity="0.12" stroke="#F43F5E" strokeWidth="1.8" strokeLinejoin="round" />
          <text x="85" y="83" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="900" fill="#F43F5E" textAnchor="middle">!</text>
          <text x="85" y="97" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="700" fill="#F43F5E" textAnchor="middle">P1</text>
          {/* Triage pipeline */}
          <rect x="130" y="38" width="68" height="16" rx="4" fill="#F43F5E" fillOpacity="0.1" stroke="#F43F5E" strokeWidth="1.2" />
          <text x="164" y="49" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="700" fill="#F43F5E" textAnchor="middle">TRIAGE</text>
          <path d="M164 54V62" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="130" y="62" width="68" height="16" rx="4" fill="#E2E8F0" />
          <text x="164" y="73" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="600" fill="#64748B" textAnchor="middle">CLASSIFY</text>
          <path d="M164 78V86" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="130" y="86" width="68" height="16" rx="4" fill="#E2E8F0" />
          <text x="164" y="97" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="600" fill="#64748B" textAnchor="middle">ROUTE</text>
          <path d="M164 102V110" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="130" y="110" width="68" height="12" rx="3" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="1.2" />
          <text x="164" y="119" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="700" fill="#10B981" textAnchor="middle">RESOLVED</text>
        </svg>
      );
    case 'Change Management':
      return (
        <svg width="100%" height="100%" viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#FFFFFF" />
          <rect x="25" y="20" width="190" height="100" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
          {/* Risk meter */}
          <rect x="38" y="55" width="80" height="10" rx="5" fill="#E2E8F0" />
          <rect x="38" y="55" width="52" height="10" rx="5" fill="#F97316" />
          <text x="78" y="42" fontFamily="Inter, sans-serif" fontSize="8" fontWeight="700" fill="#F97316" textAnchor="middle">RISK SCORE</text>
          <text x="78" y="51" fontFamily="Inter, sans-serif" fontSize="8" fontWeight="600" fill="#64748B" textAnchor="middle">Medium</text>
          {/* Change request box */}
          <rect x="38" y="76" width="80" height="36" rx="5" fill="#F97316" fillOpacity="0.08" stroke="#F97316" strokeWidth="1.2" />
          <text x="78" y="91" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="700" fill="#F97316" textAnchor="middle">CHANGE REQUEST</text>
          <rect x="48" y="95" width="60" height="4" rx="2" fill="#CBD5E1" />
          <rect x="48" y="102" width="40" height="4" rx="2" fill="#CBD5E1" />
          {/* Approval flow */}
          <path d="M148 70L165 55L182 70" stroke="#F97316" strokeWidth="1.5" strokeDasharray="3 3" />
          <rect x="140" y="70" width="45" height="20" rx="4" fill="#E2E8F0" />
          <text x="162" y="83" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="600" fill="#64748B" textAnchor="middle">CAB Review</text>
          <path d="M162 90V100" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="140" y="100" width="45" height="18" rx="4" fill="#10B981" fillOpacity="0.12" stroke="#10B981" strokeWidth="1.2" />
          <text x="162" y="112" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="700" fill="#10B981" textAnchor="middle">APPROVED</text>
        </svg>
      );
    case 'Problem Management':
      return (
        <svg width="100%" height="100%" viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#FFFFFF" />
          <rect x="25" y="20" width="190" height="100" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
          {/* Root cause tree */}
          <circle cx="120" cy="35" r="10" fill="#A855F7" fillOpacity="0.15" stroke="#A855F7" strokeWidth="1.5" />
          <text x="120" y="39" fontFamily="Inter, sans-serif" fontSize="8" fontWeight="700" fill="#A855F7" textAnchor="middle">RCA</text>
          <path d="M120 45V57" stroke="#A855F7" strokeWidth="1.5" />
          <path d="M90 57H150" stroke="#A855F7" strokeWidth="1.5" />
          <path d="M90 57V65" stroke="#A855F7" strokeWidth="1.5" />
          <path d="M120 57V65" stroke="#A855F7" strokeWidth="1.5" />
          <path d="M150 57V65" stroke="#A855F7" strokeWidth="1.5" />
          <rect x="68" y="65" width="44" height="18" rx="4" fill="#A855F7" fillOpacity="0.1" stroke="#A855F7" strokeWidth="1.2" />
          <text x="90" y="77" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="600" fill="#A855F7" textAnchor="middle">DB Conn</text>
          <rect x="98" y="65" width="44" height="18" rx="4" fill="#E2E8F0" />
          <text x="120" y="77" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="600" fill="#64748B" textAnchor="middle">Network</text>
          <rect x="128" y="65" width="44" height="18" rx="4" fill="#E2E8F0" />
          <text x="150" y="77" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="600" fill="#64748B" textAnchor="middle">Memory</text>
          {/* Solution */}
          <rect x="68" y="100" width="104" height="20" rx="5" fill="#10B981" fillOpacity="0.12" stroke="#10B981" strokeWidth="1.2" />
          <text x="120" y="113" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="700" fill="#10B981" textAnchor="middle">Root Cause Identified ✓</text>
        </svg>
      );
    case 'Release Management':
      return (
        <svg width="100%" height="100%" viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#FFFFFF" />
          <rect x="25" y="20" width="190" height="100" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
          {/* Pipeline stages */}
          <rect x="35" y="52" width="36" height="26" rx="4" fill="#10B981" fillOpacity="0.12" stroke="#10B981" strokeWidth="1.2" />
          <text x="53" y="65" fontFamily="Inter, sans-serif" fontSize="6.5" fontWeight="700" fill="#10B981" textAnchor="middle">BUILD</text>
          <circle cx="53" cy="72" r="4" fill="#10B981" />
          <path d="M71 65H82" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M80 62L83 65L80 68" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="83" y="52" width="36" height="26" rx="4" fill="#10B981" fillOpacity="0.12" stroke="#10B981" strokeWidth="1.2" />
          <text x="101" y="65" fontFamily="Inter, sans-serif" fontSize="6.5" fontWeight="700" fill="#10B981" textAnchor="middle">TEST</text>
          <circle cx="101" cy="72" r="4" fill="#10B981" />
          <path d="M119 65H130" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M128 62L131 65L128 68" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="131" y="52" width="36" height="26" rx="4" fill="#F59E0B" fillOpacity="0.12" stroke="#F59E0B" strokeWidth="1.2" />
          <text x="149" y="63" fontFamily="Inter, sans-serif" fontSize="5.5" fontWeight="700" fill="#F59E0B" textAnchor="middle">GATE</text>
          <text x="149" y="72" fontFamily="Inter, sans-serif" fontSize="5.5" fontWeight="700" fill="#F59E0B" textAnchor="middle">CHECK</text>
          <path d="M167 65H178" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M176 62L179 65L176 68" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="179" y="52" width="30" height="26" rx="4" fill="#10B981" fillOpacity="0.12" stroke="#10B981" strokeWidth="1.2" />
          <text x="194" y="65" fontFamily="Inter, sans-serif" fontSize="5.5" fontWeight="700" fill="#10B981" textAnchor="middle">PROD</text>
          <path d="M188 72L192 68L196 72" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
          {/* Release badge */}
          <rect x="60" y="100" width="120" height="18" rx="5" fill="#10B981" fillOpacity="0.1" stroke="#10B981" strokeWidth="1.2" />
          <text x="120" y="112" fontFamily="Inter, sans-serif" fontSize="8" fontWeight="700" fill="#10B981" textAnchor="middle">v2.4.1 — RELEASED ✓</text>
        </svg>
      );
    default:
      return null;
  }
}

export default function AMSPage() {
  const { user } = useAuth();
  const [amsCount, setAmsCount] = useState(null);

  useEffect(() => {
    fetch('/api/questions?framework=AMS', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.questions?.length) setAmsCount(d.questions.length); })
      .catch(() => {});
  }, []);

  const questionLabel = amsCount != null ? `${amsCount}-question` : 'multi-domain';

  return (
    <div className="landing-container">

      {/* ── Hero ── */}
      <section style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '20px', padding: '64px 40px',
        position: 'relative', overflow: 'hidden', marginBottom: '40px',
        borderTop: '3px solid #6366f1',
      }}>
        <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '280px', background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="text-center">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '100px', padding: '6px 16px', marginBottom: '20px', fontSize: '0.78rem', fontWeight: 700, color: '#6366f1', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <span className="material-icons" style={{ fontSize: '0.95rem' }}>support_agent</span>
            Framework 2 — AMS Assessment
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: '16px', color: 'var(--text-primary)' }}>
            Application Management Services<br />
            <span style={{ color: '#6366f1' }}>AI Maturity Assessment</span>
          </h1>
          <p style={{ maxWidth: '680px', margin: '0 auto 28px', color: 'var(--text-secondary)', fontSize: '17px', lineHeight: 1.75 }}>
            A focused <strong style={{ color: 'var(--text-primary)' }}>{questionLabel}</strong> audit across 5 operations domains — measuring how deeply AI is embedded in your organisation's service management, incident response, change control, problem resolution, and release orchestration.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            {user ? (
              <Link href="/assessment?framework=AMS" className="btn-primary-action" style={{ background: '#6366f1', borderColor: '#6366f1' }}>
                Start AMS Assessment →
              </Link>
            ) : (
              <>
                <Link href="/signup" className="btn-primary-action" style={{ background: '#6366f1', borderColor: '#6366f1' }}>Get Started Free →</Link>
                <Link href="/login" className="btn-secondary-action">Sign In</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ marginBottom: '40px', padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="d-flex justify-content-center gap-5 flex-wrap">
          {[
            { value: amsCount != null ? String(amsCount) : '—', label: 'Questions' },
            { value: '5',     label: 'Operations Domains' },
            { value: 'L0–L5', label: 'Maturity Scale' },
            { value: 'AI',    label: 'Powered Analysis' },
          ].map((s, i) => (
            <div className="text-center" key={i} style={{ minWidth: '120px' }}>
              <strong style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6366f1', display: 'block', letterSpacing: '-0.03em' }}>{s.value}</strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Domains ── */}
      <section id="domains" style={{ marginBottom: '40px' }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="divider flex-grow-1" />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>5 Operations Domains</span>
          <div className="divider flex-grow-1" />
        </div>
        <div className="row g-3">
          {AMS_AREAS.map((area, idx) => (
            <div className="col-lg col-md-4 col-sm-6 col-12" key={idx}>
              <div className="domain-card h-100" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                onMouseEnter={e => { const c = e.currentTarget.querySelector('.domain-card-img-container'); if (c) c.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { const c = e.currentTarget.querySelector('.domain-card-img-container'); if (c) c.style.transform = 'scale(1.0)'; }}
              >
                <div className="domain-card-img-container" style={{ width: '100%', height: '140px', overflow: 'hidden', borderBottom: `2px solid ${area.color}`, background: '#FFFFFF', transition: 'transform 0.3s ease' }}>
                  {getAMSDomainDiagram(area.name)}
                </div>
                <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{area.name}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, flexGrow: 1 }}>{area.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Maturity Scale ── */}
      <section id="maturity" style={{ marginBottom: '40px' }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="divider flex-grow-1" />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>AI Maturity Scale</span>
          <div className="divider flex-grow-1" />
        </div>
        <div className="row g-3">
          {LEVELS.map((lvl, idx) => (
            <div className="col-lg-4 col-md-6 col-12" key={idx}>
              <div style={{ borderLeft: `3px solid ${lvl.color}`, padding: '16px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
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

      {/* ── CTA ── */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.04) 100%)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '10px', color: 'var(--text-primary)' }}>
            Ready to benchmark your operations team?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '24px', maxWidth: '560px', margin: '0 auto 24px' }}>
            Complete the AMS assessment to receive your personalised AI maturity report with domain-level scores and targeted recommendations for your operations team.
          </p>
          {user ? (
            <Link href="/assessment?framework=AMS" className="btn-primary-action" style={{ background: '#6366f1', borderColor: '#6366f1' }}>
              Start Assessment →
            </Link>
          ) : (
            <Link href="/signup" className="btn-primary-action" style={{ background: '#6366f1', borderColor: '#6366f1' }}>
              Get Started Free →
            </Link>
          )}
        </div>
      </section>

    </div>
  );
}
