import React, { useState } from 'react';
import UploadStep from './components/UploadStep';
import GeneratingStep from './components/GeneratingStep';
import ViewerStep from './components/ViewerStep';

// Inject keyframe animations
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes loading { from { transform: translateX(-100%); } to { transform: translateX(300%); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  button:hover { opacity: 0.85; }
`;
document.head.appendChild(style);

export default function App() {
  const [step, setStep] = useState('upload'); // upload | generating | viewer
  const [config, setConfig] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [error, setError] = useState('');

  const handleUploadNext = (cfg) => {
    setConfig(cfg);
    setError('');
    setStep('generating');
  };

  const handleGenerationComplete = (id) => {
    setJobId(id);
    setStep('viewer');
  };

  const handleGenerationError = (msg) => {
    setError(msg);
    setStep('error');
  };

  const handleReset = () => {
    setStep('upload');
    setConfig(null);
    setJobId(null);
    setError('');
  };

  return (
    <div className="app">
      {/* Header - only show on upload step */}
      {step === 'upload' && (
        <header style={styles.header}>
          <div style={styles.headerInner}>
            <div style={styles.logo}>
              <div style={styles.logoMark}>W</div>
              <span style={styles.logoText}>WireGen</span>
            </div>
            <div style={styles.headerBadge}>AI-Powered</div>
          </div>
        </header>
      )}

      {step === 'upload' && <UploadStep onNext={handleUploadNext} />}

      {step === 'generating' && (
        <GeneratingStep
          config={config}
          onComplete={handleGenerationComplete}
          onError={handleGenerationError}
        />
      )}

      {step === 'viewer' && (
        <ViewerStep jobId={jobId} onReset={handleReset} />
      )}

      {step === 'error' && (
        <div style={styles.errorPage}>
          <div style={styles.errorCard}>
            <div style={styles.errorIcon}>✗</div>
            <h2 style={styles.errorTitle}>Generation Failed</h2>
            <p style={styles.errorMsg}>{error}</p>
            <div style={styles.errorHints}>
              <p style={styles.hintTitle}>Common fixes:</p>
              <ul style={styles.hintList}>
                <li>Check your <code>OPENROUTER_API_KEY</code> in the backend <code>.env</code> file</li>
                <li>Make sure the backend server is running on port 8000</li>
                <li>Verify the sitemap XML is valid (standard <code>&lt;urlset&gt;</code> format)</li>
                <li>Try reducing the max pages count</li>
              </ul>
            </div>
            <button style={styles.retryBtn} onClick={handleReset}>Start Over</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    borderBottom: '1px solid #2a2a32',
    background: '#16161a',
    position: 'sticky', top: 0, zIndex: 100,
  },
  headerInner: {
    maxWidth: 720, margin: '0 auto', padding: '14px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 30, height: 30, background: '#6c63ff', borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 16,
  },
  logoText: { color: '#f0f0f4', fontWeight: 700, fontSize: 18, fontFamily: 'Sora' },
  headerBadge: {
    background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)',
    color: '#6c63ff', fontSize: 11, padding: '3px 10px', borderRadius: 10,
    fontFamily: 'DM Mono', letterSpacing: '0.08em',
  },
  errorPage: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', padding: 24,
  },
  errorCard: {
    background: '#16161a', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 16, padding: 40, maxWidth: 480, width: '100%', textAlign: 'center',
  },
  errorIcon: { fontSize: 48, color: '#ef4444', marginBottom: 16 },
  errorTitle: { color: '#f0f0f4', fontSize: 24, fontWeight: 700, marginBottom: 12 },
  errorMsg: {
    color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
    borderRadius: 8, padding: '10px 14px', fontSize: 13, fontFamily: 'DM Mono', marginBottom: 20,
  },
  errorHints: { textAlign: 'left', marginBottom: 24 },
  hintTitle: { color: '#8888a0', fontSize: 13, marginBottom: 8 },
  hintList: { color: '#8888a0', fontSize: 13, paddingLeft: 20, lineHeight: 2 },
  retryBtn: {
    background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 10,
    padding: '12px 32px', fontSize: 15, cursor: 'pointer', fontFamily: 'Sora',
  },
};
