'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../AuthContext';
import { useRouter } from 'next/navigation';

const FRAMEWORK_CONFIG = {
  SDLC: {
    label: 'SDLC Assessment',
    subtitle: 'Software Delivery Lifecycle',
    color: 'rgb(26, 127, 55)',
    bgGlow: 'rgba(26,127,55,0.08)',
    icon: 'developer_mode',
    tag: 'Framework 1',
    domains: ['Requirements', 'Architecture', 'Development', 'Testing', 'Deployment'],
    desc: "Audit your engineering team's AI maturity across the full software delivery lifecycle.",
    explorerLink: '/sdlc',
  },
  AMS: {
    label: 'AMS Assessment',
    subtitle: 'Application Management Services',
    color: '#6366f1',
    bgGlow: 'rgba(99,102,241,0.08)',
    icon: 'support_agent',
    tag: 'Framework 2',
    domains: ['Service Mgmt', 'Incident Mgmt', 'Change Mgmt', 'Problem Mgmt', 'Release Mgmt'],
    desc: "Evaluate your operations team's AI maturity across application management services.",
    explorerLink: '/ams',
  },
};

export default function Dashboard() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showFrameworkPicker, setShowFrameworkPicker] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterFramework, setFilterFramework] = useState('ALL');
  const itemsPerPage = 10;
  const router = useRouter();

  // Profile state
  const [profileName, setProfileName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    else if (user) {
      if (user.role === 'admin' || user.email === 'admin@sdlc.com') {
        router.push('/admin');
      } else {
        fetchDashboardData();
        setProfileName(user.name || '');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const handleSwitchToProfile  = () => setActiveTab('profile');
    const handleSwitchToDashboard = () => setActiveTab('dashboard');
    window.addEventListener('switch-tab-profile',   handleSwitchToProfile);
    window.addEventListener('switch-tab-dashboard', handleSwitchToDashboard);
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'profile') setActiveTab('profile');
    }
    return () => {
      window.removeEventListener('switch-tab-profile',   handleSwitchToProfile);
      window.removeEventListener('switch-tab-dashboard', handleSwitchToDashboard);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/assessments');
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.assessments || []);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    const rawName = user?.name || user?.email?.split('@')[0] || '';
    return rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : '';
  };

  const getMaturityLevel = (scorePercent) => {
    if (scorePercent == null) return 'N/A';
    const s = (scorePercent / 100) * 5;
    if (s >= 4.5) return 'L5';
    if (s >= 3.5) return 'L4';
    if (s >= 2.5) return 'L3';
    if (s >= 1.5) return 'L2';
    if (s >= 0.5) return 'L1';
    return 'L0';
  };

  const scoreBadgeClass = (score) => {
    if (!score && score !== 0) return 'tuf-badge tuf-badge-gray';
    if (score >= 70) return 'tuf-badge tuf-badge-green';
    if (score >= 40) return 'tuf-badge tuf-badge-yellow';
    return 'tuf-badge tuf-badge-red';
  };

  // Framework picker → fullscreen → assessment
  const openFrameworkPicker = () => setShowFrameworkPicker(true);

  const handleFrameworkSelect = (fw) => {
    setSelectedFramework(fw);
    setShowFrameworkPicker(false);
    setShowFullscreenModal(true);
  };

  const handleLaunchAssessment = (useFullscreen) => {
    setShowFullscreenModal(false);
    if (useFullscreen) {
      try {
        const el = document.documentElement;
        (el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen)?.call(el);
      } catch (e) {}
    }
    router.push(`/assessment?framework=${selectedFramework}`);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true); setProfileSuccess(false); setProfileError(null);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save profile');
      setProfileSuccess(true);
      await refreshUser();
    } catch (err) {
      setProfileError(err.message || 'Error updating profile');
    } finally {
      setProfileSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border mb-3" role="status"><span className="visually-hidden">Loading...</span></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // Filtered assessments
  const filteredAssessments = filterFramework === 'ALL'
    ? assessments
    : assessments.filter(a => (a.framework || 'SDLC') === filterFramework);

  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);
  const paginatedAssessments = filteredAssessments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const sdlcCount = assessments.filter(a => (a.framework || 'SDLC') === 'SDLC').length;
  const amsCount  = assessments.filter(a => a.framework === 'AMS').length;
  const avgScore  = assessments.length > 0
    ? Math.round(assessments.reduce((s, a) => s + (a.overallScore || 0), 0) / assessments.length)
    : 0;

  return (
    <>
      {/* ── Framework Picker Modal ── */}
      {showFrameworkPicker && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.80)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: '20px', padding: '40px', maxWidth: '700px', width: '100%',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Choose Your Assessment Framework
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                Select which AI maturity framework you want to assess today.
              </p>
            </div>

            <div className="row g-3">
              {Object.entries(FRAMEWORK_CONFIG).map(([key, fw]) => (
                <div className="col-md-6" key={key}>
                  <button
                    onClick={() => handleFrameworkSelect(key)}
                    style={{
                      width: '100%', background: 'var(--bg-elevated)',
                      border: `1px solid ${fw.color}40`,
                      borderTop: `3px solid ${fw.color}`,
                      borderRadius: '14px', padding: '24px', cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.2s ease',
                      position: 'relative', overflow: 'hidden',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${fw.bgGlow}`; e.currentTarget.style.borderColor = fw.color; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = `${fw.color}40`; }}
                  >
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: `radial-gradient(circle at top right, ${fw.bgGlow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '42px', height: '42px', background: `${fw.color}18`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="material-icons" style={{ color: fw.color, fontSize: '1.4rem' }}>{fw.icon}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: fw.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{fw.tag}</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{fw.label}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 14px' }}>{fw.desc}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
                      {fw.domains.map(d => (
                        <span key={d} style={{ fontSize: '0.68rem', fontWeight: 600, color: fw.color, background: `${fw.color}15`, border: `1px solid ${fw.color}25`, borderRadius: '100px', padding: '2px 8px' }}>{d}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{fw.duration}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: fw.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Select <span className="material-icons" style={{ fontSize: '1rem' }}>arrow_forward</span>
                      </span>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button onClick={() => setShowFrameworkPicker(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fullscreen Modal ── */}
      {showFullscreenModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: '16px', padding: '36px 40px', maxWidth: '440px', width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          }}>
            <div style={{ marginBottom: '16px', textAlign: 'center' }}>
              <span className="material-icons" style={{ fontSize: '3.5rem', color: selectedFramework ? FRAMEWORK_CONFIG[selectedFramework]?.color : 'var(--green-bright)' }}>fullscreen</span>
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textAlign: 'center' }}>Start in Fullscreen?</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px', textAlign: 'center' }}>
              For the best assessment experience — distraction-free and focused — we recommend starting in fullscreen mode.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => handleLaunchAssessment(true)} className="btn-premium w-100 justify-content-center" style={{ padding: '12px', fontSize: '0.95rem' }}>
                Start Fullscreen
              </button>
              <button onClick={() => handleLaunchAssessment(false)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
                Start in Window
              </button>
              <button onClick={() => { setShowFullscreenModal(false); setSelectedFramework(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer', padding: '4px', marginTop: '4px' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fade-in" style={{ paddingTop: '8px' }}>

        {/* ── Header ── */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-5">
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: 'var(--green-bright)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span>{assessments.length > 0 ? 'Welcome back, ' : 'Welcome, '}{getDisplayName()}</span>
              <span className="material-icons" style={{ fontSize: '1.6rem', verticalAlign: 'middle' }}>waving_hand</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
              {assessments.length > 0
                ? 'Track your AI maturity progress across SDLC and AMS frameworks.'
                : 'Get started by taking your first AI Maturity Assessment — choose SDLC or AMS.'}
            </p>
          </div>
          <button onClick={openFrameworkPicker} className="btn-premium" style={{ padding: '10px 22px', whiteSpace: 'nowrap' }}>
            ＋ New Assessment
          </button>
        </div>

        {activeTab === 'dashboard' ? (
          <>
            {/* ── Framework Selector Cards ── */}
            <div className="row g-3 mb-4">
              {Object.entries(FRAMEWORK_CONFIG).map(([key, fw]) => {
                const fwCount = key === 'SDLC' ? sdlcCount : amsCount;
                const fwAssessments = assessments.filter(a => (a.framework || 'SDLC') === key);
                const fwAvg = fwAssessments.length > 0
                  ? Math.round(fwAssessments.reduce((s, a) => s + (a.overallScore || 0), 0) / fwAssessments.length)
                  : null;
                return (
                  <div className="col-md-6" key={key}>
                    <div style={{
                      background: 'var(--bg-elevated)', border: `1px solid ${fw.color}30`,
                      borderTop: `3px solid ${fw.color}`, borderRadius: '14px', padding: '24px',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: 0, right: 0, width: '140px', height: '140px', background: `radial-gradient(circle at top right, ${fw.bgGlow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div style={{ width: '44px', height: '44px', background: `${fw.color}18`, borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span className="material-icons" style={{ color: fw.color, fontSize: '1.5rem' }}>{fw.icon}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: fw.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{fw.tag}</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{fw.label}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: fw.color, lineHeight: 1 }}>{fwCount}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Audits Done</div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {fwAvg != null ? <>Avg Maturity: <strong style={{ color: fw.color }}>{getMaturityLevel(fwAvg)}</strong></> : <span style={{ fontStyle: 'italic' }}>No audits yet</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Link href={fw.explorerLink}
                            style={{ fontSize: '0.78rem', fontWeight: 600, color: fw.color, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            Details <span className="material-icons" style={{ fontSize: '0.85rem' }}>open_in_new</span>
                          </Link>
                          <button onClick={() => { setSelectedFramework(key); setShowFullscreenModal(true); }}
                            style={{ fontSize: '0.82rem', fontWeight: 700, color: fw.color, background: `${fw.color}15`, border: `1px solid ${fw.color}30`, borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
                            Start <span className="material-icons" style={{ fontSize: '0.95rem' }}>play_arrow</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Assessment History ── */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Assessment Reports</h2>
                <div className="d-flex align-items-center gap-2">
                  {/* Framework filter */}
                  <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3px' }}>
                    {['ALL', 'SDLC', 'AMS'].map(f => (
                      <button key={f} onClick={() => { setFilterFramework(f); setCurrentPage(1); }} style={{
                        padding: '4px 12px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                        fontSize: '0.75rem', fontWeight: 700,
                        background: filterFramework === f ? (f === 'AMS' ? '#6366f1' : f === 'SDLC' ? 'rgb(26, 127, 55)' : 'var(--bg-elevated)') : 'transparent',
                        color: filterFramework === f ? (f === 'ALL' ? 'var(--text-primary)' : '#fff') : 'var(--text-muted)',
                        transition: 'all 0.15s',
                      }}>{f}</button>
                    ))}
                  </div>
                  {assessments.length > 0 && (
                    <button onClick={openFrameworkPicker} className="btn-premium-outline" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>+ New</button>
                  )}
                </div>
              </div>

              {filteredAssessments.length === 0 ? (
                <div className="text-center" style={{ padding: '48px 24px' }}>
                  <div style={{ marginBottom: '12px', opacity: 0.5 }}>
                    <span className="material-icons text-muted" style={{ fontSize: '3rem' }}>assignment_turned_in</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    {assessments.length === 0 ? 'No assessments yet. Start your first audit now.' : `No ${filterFramework} assessments found.`}
                  </p>
                  <button onClick={openFrameworkPicker} className="btn-premium">Run First Audit →</button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table" style={{ marginBottom: 0 }}>
                    <thead>
                      <tr>
                        <th>Audit Date</th>
                        <th className="text-center">Framework</th>
                        <th className="text-center">Project</th>
                        <th className="text-center">Maturity Level</th>
                        <th className="text-end">Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAssessments.map((a) => {
                        const fw = FRAMEWORK_CONFIG[a.framework || 'SDLC'] || FRAMEWORK_CONFIG.SDLC;
                        return (
                          <tr key={a.id}>
                            <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                              {new Date(a.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="text-center">
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: fw.color, background: `${fw.color}18`, border: `1px solid ${fw.color}30`, borderRadius: '100px', padding: '3px 10px', whiteSpace: 'nowrap' }}>
                                {a.framework || 'SDLC'}
                              </span>
                            </td>
                            <td className="text-center" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {a.projectName || '—'}
                            </td>
                            <td className="text-center">
                              <span className={scoreBadgeClass(a.overallScore)}>
                                {a.overallScore != null ? getMaturityLevel(a.overallScore) : 'N/A'}
                              </span>
                            </td>
                            <td className="text-end">
                              <Link href={`/report/${a.id}`} className="btn-premium-outline" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>View →</Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                      <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                        className="btn-premium-outline" style={{ padding: '6px 14px', fontSize: '0.8rem', opacity: currentPage === 1 ? 0.5 : 1 }}>
                        ← Previous
                      </button>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
                      <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                        className="btn-premium-outline" style={{ padding: '6px 14px', fontSize: '0.8rem', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          /* ── Profile ── */
          <div className="row justify-content-center">
            <div className="col-lg-6 col-md-8 col-12">
              <div className="glass-panel" style={{ padding: '32px' }}>
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h3 className="h5 m-0" style={{ color: 'var(--text-primary)' }}>User Profile Settings</h3>
                  <button onClick={() => { setActiveTab('dashboard'); window.history.pushState(null, '', '/dashboard'); }}
                    className="btn-premium-outline" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>← Back</button>
                </div>
                {profileSuccess && <div className="alert alert-success d-flex align-items-center gap-2 mb-4" role="alert" style={{ fontSize: '0.88rem' }}><span className="material-icons" style={{ fontSize: '1.2rem' }}>check_circle</span> Profile updated successfully!</div>}
                {profileError   && <div className="alert alert-danger  d-flex align-items-center gap-2 mb-4" role="alert" style={{ fontSize: '0.88rem' }}><span className="material-icons" style={{ fontSize: '1.2rem' }}>warning</span> {profileError}</div>}
                <form onSubmit={handleProfileSave}>
                  <div className="mb-3">
                    <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Email Address</label>
                    <input type="email" className="form-control" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Full Name</label>
                    <input type="text" className="form-control" value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Enter your full name" required />
                  </div>

                  <button type="submit" className="btn-premium w-100 justify-content-center" disabled={profileSaving}>
                    {profileSaving ? 'Saving Changes...' : 'Save Profile'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
