'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

const FRAMEWORK_META = {
  SDLC: {
    label: 'SDLC Assessment',
    subtitle: 'Software Delivery Lifecycle',
    tagline: '5 domains · L0–L5 maturity scale',
    areas: ['Requirements', 'Architecture', 'Development', 'Testing', 'Deployment'],
    color: 'rgb(26, 127, 55)',
    icon: 'code',
    desc: `Measure your team's AI maturity across the full software delivery lifecycle — from requirements and architecture through code, testing, and deployment.`
  },
  AMS: {
    label: 'AMS Assessment',
    subtitle: 'Application Management Services',
    tagline: '5 domains · L0–L5 maturity scale',
    areas: ['Service Management', 'Incident Management', 'Change Management', 'Problem Management', 'Release Management'],
    color: '#6366f1',
    icon: 'support_agent',
    desc: `Measure your organisation's AI maturity across application management — from service catalogues and incident triage to change risk, problem resolution, and release orchestration.`
  },
};

function AssessmentInner() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [framework, setFramework] = useState(null);          // null = not yet chosen
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentArea, setCurrentArea] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customToolInput, setCustomToolInput] = useState('');
  const [showPartialConfirm, setShowPartialConfirm] = useState(false);
  const [expandedAreas, setExpandedAreas] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(true);
  const autoPickedRef = useRef(false);

  // Derived from chosen framework
  const fwMeta = framework ? FRAMEWORK_META[framework] : null;
  const areas = fwMeta ? fwMeta.areas : [];
  const projectName = fwMeta ? `${fwMeta.label} Assessment` : 'Assessment';
  const AREA_ICONS_AMS = { 'Service Management': 'settings', 'Incident Management': 'warning', 'Change Management': 'published_with_changes', 'Problem Management': 'bug_report', 'Release Management': 'rocket_launch' };

  const router = useRouter();
  const AREA_ICONS_SDLC = { Requirements: 'assignment', Architecture: 'architecture', Development: 'code', Testing: 'science', Deployment: 'rocket_launch' };
  const AREA_ICONS = framework === 'AMS' ? AREA_ICONS_AMS : AREA_ICONS_SDLC;

  const levelOptions = [
    { level: 0, label: 'L0', title: 'Traditional',         desc: 'No AI — entirely manual workflows.' },
    { level: 1, label: 'L1', title: 'Assisted/Tool',        desc: 'Ad-hoc autocomplete & chat prompts.' },
    { level: 2, label: 'L2', title: 'Delegated',            desc: 'Copilot integrations, micro-task delegation.' },
    { level: 3, label: 'L3', title: 'Supervised Agent',     desc: 'Multi-agent workflows with human approval.' },
    { level: 4, label: 'L4', title: 'Autonomous Workforce', desc: 'Long-running agents with rollback protection.' },
    { level: 5, label: 'L5', title: 'Agentic Enterprise',   desc: 'Self-healing, self-optimizing pipelines.' },
  ];

  const defaultToolsPerLevel = {
    0: [],
    // L1 · Assisted — ad-hoc autocomplete & chat prompts
    1: [
      'GitHub Copilot',
      'ChatGPT',
      'Claude',
      'Gemini',
      'Tabnine',
      'Amazon CodeWhisperer',
      'Codeium',
      'JetBrains AI Assistant',
    ],
    // L2 · Delegated — copilot integrations, micro-task delegation
    2: [
      'Cursor',
      'Windsurf (Codeium)',
      'Cline',
      'Continue.dev',
      'Aider',
      'Roo Code',
      'Bolt.new',
      'v0 by Vercel',
    ],
    // L3 · Supervised Agent — multi-agent workflows with human approval
    3: [
      'Devin (Cognition AI)',
      'SWE-agent',
      'OpenHands',
      'MetaGPT',
      'AutoGPT',
      'GitHub Copilot Coding Agent',
      'Replit AI Agent',
      'Factory Droids',
    ],
    // L4 · Autonomous Workforce — long-running agents with rollback protection
    4: [
      'LangGraph',
      'CrewAI',
      'Microsoft AutoGen',
      'Semantic Kernel',
      'LlamaIndex Agents',
      'AWS Bedrock Agents',
      'Google Vertex AI Agents',
    ],
    // L5 · Agentic Enterprise — self-healing, self-optimizing pipelines
    5: [
      'AWS Bedrock Inline Agents',
      'Azure AI Agent Service',
      'Google Vertex AI Agent Builder',
      'Palantir AIP',
      'Salesforce Einstein Agents',
      'ServiceNow AI Agents',
    ],
  };

  // ─── Fullscreen detection ─────────────────────────────────────────────────
  useEffect(() => {
    const getFS = () => {
      if (typeof document === 'undefined') return false;
      return !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
    };

    const onFSChange = () => {
      const isFS = getFS();
      setIsFullscreen(isFS);
      if (isFS) {
        setHasStarted(true);
      }
    };

    // Check if fullscreen is supported
    const supported = !!(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled
    );
    setFullscreenSupported(supported);

    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    events.forEach(evt => document.addEventListener(evt, onFSChange));
    window.addEventListener('resize', onFSChange);

    const initialFS = getFS();
    setIsFullscreen(initialFS);
    if (initialFS) {
      setHasStarted(true);
    }

    return () => {
      events.forEach(evt => document.removeEventListener(evt, onFSChange));
      window.removeEventListener('resize', onFSChange);
    };
  }, []);

  const enterFullscreen = async () => {
    const el = document.documentElement;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        await el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }
      setHasStarted(true);
    } catch (e) {
      console.warn('Fullscreen denied or failed', e);
    }
  };

  const exitFullscreen = () => {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen().catch(() => {});
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen().catch(() => {});
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen().catch(() => {});
      }
    } catch (e) {
      console.warn('Exit fullscreen failed', e);
    }
  };



  // ─── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/login');
      else if (user.role === 'admin' || user.email === 'admin@sdlc.com') router.push('/admin');
      // Don't load questions yet — wait for framework pick
    }
  }, [user, authLoading, router]);

  // ─── Auto-pick framework from URL param (?framework=SDLC or AMS) ──────────
  useEffect(() => {
    if (authLoading || !user || autoPickedRef.current) return;
    const fw = searchParams?.get('framework');
    if (fw && FRAMEWORK_META[fw]) {
      autoPickedRef.current = true;
      handleFrameworkPick(fw);
    }
  }, [authLoading, user, searchParams]);

  const loadQuestions = async (fw) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/questions?framework=${fw}`);
      if (res.ok) {
        const d = await res.json();
        setQuestions(d.questions || []);
      }
    } catch (err) { console.error('Error loading questions:', err); }
    finally { setLoading(false); }
  };

  // Called when user picks a framework on the picker screen
  const handleFrameworkPick = async (fw) => {
    setFramework(fw);
    const meta = FRAMEWORK_META[fw];
    setCurrentArea(meta.areas[0]);
    setExpandedAreas({ [meta.areas[0]]: true });
    await loadQuestions(fw);
  };

  // ─── Derived state ────────────────────────────────────────────────────────
  const areaQuestions = questions.filter(q => q.area === currentArea);
  const safeQuestionIndex = currentQuestionIndex >= areaQuestions.length ? 0 : currentQuestionIndex;
  const currentQuestion = areaQuestions[safeQuestionIndex];
  const currentAnswer = currentQuestion
    ? (answers[currentQuestion.id] || { level: null, toolsUsed: [] })
    : { level: null, toolsUsed: [] };

  const totalQuestionsCount = questions.length;
  const answeredQuestionsCount = Object.keys(answers).filter(id => answers[id].level !== null).length;
  const overallProgressPercent = totalQuestionsCount > 0
    ? Math.round((answeredQuestionsCount / totalQuestionsCount) * 100) : 0;

  const getAreaProgress = (areaName) => {
    const ids = questions.filter(q => q.area === areaName).map(q => q.id);
    const answered = Object.keys(answers).filter(id => ids.includes(parseInt(id)) && answers[id].level !== null).length;
    return { total: ids.length, answered, percent: ids.length > 0 ? Math.round((answered / ids.length) * 100) : 0 };
  };

  const isFirstQuestion = safeQuestionIndex === 0;
  const lastArea = areas[areas.length - 1];
  const isLastQuestion = currentArea === lastArea && safeQuestionIndex === areaQuestions.length - 1;

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleLevelSelect = (level) => {
    if (!currentQuestion) return;
    setAnswers(prev => {
      const currentVal = prev[currentQuestion.id]?.level;
      const newLevel = currentVal === level ? null : level;
      return {
        ...prev,
        [currentQuestion.id]: {
          ...prev[currentQuestion.id],
          level: newLevel,
          toolsUsed: newLevel === null ? [] : (prev[currentQuestion.id]?.toolsUsed || [])
        }
      };
    });
  };

  const handleToolToggle = (tool) => {
    if (!currentQuestion) return;
    const tools = [...currentAnswer.toolsUsed];
    const idx = tools.indexOf(tool);
    if (idx > -1) tools.splice(idx, 1); else tools.push(tool);
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: { ...currentAnswer, toolsUsed: tools } }));
  };

  const handleAddCustomTool = (e) => {
    e.preventDefault();
    if (!currentQuestion) return;
    const tool = customToolInput.trim();
    if (!tool || currentAnswer.toolsUsed.includes(tool)) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: { ...currentAnswer, toolsUsed: [...currentAnswer.toolsUsed, tool] } }));
    setCustomToolInput('');
  };

  const handleNext = () => {
    if (currentQuestion) {
      const desc = answers[currentQuestion.id]?.practiceDescription || '';
      if (desc.trim().split(/\s+/).filter(Boolean).length > 100) { alert('Practice description must be below 100 words.'); return; }
    }
    if (safeQuestionIndex < areaQuestions.length - 1) {
      setCurrentQuestionIndex(safeQuestionIndex + 1);
    } else {
      const nextIdx = areas.indexOf(currentArea) + 1;
      if (nextIdx < areas.length) {
        const nextArea = areas[nextIdx];
        setCurrentArea(nextArea);
        setCurrentQuestionIndex(0);
        setExpandedAreas({ [nextArea]: true });
      }
    }
  };

  const handlePrev = () => {
    if (safeQuestionIndex > 0) {
      setCurrentQuestionIndex(safeQuestionIndex - 1);
    } else {
      const prevIdx = areas.indexOf(currentArea) - 1;
      if (prevIdx >= 0) {
        const prevArea = areas[prevIdx];
        setCurrentArea(prevArea);
        const prevQs = questions.filter(q => q.area === prevArea);
        setCurrentQuestionIndex(prevQs.length - 1);
        setExpandedAreas({ [prevArea]: true });
      }
    }
  };

  const doSubmitAssessment = async () => {
    setShowPartialConfirm(false);
    setSubmitting(true);
    const delayPromise = new Promise(resolve => setTimeout(resolve, 2000));
    try {
      const scores = {};
      areas.forEach(area => {
        const areaQ = questions.filter(q => q.area === area);
        let sum = 0;
        areaQ.forEach(q => { const a = answers[q.id]; if (a?.level !== null && a?.level !== undefined) { const v = parseInt(a.level); if (!isNaN(v)) sum += v; } });
        scores[area] = areaQ.length > 0 ? sum / areaQ.length : 0;
      });
      const sumOfSectionAverages = areas.reduce((sum, area) => sum + (scores[area] || 0), 0);
      const overallAverageLevel = sumOfSectionAverages / 5;
      const overallScore = Math.round((overallAverageLevel / 5) * 100);
      const [res] = await Promise.all([
        fetch('/api/assessments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectName, answers, scores, overallScore, remarks: null, framework })
        }),
        delayPromise
      ]);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save report');
      exitFullscreen();
      router.push(`/report/${data.assessment.id}?generating=1`);
    } catch (err) { console.error('[Assessment] Error:', err); setSubmitting(false); alert(err.message || 'Error saving. Please try again.'); }
  };

  const handleSubmitAssessment = () => {
    const invalid = Object.keys(answers).filter(id => { const d = answers[id]?.practiceDescription || ''; return d.trim().split(/\s+/).filter(Boolean).length > 100; });
    if (invalid.length > 0) { alert('One or more descriptions exceed 100 words.'); return; }
    if (answeredQuestionsCount === 0) { alert('Please answer at least one question before generating a report.'); return; }
    if (answeredQuestionsCount < totalQuestionsCount) { setShowPartialConfirm(true); return; }
    doSubmitAssessment();
  };

  const handleGenerateReportFromExitGate = () => {
    if (answeredQuestionsCount === 0) {
      alert('Please answer at least one question before generating a report.');
      return;
    }
    doSubmitAssessment();
  };

  // ─── Loading spinner ──────────────────────────────────────────────────────
  if (submitting) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#090b11',
        fontFamily: 'var(--font-sans)',
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        color: '#fff'
      }}>
        <svg viewBox="0 0 200 200" style={{ width: '220px', height: '220px', marginBottom: '20px' }}>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          {/* Rotating segments */}
          <g style={{ animation: 'spin 1.2s linear infinite', transformOrigin: '100px 100px' }}>
            {Array.from({ length: 32 }).map((_, i) => {
              const angle = i * (360 / 32) - 90;
              const rad = (angle * Math.PI) / 180;
              const r1 = 72;
              const r2 = 88;
              const x1 = 100 + r1 * Math.cos(rad);
              const y1 = 100 + r1 * Math.sin(rad);
              const x2 = 100 + r2 * Math.cos(rad);
              const y2 = 100 + r2 * Math.sin(rad);
              const opacity = 0.15 + (0.85 * i) / 32;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{ opacity }}
                />
              );
            })}
          </g>
          {/* Stationary center text */}
          <text
            x="100"
            y="105"
            textAnchor="middle"
            style={{
              fill: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              fontFamily: 'var(--font-sans)'
            }}
          >
            LOADING
          </text>
        </svg>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border mb-3" role="status"><span className="visually-hidden">Loading…</span></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading…</p>
        </div>
      </div>
    );
  }

  // ─── FRAMEWORK PICKER (shown before anything else) ────────────────────────
  if (!framework) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '80vh', padding: '40px', fontFamily: 'var(--font-sans)'
      }}>
        <div style={{ maxWidth: '700px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
            AI Maturity Assessment
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            Choose Your Assessment
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '40px', lineHeight: 1.7 }}>
            Select the framework you want to be assessed against. Each generates a full AI maturity report.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
            {Object.entries(FRAMEWORK_META).map(([key, meta]) => (
              <button
                key={key}
                id={`framework-pick-${key.toLowerCase()}`}
                onClick={() => handleFrameworkPick(key)}
                style={{
                  background: 'var(--bg-card)',
                  border: `1.5px solid var(--border-subtle)`,
                  borderRadius: '16px',
                  padding: '28px 24px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = meta.color;
                  e.currentTarget.style.boxShadow = `0 8px 30px ${meta.color}30`;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: `${meta.color}18`,
                    border: `1.5px solid ${meta.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <span className="material-icons" style={{ fontSize: '1.4rem', color: meta.color }}>{meta.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{meta.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{meta.subtitle}</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 14px' }}>
                  {meta.desc}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {meta.areas.map(a => (
                    <span key={a} style={{
                      fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px',
                      borderRadius: '20px', background: `${meta.color}14`,
                      color: meta.color, border: `1px solid ${meta.color}30`
                    }}>{a}</span>
                  ))}
                </div>
                <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
                  {meta.tagline}
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => router.push('/dashboard')}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', padding: '8px' }}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border mb-3" role="status"><span className="visually-hidden">Loading…</span></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading {fwMeta?.label} questionnaire…</p>
        </div>
      </div>
    );
  }

  // ─── FULLSCREEN GATE: Only allow access in fullscreen ────────────────────
  if (fullscreenSupported && !isFullscreen) {
    if (hasStarted) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', padding: '40px', background: 'rgba(9, 11, 17, 0.98)',
          position: 'fixed', inset: 0, zIndex: 9999, color: '#fff',
          fontFamily: 'var(--font-sans)'
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: '20px', padding: '48px 40px', maxWidth: '500px', width: '100%',
            textAlign: 'center', boxShadow: '0 25px 70px rgba(0,0,0,0.45)',
          }}>
            <div style={{ marginBottom: '20px' }}><span className="material-icons" style={{ fontSize: '3.5rem', color: 'var(--warning)' }}>warning</span></div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Exit Fullscreen Detected
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '32px' }}>
              You have exited the fullscreen assessment mode. You can resume the assessment or generate your maturity report with your current answers.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={enterFullscreen}
                className="btn-premium w-100 justify-content-center"
                style={{ padding: '14px', fontSize: '0.95rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span className="material-icons" style={{ fontSize: '1.2rem' }}>fullscreen</span> Return to Fullscreen
              </button>
              <button
                onClick={handleGenerateReportFromExitGate}
                className="btn-premium-outline w-100 justify-content-center"
                style={{ padding: '14px', fontSize: '0.95rem', fontWeight: 600, border: '1px solid var(--border-subtle)', background: 'transparent', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span className="material-icons" style={{ fontSize: '1.2rem' }}>bar_chart</span> Generate Report
              </button>
              <button
                onClick={() => { exitFullscreen(); router.push('/dashboard'); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', padding: '8px', marginTop: '4px' }}
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '70vh', padding: '40px',
      }}>
        <div style={{
          background: 'var(--bg-card)',
          border: `1px solid ${fwMeta.color}30`,
          borderTop: `4px solid ${fwMeta.color}`,
          borderRadius: '20px', padding: '52px 48px', maxWidth: '480px', width: '100%',
          textAlign: 'center', boxShadow: `0 20px 60px ${fwMeta.color}18`,
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '18px',
            background: `${fwMeta.color}14`, border: `1.5px solid ${fwMeta.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <span className="material-icons" style={{ fontSize: '2.2rem', color: fwMeta.color }}>fullscreen</span>
          </div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: fwMeta.color, marginBottom: '8px' }}>
            {fwMeta.label}
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Fullscreen Required
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '32px' }}>
            The {fwMeta?.label} Assessment runs in fullscreen-only mode to provide a focused, distraction-free experience.
          </p>
          <button
            onClick={enterFullscreen}
            style={{
              width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700,
              borderRadius: '12px', border: 'none', cursor: 'pointer', marginBottom: '12px',
              background: `linear-gradient(135deg, ${fwMeta.color}cc, ${fwMeta.color})`,
              color: '#fff', boxShadow: `0 4px 20px ${fwMeta.color}35`,
              transition: 'all 0.2s ease', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px',
            }}
          >
            <span className="material-icons" style={{ fontSize: '1.3rem' }}>fullscreen</span>
            Enter Fullscreen &amp; Start
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', padding: '8px' }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── MAIN ASSESSMENT UI (fullscreen only) ─────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100dvh',
      overflow: 'hidden',
      background: 'var(--bg-primary)',
      fontFamily: 'var(--font-sans)',
      position: 'fixed',
      inset: 0,
      zIndex: 9000,
    }}>

      {/* ══════ LEFT SIDEBAR ══════ */}
      <aside style={{
        width: '248px',
        minWidth: '248px',
        height: '100%',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Sidebar header */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span className="material-icons" style={{ fontSize: '1rem', color: fwMeta.color }}>{fwMeta.icon}</span>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: fwMeta.color }}>
              {fwMeta.label}
            </div>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>{fwMeta.subtitle}</div>
        </div>

        {/* Area accordion */}
        <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: '8px 0' }}>
          {areas.map(area => {
            const prog = getAreaProgress(area);
            const isActive = area === currentArea;
            const isExpanded = expandedAreas[area];
            const isDone = prog.answered === prog.total && prog.total > 0;
            const areaQs = questions.filter(q => q.area === area);

            return (
              <div key={area}>
                {/* Section header row — no triangle */}
                <button
                  onClick={() => {
                    setExpandedAreas({ [area]: true });
                    setCurrentArea(area);
                    setCurrentQuestionIndex(0);
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 16px', border: 'none', cursor: 'pointer', transition: 'background 0.15s',
                    background: isActive ? `${fwMeta.color}0f` : 'transparent',
                    borderLeft: isActive ? `3px solid ${fwMeta.color}` : '3px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span className="material-icons" style={{ fontSize: '1rem', color: isActive ? fwMeta.color : 'var(--text-secondary)' }}>{AREA_ICONS[area]}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: isActive ? 700 : 500, color: isActive ? fwMeta.color : 'var(--text-secondary)' }}>
                      {area}
                    </span>
                  </div>
                  {isDone
                    ? <span style={{ fontSize: '0.6rem', fontWeight: 700, color: fwMeta.color, background: `${fwMeta.color}18`, padding: '2px 7px', borderRadius: '99px' }}>✓</span>
                    : <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{prog.answered}/{prog.total}</span>
                  }
                </button>

                {/* Question chips */}
                {isExpanded && (
                  <div style={{ padding: '6px 16px 10px', background: 'rgba(0,0,0,0.12)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {areaQs.map((q, idx) => {
                        const isAnswered = answers[q.id]?.level !== null && answers[q.id]?.level !== undefined;
                        const isCurrent = isActive && idx === safeQuestionIndex;
                        return (
                          <button
                            key={q.id}
                            type="button"
                            title={q.practice}
                            onClick={() => { setCurrentArea(area); setCurrentQuestionIndex(idx); }}
                            style={{
                              width: '36px', height: '36px', borderRadius: '8px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                              cursor: 'pointer', transition: 'all 0.15s ease',
                              border: isCurrent ? `2px solid ${fwMeta.color}` : isAnswered ? `2px solid ${fwMeta.color}` : '1px solid var(--border-subtle)',
                              background: isCurrent ? `${fwMeta.color}22` : isAnswered ? fwMeta.color : 'var(--bg-elevated)',
                              color: isCurrent ? fwMeta.color : isAnswered ? '#fff' : 'var(--text-muted)',
                              boxShadow: isCurrent ? `0 0 0 3px ${fwMeta.color}30` : isAnswered ? `0 2px 8px ${fwMeta.color}50` : 'none',
                              transform: isCurrent ? 'scale(1.08)' : isAnswered ? 'scale(1.03)' : 'scale(1)',
                            }}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Generate Report + Exit Fullscreen */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          {showPartialConfirm ? (
            <div style={{ background: 'rgba(210,153,34,0.08)', border: '1px solid rgba(210,153,34,0.3)', borderRadius: '10px', padding: '10px', marginBottom: '8px' }}>
              <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                {answeredQuestionsCount}/{totalQuestionsCount} answered. Unanswered default to L0.
              </p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={doSubmitAssessment} className="btn-premium justify-content-center" style={{ flex: 1, padding: '6px', fontSize: '0.75rem', background: fwMeta.color, borderColor: fwMeta.color }} disabled={submitting}>
                  {submitting ? <span className="spinner-border spinner-border-sm" /> : 'Submit'}
                </button>
                <button onClick={() => setShowPartialConfirm(false)} className="btn-premium-outline justify-content-center" style={{ flex: 1, padding: '6px', fontSize: '0.75rem' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={handleSubmitAssessment} className="btn-premium w-100 justify-content-center" style={{ padding: '9px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px', background: fwMeta.color, borderColor: fwMeta.color }} disabled={submitting}>
              {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><span className="material-icons" style={{ fontSize: '1.1rem' }}>bar_chart</span> Generate Report</>}
            </button>
          )}

        </div>
      </aside>

      {/* ══════ MAIN CONTENT ══════
          Critical layout: flex column with overflow:hidden so nav is always visible.
          Only the question-scroll zone scrolls internally.
      */}
      <main style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
      }}>

        {/* ── Top progress bar (fixed height) ── */}
        <div style={{ padding: '14px 28px 10px', flexShrink: 0, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Completed:&nbsp;
              <span style={{ color: fwMeta.color, fontFamily: 'var(--font-mono)' }}>
                {answeredQuestionsCount} / {totalQuestionsCount}
              </span>
            </span>
            {/* ← Back to Dashboard button — always visible in top bar */}
            <button
              onClick={() => {
                if (window.confirm('Exit the assessment? Your progress will not be saved.')) {
                  exitFullscreen();
                  router.push('/dashboard');
                }
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: 'transparent', border: '1px solid var(--border-subtle)',
                borderRadius: '8px', padding: '5px 12px',
                fontSize: '0.78rem', fontWeight: 600,
                color: 'var(--text-muted)', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              <span className="material-icons" style={{ fontSize: '0.9rem' }}>arrow_back</span>
              Exit
            </button>
          </div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '99px', width: `${overallProgressPercent}%`, background: `linear-gradient(90deg, ${fwMeta.color}cc, ${fwMeta.color})`, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* ── Question scroll zone (fills remaining space, scrolls internally) ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 28px 12px', minHeight: 0 }}>
          {currentQuestion ? (
            <div style={{
              background: 'var(--bg-card)', borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
              padding: '24px 28px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              display: 'flex', flexDirection: 'column', gap: '18px',
            }}>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '3px 10px', borderRadius: '99px', border: '1px solid var(--border-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {currentArea}
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: fwMeta.color, background: `${fwMeta.color}12`, padding: '3px 10px', borderRadius: '99px', border: `1px solid ${fwMeta.color}30` }}>
                  {currentQuestion.subArea}
                </span>
              </div>

              {/* Related Practice */}
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Related Practice:</strong> {currentQuestion.practice}
              </p>

              {/* Question text */}
              <h2 style={{ fontSize: '0.98rem', fontWeight: 600, lineHeight: 1.7, color: 'var(--text-primary)', margin: 0, borderLeft: `3px solid ${fwMeta.color}`, paddingLeft: '14px' }}>
                {currentQuestion.questionText}
              </h2>

              {/* Level chips */}
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Select AI Integration Level
                </div>
                <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                  {levelOptions.map(opt => {
                    const sel = currentAnswer.level === opt.level;
                    return (
                    <button key={opt.level} type="button" onClick={() => handleLevelSelect(opt.level)} title={opt.desc}
                      style={{
                        padding: '9px 14px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.18s ease',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                        border: sel ? `2px solid ${fwMeta.color}` : '1px solid var(--border-subtle)',
                        background: sel ? `${fwMeta.color}12` : 'var(--bg-elevated)',
                        boxShadow: sel ? `0 0 0 3px ${fwMeta.color}20` : 'none',
                        minWidth: '76px', flex: '1',
                        transform: sel ? 'translateY(-2px)' : 'none',
                      }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: sel ? fwMeta.color : 'var(--text-secondary)' }}>
                        {opt.label}
                      </span>
                      <span style={{ fontSize: '0.58rem', fontWeight: 600, color: sel ? fwMeta.color : 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>
                        {opt.title}
                      </span>
                    </button>
                    );
                  })}
                </div>
                {currentAnswer.level !== null && (
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0, fontStyle: 'italic' }}>
                    {levelOptions.find(o => o.level === currentAnswer.level)?.desc}
                  </p>
                )}
              </div>

              {/* AI Tools (level > 0 only) */}
              {currentAnswer.level !== null && currentAnswer.level > 0 && (
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    AI Tools Used (optional)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                    {(defaultToolsPerLevel[currentAnswer.level] || []).map(tool => {
                      const checked = currentAnswer.toolsUsed.includes(tool);
                      return (
                        <button key={tool} type="button" onClick={() => handleToolToggle(tool)}
                          style={{ padding: '4px 11px', borderRadius: '99px', fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                            border: `1px solid ${checked ? fwMeta.color : 'var(--border-subtle)'}`,
                            background: checked ? `${fwMeta.color}15` : 'var(--bg-elevated)',
                            color: checked ? fwMeta.color : 'var(--text-secondary)' }}>
                          {checked ? '✓ ' : ''}{tool}
                        </button>
                      );
                    })}
                    {currentAnswer.toolsUsed.filter(t => !(defaultToolsPerLevel[currentAnswer.level] || []).includes(t)).map(t => (
                      <span key={t} style={{ padding: '4px 11px', borderRadius: '99px', fontSize: '0.73rem', fontWeight: 600, border: `1px solid ${fwMeta.color}`, background: `${fwMeta.color}15`, color: fwMeta.color }}>
                        {t} <span style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => handleToolToggle(t)}>×</span>
                      </span>
                    ))}
                  </div>
                  <form onSubmit={handleAddCustomTool} style={{ display: 'flex', gap: '7px', maxWidth: '300px' }}>
                    <input type="text" className="form-control" style={{ fontSize: '0.8rem', padding: '5px 10px' }} placeholder="Add custom tool…" value={customToolInput} onChange={e => setCustomToolInput(e.target.value)} />
                    <button type="submit" className="btn-premium-outline" style={{ padding: '5px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>+ Add</button>
                  </form>
                </div>
              )}

              {/* Practice Description */}
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Practice Description <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(Optional)</span>
                </div>
                <textarea className="form-control" rows={2}
                  placeholder="Briefly explain how you arrived at this level…"
                  value={currentAnswer.practiceDescription || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [currentQuestion.id]: { ...currentAnswer, practiceDescription: e.target.value } }))}
                  style={{ fontSize: '0.8rem', resize: 'vertical', minHeight: '64px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: (currentAnswer.practiceDescription || '').trim().split(/\s+/).filter(Boolean).length > 100 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {(currentAnswer.practiceDescription || '').trim().split(/\s+/).filter(Boolean).length} / 100 words
                  </span>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div className="spinner-border" role="status"><span className="visually-hidden">Loading…</span></div>
            </div>
          )}
        </div>

        {/* ── Bottom nav (fixed height, always visible, never pushed off screen) ── */}
        <div style={{
          flexShrink: 0,
          padding: '12px 28px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '60px',
        }}>
          {!isFirstQuestion ? (
            <button onClick={handlePrev} className="btn-premium-outline" style={{ padding: '9px 22px', fontSize: '0.85rem' }}>
              ← Previous Question
            </button>
          ) : <div />}

          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {safeQuestionIndex + 1} / {areaQuestions.length}
          </span>

          {!isLastQuestion && (
            <button onClick={handleNext} className="btn-premium" style={{ padding: '9px 22px', fontSize: '0.85rem', background: fwMeta.color, borderColor: fwMeta.color }}>
              {safeQuestionIndex === areaQuestions.length - 1 ? 'Next Section →' : 'Next Question →'}
            </button>
          )}
        </div>

      </main>
    </div>
  );
}

export default function Assessment() {
  return (
    <Suspense fallback={
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border mb-3" role="status"><span className="visually-hidden">Loading...</span></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading assessment…</p>
        </div>
      </div>
    }>
      <AssessmentInner />
    </Suspense>
  );
}
