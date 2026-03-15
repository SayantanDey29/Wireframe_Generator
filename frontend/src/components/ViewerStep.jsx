import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut,
  RotateCcw, Layers, FileText, ExternalLink, Eye, Grid, List,
  Move, MousePointer, Edit3, Trash2, Plus, X
} from 'lucide-react';
import { getResult } from '../utils/api';
import WireframeCanvas from './WireframeCanvas';

export default function ViewerStep({ jobId, onReset }) {
  const [project, setProject] = useState(null);
  const [activePage, setActivePage] = useState(0);
  const [zoom, setZoom] = useState(0.55);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('single'); // single | grid | all
  const [editingSection, setEditingSection] = useState(null);
  const [editData, setEditData] = useState({}); // Stores all properties: label, x, y, style...
  const [pages, setPages] = useState([]);
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    fetchResult();
  }, [jobId]);

  const fetchResult = async () => {
    try {
      const data = await getResult(jobId);
      setProject(data);
      setPages(data.pages || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const currentPage = pages[activePage];

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 1.5));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.2));
  const handleZoomReset = () => setZoom(0.55);

  const handleSectionClick = (section) => {
    setEditingSection(section);
    setEditData({
      label: section.label,
      description: section.description,
      x: section.x,
      y: section.y,
      width: section.width,
      height: section.height,
      style: { ...(section.style || {}) }
    });
  };

  const updateEditData = (key, value) => {
    setEditData(prev => ({ ...prev, [key]: value }));
  };

  const updateEditStyle = (key, value) => {
    setEditData(prev => ({
      ...prev,
      style: { ...prev.style, [key]: value }
    }));
  };

  const saveEdit = () => {
    if (!editingSection) return;
    setPages(prev => prev.map((page, pi) => {
      if (pi !== activePage) return page;
      return {
        ...page,
        sections: updateSectionInTree(page.sections, editingSection.id, editData)
      };
    }));
    setEditingSection(null);
  };

  const updateSectionInTree = (sections, id, updates) => {
    return sections.map(s => {
      if (s.id === id) return { ...s, ...updates };
      if (s.children?.length) return { ...s, children: updateSectionInTree(s.children, id, updates) };
      return s;
    });
  };

  const deleteSection = (sectionId) => {
    setPages(prev => prev.map((page, pi) => {
      if (pi !== activePage) return page;
      return { ...page, sections: removeSectionFromTree(page.sections, sectionId) };
    }));
    setEditingSection(null);
  };

  const removeSectionFromTree = (sections, id) => {
    return sections.filter(s => s.id !== id).map(s => ({
      ...s,
      children: s.children ? removeSectionFromTree(s.children, id) : []
    }));
  };

  const downloadSVG = () => {
    const svg = canvasRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `wireframe-${currentPage?.page_title?.replace(/\s+/g, '-').toLowerCase() || 'page'}.svg`;
    a.click();
  };

  const downloadAllJSON = () => {
    const blob = new Blob([JSON.stringify({ ...project, pages }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${project?.project_name?.replace(/\s+/g, '-').toLowerCase() || 'wireframes'}.json`;
    a.click();
  };

  const handleSectionUpdate = useCallback((id, updates) => {
    setPages(prev => prev.map((page, pi) => {
      if (pi !== activePage) return page;
      return {
        ...page,
        sections: updateSectionInTree(page.sections, id, updates)
      };
    }));
    
    // Also update editData if it's the currently editing section
    if (editingSection?.id === id) {
      setEditData(prev => ({ ...prev, ...updates }));
    }
  }, [activePage, editingSection]);

  if (loading) return (
    <div style={styles.loadingState}>
      <div style={styles.spinner} />
      <p>Loading wireframes...</p>
    </div>
  );

  if (!project || pages.length === 0) return (
    <div style={styles.loadingState}>
      <p style={{ color: '#ef4444' }}>Failed to load wireframes. Please try again.</p>
      <button style={styles.resetBtn} onClick={onReset}>Start Over</button>
    </div>
  );

  return (
    <div style={styles.app}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.projectName}>{project.project_name}</div>
          <div style={styles.pageCount}>{pages.length} pages</div>
        </div>

        <div style={styles.pageNav}>
          {pages.map((page, i) => (
            <button
              key={i}
              style={{ ...styles.pageTab, ...(i === activePage ? styles.pageTabActive : {}) }}
              onClick={() => setActivePage(i)}
            >
              <FileText size={13} color={i === activePage ? '#6c63ff' : '#55556a'} />
              <div style={styles.pageTabInfo}>
                <div style={styles.pageTabTitle}>{page.page_title}</div>
                <div style={styles.pageTabUrl}>{page.page_url.replace(/^https?:\/\/[^/]+/, '') || '/'}</div>
              </div>
              <div style={styles.pageTabCount}>{page.sections?.length || 0}</div>
            </button>
          ))}
        </div>

        <div style={styles.sidebarFooter}>
          <button style={styles.sidebarBtn} onClick={downloadAllJSON}>
            <Download size={14} />
            Export JSON
          </button>
          <button style={styles.sidebarBtn} onClick={onReset}>
            <RotateCcw size={14} />
            New Project
          </button>
        </div>
      </aside>

      {/* Main canvas area */}
      <div style={styles.main}>
        {/* Toolbar */}
        <div style={styles.toolbar}>
          <div style={styles.toolbarLeft}>
            <button style={styles.navBtn} onClick={() => setActivePage(p => Math.max(0, p - 1))} disabled={activePage === 0}>
              <ChevronLeft size={16} />
            </button>
            <span style={styles.pageIndicator}>{activePage + 1} / {pages.length}</span>
            <button style={styles.navBtn} onClick={() => setActivePage(p => Math.min(pages.length - 1, p + 1))} disabled={activePage === pages.length - 1}>
              <ChevronRight size={16} />
            </button>
            <div style={styles.divider} />
            <span style={styles.pageNameLabel}>{currentPage?.page_title}</span>
          </div>

          <div style={styles.toolbarRight}>
            <button style={{...styles.toolBtn, ...(viewMode === 'single' ? styles.toolBtnActive : {})}} onClick={() => setViewMode('single')}>
              <Eye size={15} /> Single
            </button>
            <button style={{...styles.toolBtn, ...(viewMode === 'grid' ? styles.toolBtnActive : {})}} onClick={() => setViewMode('grid')}>
              <Grid size={15} /> Grid
            </button>
            <button style={{...styles.toolBtn, ...(viewMode === 'all' ? styles.toolBtnActive : {})}} onClick={() => setViewMode('all')}>
              <Layers size={15} /> All Pages
            </button>
            <div style={styles.divider} />
            <button style={styles.toolBtn} onClick={handleZoomOut}><ZoomOut size={15} /></button>
            <span style={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
            <button style={styles.toolBtn} onClick={handleZoomIn}><ZoomIn size={15} /></button>
            <button style={styles.toolBtn} onClick={handleZoomReset}><RotateCcw size={14} /></button>
            <div style={styles.divider} />
            <button style={styles.toolBtn} onClick={downloadSVG}>
              <Download size={15} /> SVG
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div style={styles.canvasArea}>
          {viewMode === 'single' ? (
            <div style={styles.canvasScroll}>
              <div ref={canvasRef} style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', marginBottom: 40 }}>
                <EditorCanvas
                  wireframe={currentPage}
                  scale={1}
                  selectedId={editingSection?.id}
                  onSectionClick={handleSectionClick}
                  onUpdateSection={handleSectionUpdate}
                />
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={styles.gridView}>
              {pages.map((page, i) => (
                <div
                  key={i}
                  style={{ ...styles.gridCard, ...(i === activePage ? styles.gridCardActive : {}) }}
                  onClick={() => { setActivePage(i); setViewMode('single'); }}
                >
                  <div style={styles.gridCardCanvas}>
                    <WireframeCanvas wireframe={page} scale={0.18} />
                  </div>
                  <div style={styles.gridCardLabel}>{page.page_title}</div>
                </div>
              ))}
            </div>
          ) : (
            /* All Pages view — every wireframe stacked vertically */
            <div style={styles.allPagesScroll}>
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
                {pages.map((page, i) => (
                  <div key={i} style={styles.allPageBlock}>
                    <div style={styles.allPageHeader}>
                      <div style={styles.allPageNum}>{i + 1}</div>
                      <div>
                        <div style={styles.allPageTitle}>{page.page_title}</div>
                        <div style={styles.allPageUrl}>{page.page_url}</div>
                      </div>
                    </div>
                    <div
                      style={styles.allPageCanvas}
                      onClick={() => { setActivePage(i); setViewMode('single'); }}
                    >
                      <WireframeCanvas wireframe={page} scale={1} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section info bar */}
        {viewMode === 'single' && currentPage && (
          <div style={styles.infoBar}>
            <div style={styles.infoBarLeft}>
              <Layers size={14} color="#6c63ff" />
              <span style={{ color: '#8888a0', fontSize: 12 }}>Sections:</span>
              <div style={styles.sectionPills}>
                {currentPage.sections?.slice(0, 8).map((s, i) => (
                  <span key={i} style={styles.sectionPill}>{s.type}</span>
                ))}
                {currentPage.sections?.length > 8 && (
                  <span style={styles.sectionPill}>+{currentPage.sections.length - 8}</span>
                )}
              </div>
            </div>
            <div style={styles.infoBarRight}>
              <span style={{ color: '#55556a', fontSize: 12, fontFamily: 'DM Mono' }}>
                {currentPage.width} × {currentPage.height}px
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Edit panel */}
      {editingSection && (
        <div style={styles.editPanel}>
          <div style={styles.editHeader}>
            <span style={styles.editTitle}>Edit Properties</span>
            <button style={styles.editClose} onClick={() => setEditingSection(null)}>
              <X size={16} />
            </button>
          </div>
          <div style={styles.editBody}>
            <div style={styles.editSection}>
              <div style={styles.editSubTitle}>Content</div>
              <div style={styles.editField}>
                <label style={styles.editLabel}>Type</label>
                <div style={styles.editTypeTag}>{editingSection.type}</div>
              </div>
              <div style={styles.editField}>
                <label style={styles.editLabel}>Label</label>
                <input
                  style={styles.editInput}
                  value={editData.label || ''}
                  onChange={e => updateEditData('label', e.target.value)}
                />
              </div>
              <div style={styles.editField}>
                <label style={styles.editLabel}>Description</label>
                <textarea
                  style={{ ...styles.editInput, height: 60, resize: 'vertical' }}
                  value={editData.description || ''}
                  onChange={e => updateEditData('description', e.target.value)}
                />
              </div>
            </div>

            <div style={styles.editSection}>
              <div style={styles.editSubTitle}>Layout</div>
              <div style={styles.editGrid}>
                <div style={styles.editField}>
                  <label style={styles.editLabel}>X</label>
                  <input type="number" style={styles.editInput} value={editData.x} onChange={e => updateEditData('x', Number(e.target.value))} />
                </div>
                <div style={styles.editField}>
                  <label style={styles.editLabel}>Y</label>
                  <input type="number" style={styles.editInput} value={editData.y} onChange={e => updateEditData('y', Number(e.target.value))} />
                </div>
                <div style={styles.editField}>
                  <label style={styles.editLabel}>Width</label>
                  <input type="number" style={styles.editInput} value={editData.width} onChange={e => updateEditData('width', Number(e.target.value))} />
                </div>
                <div style={styles.editField}>
                  <label style={styles.editLabel}>Height</label>
                  <input type="number" style={styles.editInput} value={editData.height} onChange={e => updateEditData('height', Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div style={styles.editSection}>
              <div style={styles.editSubTitle}>Style</div>
              <div style={styles.editField}>
                <label style={styles.editLabel}>Background</label>
                <div style={styles.colorRow}>
                  <input type="color" value={editData.style?.bg} onChange={e => updateEditStyle('bg', e.target.value)} />
                  <input type="text" style={styles.editInput} value={editData.style?.bg} onChange={e => updateEditStyle('bg', e.target.value)} />
                </div>
              </div>
              <div style={styles.editField}>
                <label style={styles.editLabel}>Text Color</label>
                <div style={styles.colorRow}>
                  <input type="color" value={editData.style?.textColor} onChange={e => updateEditStyle('textColor', e.target.value)} />
                  <input type="text" style={styles.editInput} value={editData.style?.textColor} onChange={e => updateEditStyle('textColor', e.target.value)} />
                </div>
              </div>
              <div style={styles.editField}>
                <label style={styles.editLabel}>Accent Color</label>
                <div style={styles.colorRow}>
                  <input type="color" value={editData.style?.accentColor} onChange={e => updateEditStyle('accentColor', e.target.value)} />
                  <input type="text" style={styles.editInput} value={editData.style?.accentColor} onChange={e => updateEditStyle('accentColor', e.target.value)} />
                </div>
              </div>
              <div style={styles.editField}>
                <label style={styles.editLabel}>Border Color</label>
                <div style={styles.colorRow}>
                  <input type="color" value={editData.style?.borderColor} onChange={e => updateEditStyle('borderColor', e.target.value)} />
                  <input type="text" style={styles.editInput} value={editData.style?.borderColor} onChange={e => updateEditStyle('borderColor', e.target.value)} />
                </div>
              </div>
              
              <div style={styles.editGrid}>
                <div style={styles.editField}>
                  <label style={styles.editLabel}>Radius</label>
                  <input type="number" style={styles.editInput} value={editData.style?.borderRadius} onChange={e => updateEditStyle('borderRadius', Number(e.target.value))} />
                </div>
                <div style={styles.editField}>
                  <label style={styles.editLabel}>Padding</label>
                  <input type="number" style={styles.editInput} value={editData.style?.padding} onChange={e => updateEditStyle('padding', Number(e.target.value))} />
                </div>
                <div style={styles.editField}>
                  <label style={styles.editLabel}>Gap</label>
                  <input type="number" style={styles.editInput} value={editData.style?.gap} onChange={e => updateEditStyle('gap', Number(e.target.value))} />
                </div>
                <div style={styles.editField}>
                  <label style={styles.editLabel}>Font Size</label>
                  <input type="number" style={styles.editInput} value={editData.style?.fontSize} onChange={e => updateEditStyle('fontSize', Number(e.target.value))} />
                </div>
              </div>

              <div style={styles.editField}>
                <label style={styles.editLabel}>Font Family</label>
                <select 
                  style={styles.editInput} 
                  value={editData.style?.fontFamily} 
                  onChange={e => updateEditStyle('fontFamily', e.target.value)}
                >
                  {["Inter", "Sora", "DM Mono", "Playfair Display", "Space Grotesk", "Outfit", "Plus Jakarta Sans"].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div style={styles.editFooter}>
            <button style={styles.deleteBtn} onClick={() => deleteSection(editingSection.id)}>
              <Trash2 size={14} />
            </button>
            <button style={styles.saveBtn} onClick={saveEdit}>
              <Edit3 size={14} /> Apply Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper that makes sections clickable and draggable
function EditorCanvas({ wireframe, scale, onSectionClick, selectedId, onUpdateSection }) {
  const [dragState, setDragState] = useState(null);

  if (!wireframe) return null;

  const handleMouseDown = (e, section) => {
    if (e.button !== 0) return; // Left click only
    e.stopPropagation();
    onSectionClick(section);
    
    setDragState({
      id: section.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: section.x,
      origY: section.y
    });
  };

  const handleMouseMove = (e) => {
    if (!dragState) return;
    
    const dx = (e.clientX - dragState.startX) / scale;
    const dy = (e.clientY - dragState.startY) / scale;
    
    onUpdateSection(dragState.id, {
      x: Math.round(dragState.origX + dx),
      y: Math.round(dragState.origY + dy)
    });
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <WireframeCanvas wireframe={wireframe} scale={scale} />
      {/* Interaction overlays */}
      {wireframe.sections?.map(section => (
        <div
          key={section.id}
          onMouseDown={(e) => handleMouseDown(e, section)}
          style={{
            position: 'absolute',
            left: section.x * scale,
            top: section.y * scale,
            width: section.width * scale,
            height: section.height * scale,
            cursor: dragState?.id === section.id ? 'grabbing' : 'grab',
            border: selectedId === section.id 
              ? '2px solid #6c63ff' 
              : '1px dashed transparent',
            borderRadius: 4,
            transition: 'border-color 0.15s',
            zIndex: selectedId === section.id ? 10 : 2,
            backgroundColor: selectedId === section.id ? 'rgba(108,99,255,0.05)' : 'transparent',
          }}
          onMouseEnter={e => {
            if (!dragState && selectedId !== section.id) 
              e.currentTarget.style.borderColor = 'rgba(108,99,255,0.3)';
          }}
          onMouseLeave={e => {
            if (selectedId !== section.id) 
              e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          {selectedId === section.id && (
            <div style={{
              position: 'absolute',
              top: -24,
              left: 0,
              background: '#6c63ff',
              color: '#fff',
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: '4px 4px 0 0',
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}>
              {section.type}: {section.label} ({Math.round(section.x)}, {Math.round(section.y)})
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const styles = {
  app: { display: 'flex', height: '100vh', overflow: 'hidden' },
  loadingState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, color: '#8888a0' },
  spinner: { width: 32, height: 32, border: '3px solid #2a2a32', borderTopColor: '#6c63ff', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  resetBtn: { background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' },

  // Sidebar
  sidebar: { width: 260, background: '#16161a', borderRight: '1px solid #2a2a32', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarHeader: { padding: '20px 16px 14px', borderBottom: '1px solid #2a2a32' },
  projectName: { color: '#f0f0f4', fontWeight: 600, fontSize: 15, marginBottom: 4 },
  pageCount: { color: '#6c63ff', fontSize: 12, fontFamily: 'DM Mono' },
  pageNav: { flex: 1, overflowY: 'auto', padding: '8px 0' },
  pageTab: {
    width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 16px',
    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
    transition: 'background 0.15s',
  },
  pageTabActive: { background: 'rgba(108,99,255,0.1)' },
  pageTabInfo: { flex: 1, minWidth: 0 },
  pageTabTitle: { color: '#f0f0f4', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pageTabUrl: { color: '#55556a', fontSize: 11, fontFamily: 'DM Mono', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pageTabCount: { color: '#55556a', fontSize: 11, fontFamily: 'DM Mono', flexShrink: 0 },
  sidebarFooter: { padding: 12, borderTop: '1px solid #2a2a32', display: 'flex', flexDirection: 'column', gap: 6 },
  sidebarBtn: {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
    background: '#1c1c22', border: '1px solid #2a2a32', borderRadius: 8,
    color: '#8888a0', padding: '8px 12px', fontSize: 13, cursor: 'pointer',
  },

  // Main
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0e0e14' },

  // Toolbar
  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 20px', height: 52, background: '#16161a', borderBottom: '1px solid #2a2a32',
    flexShrink: 0,
  },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: 8 },
  navBtn: {
    background: '#1c1c22', border: '1px solid #2a2a32', borderRadius: 6,
    color: '#8888a0', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
  },
  pageIndicator: { fontFamily: 'DM Mono', color: '#6c63ff', fontSize: 13, minWidth: 40, textAlign: 'center' },
  divider: { width: 1, height: 20, background: '#2a2a32', margin: '0 6px' },
  pageNameLabel: { color: '#f0f0f4', fontSize: 14, fontWeight: 500 },
  toolBtn: {
    display: 'flex', alignItems: 'center', gap: 5, background: 'none',
    border: 'none', color: '#8888a0', fontSize: 12, cursor: 'pointer', padding: '4px 8px',
    borderRadius: 6, transition: 'background 0.15s',
  },
  toolBtnActive: {
    background: 'rgba(108,99,255,0.15)', color: '#6c63ff',
  },
  zoomLabel: { fontFamily: 'DM Mono', color: '#6c63ff', fontSize: 13, minWidth: 42, textAlign: 'center' },

  // Canvas
  canvasArea: { flex: 1, overflow: 'auto', padding: '32px' },
  canvasScroll: { display: 'flex', justifyContent: 'center', minHeight: '100%' },

  // Grid
  gridView: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, padding: 8 },
  gridCard: {
    background: '#16161a', border: '1px solid #2a2a32', borderRadius: 12,
    overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s',
  },
  gridCardActive: { borderColor: '#6c63ff' },
  gridCardCanvas: { overflow: 'hidden', height: 180, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' },
  gridCardLabel: { padding: '10px 14px', color: '#f0f0f4', fontSize: 13, fontWeight: 500, borderTop: '1px solid #2a2a32' },

  // All Pages view
  allPagesScroll: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: 32, gap: 48, overflow: 'auto', flex: 1,
  },
  allPageBlock: {
    width: '100%', maxWidth: 1320,
  },
  allPageHeader: {
    display: 'flex', alignItems: 'center', gap: 14,
    marginBottom: 16, padding: '0 4px',
  },
  allPageNum: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#6c63ff', fontSize: 14, fontFamily: 'DM Mono', fontWeight: 600,
    flexShrink: 0,
  },
  allPageTitle: { color: '#f0f0f4', fontSize: 16, fontWeight: 600 },
  allPageUrl: { color: '#55556a', fontSize: 12, fontFamily: 'DM Mono' },
  allPageCanvas: {
    border: '1px solid #2a2a32', borderRadius: 12, overflow: 'hidden',
    cursor: 'pointer', transition: 'border-color 0.2s',
  },

  // Info bar
  infoBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 20px', background: '#16161a', borderTop: '1px solid #2a2a32',
    flexShrink: 0,
  },
  infoBarLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  infoBarRight: {},
  sectionPills: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  sectionPill: {
    background: 'rgba(108,99,255,0.1)', color: '#6c63ff', border: '1px solid rgba(108,99,255,0.2)',
    borderRadius: 10, padding: '2px 8px', fontSize: 11, fontFamily: 'DM Mono',
  },

  // Edit panel
  editPanel: {
    width: 280, background: '#16161a', borderLeft: '1px solid #2a2a32',
    display: 'flex', flexDirection: 'column', flexShrink: 0,
  },
  editHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '1px solid #2a2a32' },
  editTitle: { color: '#f0f0f4', fontWeight: 600, fontSize: 14 },
  editClose: { background: 'none', border: 'none', color: '#8888a0', cursor: 'pointer', display: 'flex' },
  editBody: { flex: 1, padding: 16, overflowY: 'auto' },
  editField: { marginBottom: 18 },
  editLabel: { display: 'block', color: '#8888a0', fontSize: 12, fontFamily: 'DM Mono', marginBottom: 6 },
  editTypeTag: {
    display: 'inline-block', background: 'rgba(108,99,255,0.1)', color: '#6c63ff',
    border: '1px solid rgba(108,99,255,0.2)', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontFamily: 'DM Mono',
  },
  editInput: {
    width: '100%', background: '#1c1c22', border: '1px solid #2a2a32', borderRadius: 8,
    padding: '8px 12px', color: '#f0f0f4', fontSize: 13, outline: 'none',
  },
  editDims: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  editDimBadge: {
    background: '#1c1c22', border: '1px solid #2a2a32', borderRadius: 6,
    padding: '3px 8px', color: '#8888a0', fontSize: 11, fontFamily: 'DM Mono',
  },
  editFooter: { display: 'flex', gap: 8, padding: 16, borderTop: '1px solid #2a2a32' },
  editSection: { marginBottom: 24, borderBottom: '1px solid #2a2a32', paddingBottom: 16 },
  editSubTitle: { color: '#6c63ff', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  editGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  colorRow: { display: 'flex', gap: 8, alignItems: 'center' },
  deleteBtn: {
    width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8,
    color: '#ef4444', padding: '8px', cursor: 'pointer',
  },
  saveBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: '#6c63ff', border: 'none', borderRadius: 8,
    color: '#fff', padding: '8px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
  },
};
