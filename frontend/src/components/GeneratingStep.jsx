import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle, XCircle, Loader, Zap } from 'lucide-react';
import { startGeneration, getStatus } from '../utils/api';

export default function GeneratingStep({ config, onComplete, onError }) {
  const [status, setStatus] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [started, setStarted] = useState(false);
  const pollRef = useRef(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (!started) {
      setStarted(true);
      kickoff();
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);
  };

  const kickoff = async () => {
    addLog('Starting generation job...', 'info');
    try {
      const resp = await startGeneration(config.file, config.siteName, config.maxPages);
      setJobId(resp.job_id);
      addLog(`Job created: ${resp.job_id.slice(0, 8)}...`, 'success');
      addLog(`Found ${resp.total_pages_found} pages, generating ${config.maxPages}`, 'info');
      poll(resp.job_id);
    } catch (e) {
      const msg = e.response?.data?.detail || e.message;
      addLog(`Failed to start: ${msg}`, 'error');
      setStatus({ status: 'failed', error: msg });
      onError(msg);
    }
  };

  const poll = (id) => {
    let lastPage = '';
    pollRef.current = setInterval(async () => {
      try {
        const s = await getStatus(id);
        setStatus(s);

        if (s.current_page && s.current_page !== lastPage) {
          lastPage = s.current_page;
          addLog(`Generating: ${s.current_page}`, 'page');
        }

        if (s.status === 'completed') {
          clearInterval(pollRef.current);
          addLog(`✓ All ${s.pages_done} wireframes generated!`, 'success');
          setTimeout(() => onComplete(id), 800);
        } else if (s.status === 'failed') {
          clearInterval(pollRef.current);
          addLog(`✗ Generation failed: ${s.error}`, 'error');
          onError(s.error);
        }
      } catch (e) {
        addLog(`Polling error: ${e.message}`, 'error');
      }
    }, 1500);
  };

  const progress = status
    ? status.status === 'completed'
      ? 100
      : status.total_pages > 0
        ? Math.round((status.pages_done / status.total_pages) * 100)
        : 0
    : 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.iconRing}>
          {status?.status === 'completed' ? (
            <CheckCircle size={32} color="#22c55e" />
          ) : status?.status === 'failed' ? (
            <XCircle size={32} color="#ef4444" />
          ) : (
            <div style={styles.spinnerWrap}>
              <Zap size={28} color="#6c63ff" />
            </div>
          )}
        </div>
        <h2 style={styles.title}>
          {status?.status === 'completed' ? 'Generation Complete!' :
           status?.status === 'failed' ? 'Generation Failed' :
           'Generating Wireframes...'}
        </h2>
        <p style={styles.subtitle}>
          {status?.status === 'completed'
            ? `Successfully created ${status.pages_done} wireframes for ${config.siteName}`
            : `Using AI to analyze and wireframe each page of ${config.siteName}`}
        </p>
      </div>

      {/* Progress bar */}
      <div style={styles.progressCard}>
        <div style={styles.progressHeader}>
          <span style={styles.progressLabel}>
            {status?.current_page ? `Processing: ${status.current_page}` : 'Initializing...'}
          </span>
          <span style={styles.progressPct}>{progress}%</span>
        </div>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progress}%`,
              background: status?.status === 'completed' ? '#22c55e' : '#6c63ff',
            }}
          />
        </div>
        <div style={styles.progressStats}>
          <span>{status?.pages_done ?? 0} / {status?.total_pages ?? config.maxPages} pages</span>
          <span style={{ color: '#8888a0' }}>{config.siteName}</span>
        </div>
      </div>

      {/* Page dots */}
      {status?.total_pages > 0 && (
        <div style={styles.dotsRow}>
          {Array.from({ length: status.total_pages }).map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.dot,
                background: i < status.pages_done ? '#6c63ff' :
                            i === status.pages_done ? '#8880ff' : '#2a2a32',
                transform: i === status.pages_done ? 'scale(1.4)' : 'scale(1)',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
      )}

      {/* Logs terminal */}
      <div style={styles.terminal}>
        <div style={styles.terminalHeader}>
          <div style={styles.termDot} />
          <div style={{ ...styles.termDot, background: '#f59e0b' }} />
          <div style={{ ...styles.termDot, background: '#22c55e' }} />
          <span style={styles.termLabel}>generation.log</span>
        </div>
        <div style={styles.terminalBody}>
          {logs.map((log, i) => (
            <div key={i} style={{ ...styles.logLine, color: LOG_COLORS[log.type] }}>
              <span style={styles.logTs}>{log.ts}</span>
              <span>{log.msg}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}

const LOG_COLORS = {
  info: '#8888a0',
  success: '#22c55e',
  error: '#ef4444',
  page: '#6c63ff',
};

const styles = {
  container: { maxWidth: 680, margin: '0 auto', padding: '60px 24px' },
  header: { textAlign: 'center', marginBottom: 40 },
  iconRing: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px',
  },
  spinnerWrap: { animation: 'spin 2s linear infinite' },
  title: { fontSize: 30, fontWeight: 700, color: '#f0f0f4', marginBottom: 10 },
  subtitle: { color: '#8888a0', fontSize: 15 },
  progressCard: {
    background: '#16161a', border: '1px solid #2a2a32', borderRadius: 14,
    padding: 24, marginBottom: 24,
  },
  progressHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  progressLabel: { color: '#f0f0f4', fontSize: 14 },
  progressPct: { fontFamily: 'DM Mono', color: '#6c63ff', fontSize: 18, fontWeight: 500 },
  progressTrack: { height: 6, background: '#2a2a32', borderRadius: 3, marginBottom: 14, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, transition: 'width 0.4s ease' },
  progressStats: { display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'DM Mono', color: '#6c63ff' },
  dotsRow: {
    display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
    marginBottom: 24, padding: '0 24px',
  },
  dot: { width: 10, height: 10, borderRadius: '50%' },
  terminal: {
    background: '#0a0a10', border: '1px solid #2a2a32', borderRadius: 12,
    overflow: 'hidden',
  },
  terminalHeader: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
    background: '#141418', borderBottom: '1px solid #2a2a32',
  },
  termDot: { width: 10, height: 10, borderRadius: '50%', background: '#ef4444' },
  termLabel: { color: '#55556a', fontSize: 12, fontFamily: 'DM Mono', marginLeft: 8 },
  terminalBody: { padding: 16, maxHeight: 240, overflowY: 'auto', fontFamily: 'DM Mono' },
  logLine: { display: 'flex', gap: 12, fontSize: 12, marginBottom: 6 },
  logTs: { color: '#35353a', flexShrink: 0 },
};
