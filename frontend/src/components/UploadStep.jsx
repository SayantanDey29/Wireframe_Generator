import React, { useState, useRef } from 'react';
import { Upload, FileText, Globe, Layers, ChevronRight, AlertCircle } from 'lucide-react';
import { parsePreview } from '../utils/api';

export default function UploadStep({ onNext }) {
  const [file, setFile] = useState(null);
  const [siteName, setSiteName] = useState('');
  const [maxPages, setMaxPages] = useState(10);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const handleFile = async (f) => {
    if (!f || !f.name.endsWith('.xml')) {
      setError('Please upload a valid XML sitemap file.');
      return;
    }
    setError('');
    setFile(f);
    setLoading(true);
    try {
      const data = await parsePreview(f);
      setPreview(data);
      if (!siteName) {
        // Try to extract domain from first URL
        if (data.pages?.[0]?.url) {
          try {
            const domain = new URL(data.pages[0].url).hostname.replace('www.', '');
            setSiteName(domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
          } catch {}
        }
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to parse sitemap. Please check the file format.');
    }
    setLoading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleSubmit = () => {
    if (!file) return;
    onNext({ file, siteName: siteName || 'My Website', maxPages });
  };

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.badge}>WIREFRAME GENERATOR</div>
        <h1 style={styles.title}>
          Transform Your Sitemap<br />
          <span style={styles.titleAccent}>Into Wireframes</span>
        </h1>
        <p style={styles.subtitle}>
          Upload a sitemap XML file and get AI-generated wireframes for every page — instantly editable, fully structured.
        </p>
      </div>

      <div style={styles.card}>
        {/* Upload zone */}
        <div
          style={{ ...styles.dropzone, ...(dragging ? styles.dropzoneActive : {}), ...(file ? styles.dropzoneDone : {}) }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current.click()}
        >
          <input ref={fileRef} type="file" accept=".xml" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          {file ? (
            <div style={styles.fileInfo}>
              <FileText size={32} color="#6c63ff" />
              <div>
                <div style={styles.fileName}>{file.name}</div>
                <div style={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            </div>
          ) : (
            <div style={styles.uploadPrompt}>
              <div style={styles.uploadIcon}><Upload size={28} color="#6c63ff" /></div>
              <div style={styles.uploadText}>Drop your sitemap.xml here</div>
              <div style={styles.uploadSub}>or click to browse</div>
            </div>
          )}
        </div>

        {error && (
          <div style={styles.error}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Preview */}
        {loading && (
          <div style={styles.loadingBar}>
            <div style={styles.loadingInner} />
          </div>
        )}

        {preview && !loading && (
          <div style={styles.preview}>
            <div style={styles.previewHeader}>
              <Layers size={16} color="#6c63ff" />
              <span style={styles.previewTitle}>Sitemap Preview</span>
              <span style={styles.pageCount}>{preview.total_pages} pages found</span>
            </div>
            <div style={styles.pageList}>
              {preview.pages.slice(0, 12).map((page, i) => (
                <div key={i} style={styles.pageItem}>
                  <div style={{ ...styles.depthDot, marginLeft: `${page.depth * 12}px` }} />
                  <span style={styles.pageTitle}>{page.title || 'Home'}</span>
                  <span style={styles.pageUrl}>{page.url.replace(/^https?:\/\/[^/]+/, '')}</span>
                </div>
              ))}
              {preview.total_pages > 12 && (
                <div style={styles.morePages}>+{preview.total_pages - 12} more pages</div>
              )}
            </div>
          </div>
        )}

        {/* Config */}
        {file && !loading && (
          <div style={styles.config}>
            <div style={styles.configRow}>
              <label style={styles.label}>
                <Globe size={14} color="#6c63ff" />
                Site Name
              </label>
              <input
                style={styles.input}
                value={siteName}
                onChange={e => setSiteName(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div style={styles.configRow}>
              <label style={styles.label}>
                <Layers size={14} color="#6c63ff" />
                Max Pages to Generate
              </label>
              <div style={styles.sliderRow}>
                <input
                  type="range" min={1} max={20} value={maxPages}
                  onChange={e => setMaxPages(Number(e.target.value))}
                  style={styles.slider}
                />
                <span style={styles.sliderValue}>{maxPages}</span>
              </div>
            </div>
          </div>
        )}

        <button
          style={{ ...styles.btn, ...((!file || loading) ? styles.btnDisabled : {}) }}
          onClick={handleSubmit}
          disabled={!file || loading}
        >
          Generate Wireframes
          <ChevronRight size={18} />
        </button>
      </div>

      <div style={styles.features}>
        {[
          { icon: '⚡', title: 'AI-Powered', desc: 'LangGraph orchestrates intelligent page analysis' },
          { icon: '🎨', title: 'Editable Layouts', desc: 'Every section is interactive and customizable' },
          { icon: '📐', title: 'Pixel-Perfect', desc: 'Accurate 1280px canvas with real proportions' },
        ].map((f, i) => (
          <div key={i} style={styles.featureCard}>
            <div style={styles.featureIcon}>{f.icon}</div>
            <div style={styles.featureTitle}>{f.title}</div>
            <div style={styles.featureDesc}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 720, margin: '0 auto', padding: '60px 24px' },
  hero: { textAlign: 'center', marginBottom: 48 },
  badge: {
    display: 'inline-block', padding: '6px 16px', borderRadius: 20,
    background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)',
    color: '#6c63ff', fontSize: 11, fontFamily: 'DM Mono', letterSpacing: '0.12em',
    marginBottom: 24,
  },
  title: { fontSize: 52, fontWeight: 700, lineHeight: 1.15, marginBottom: 16, color: '#f0f0f4' },
  titleAccent: { color: '#6c63ff' },
  subtitle: { fontSize: 17, color: '#8888a0', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' },
  card: {
    background: '#16161a', border: '1px solid #2a2a32', borderRadius: 16,
    padding: 32, marginBottom: 40,
  },
  dropzone: {
    border: '2px dashed #2a2a32', borderRadius: 12, padding: 40,
    textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
    marginBottom: 24,
  },
  dropzoneActive: { borderColor: '#6c63ff', background: 'rgba(108,99,255,0.05)' },
  dropzoneDone: { borderColor: '#22c55e', borderStyle: 'solid', background: 'rgba(34,197,94,0.04)' },
  fileInfo: { display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' },
  fileName: { fontFamily: 'DM Mono', fontSize: 15, color: '#f0f0f4' },
  fileSize: { color: '#8888a0', fontSize: 13, fontFamily: 'DM Mono' },
  uploadIcon: {
    width: 56, height: 56, borderRadius: 14, background: 'rgba(108,99,255,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
  },
  uploadPrompt: {},
  uploadText: { fontSize: 16, color: '#f0f0f4', marginBottom: 6 },
  uploadSub: { fontSize: 13, color: '#8888a0', fontFamily: 'DM Mono' },
  error: {
    display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444',
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16,
  },
  loadingBar: { height: 3, background: '#2a2a32', borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  loadingInner: {
    height: '100%', width: '40%', background: '#6c63ff', borderRadius: 2,
    animation: 'loading 1s ease-in-out infinite alternate',
  },
  preview: {
    background: '#1c1c22', border: '1px solid #2a2a32', borderRadius: 10,
    padding: 16, marginBottom: 24,
  },
  previewHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  previewTitle: { color: '#f0f0f4', fontWeight: 500, flex: 1 },
  pageCount: {
    background: 'rgba(108,99,255,0.15)', color: '#6c63ff',
    fontSize: 12, padding: '2px 10px', borderRadius: 10, fontFamily: 'DM Mono',
  },
  pageList: { display: 'flex', flexDirection: 'column', gap: 4 },
  pageItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' },
  depthDot: { width: 6, height: 6, borderRadius: '50%', background: '#6c63ff', flexShrink: 0 },
  pageTitle: { color: '#f0f0f4', fontSize: 13, fontWeight: 500, minWidth: 120 },
  pageUrl: { color: '#8888a0', fontSize: 12, fontFamily: 'DM Mono', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  morePages: { color: '#55556a', fontSize: 12, fontFamily: 'DM Mono', paddingTop: 8, paddingLeft: 14 },
  config: { marginBottom: 24 },
  configRow: { marginBottom: 20 },
  label: { display: 'flex', alignItems: 'center', gap: 6, color: '#8888a0', fontSize: 13, marginBottom: 8 },
  input: {
    width: '100%', background: '#1c1c22', border: '1px solid #2a2a32',
    borderRadius: 8, padding: '10px 14px', color: '#f0f0f4', fontSize: 14,
    outline: 'none',
  },
  sliderRow: { display: 'flex', alignItems: 'center', gap: 16 },
  slider: { flex: 1, accentColor: '#6c63ff' },
  sliderValue: { fontFamily: 'DM Mono', color: '#6c63ff', fontSize: 18, minWidth: 30, textAlign: 'right' },
  btn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 10,
    padding: '14px 24px', fontSize: 15, fontWeight: 600, transition: 'all 0.2s',
    cursor: 'pointer',
  },
  btnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  features: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  featureCard: {
    background: '#16161a', border: '1px solid #2a2a32', borderRadius: 12, padding: 20,
  },
  featureIcon: { fontSize: 24, marginBottom: 10 },
  featureTitle: { color: '#f0f0f4', fontWeight: 600, marginBottom: 6 },
  featureDesc: { color: '#8888a0', fontSize: 13, lineHeight: 1.5 },
};
