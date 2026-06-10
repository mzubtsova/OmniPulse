import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Check, 
  Settings as SettingsIcon,
  Sun,
  Moon,
  Trash2,
  Eye,
  Calendar,
  X,
  Terminal,
  Printer,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

import { 
  loadCampaigns, 
  saveCampaigns, 
  loadSavedReports, 
  saveReportSnapshot, 
  deleteSavedReport 
} from './services/dataStore';
import Overview from './components/Overview';
import Settings from './components/Settings';
import AiExplorer from './components/AiExplorer';

// Simple Markdown parser for modal view
function parseMarkdown(text) {
  if (!text) return '';
  
  let html = text
    .replace(/^### (.*$)/gim, '<h4 style="font-size: 0.95rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.4rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.3rem;">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 style="font-size: 1.1rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.6rem; color: var(--text-primary);">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 style="font-size: 1.2rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.85rem; color: var(--text-primary);">$1</h2>');
  
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  html = html.replace(/^\* (.*$)/gim, '<li style="margin-left: 1.1rem; margin-bottom: 0.3rem; list-style-type: square; color: var(--text-primary); font-size: 0.85rem;">$1</li>');
  
  html = html.replace(/((?:<li.*?>.*?<\/li>\s*)+)/g, '<ul style="margin-bottom: 0.75rem;">$1</ul>');
  
  html = html.split('\n\n').map(p => {
    if (p.trim().startsWith('<h') || p.trim().startsWith('<ul') || p.trim().startsWith('<li')) {
      return p;
    }
    return `<p style="margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.45;">${p}</p>`;
  }).join('\n');

  return html;
}

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaignId, setActiveCampaignId] = useState('dq-welcome-email');
  const [toast, setToast] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  // Theme & Storage states
  const [theme, setTheme] = useState(() => localStorage.getItem('omnipulse_theme') || 'dark');
  const [savedReports, setSavedReports] = useState([]);
  const [activeReportModal, setActiveReportModal] = useState(null);

  // Loading animation states for headers
  const [isChangingTheme, setIsChangingTheme] = useState(false);
  const [isTogglingSettings, setIsTogglingSettings] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Sync theme attribute to HTML tag on change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('omnipulse_theme', theme);
  }, [theme]);

  // Load API credentials, seeded campaigns, and saved reports on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    setApiKey(savedKey);

    const loaded = loadCampaigns();
    setCampaigns(loaded);
    
    if (loaded.length > 0) {
      setActiveCampaignId(loaded[0].id);
    }

    const archived = loadSavedReports();
    setSavedReports(archived);
  }, []);

  const triggerToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  };

  const handleImportCampaigns = (imported) => {
    setCampaigns(prev => {
      const filtered = prev.filter(c => !imported.some(imp => imp.id === c.id));
      const merged = [...imported, ...filtered];
      saveCampaigns(merged);
      return merged;
    });
    if (imported.length > 0) {
      setActiveCampaignId(imported[0].id);
      triggerToast(`Imported ${imported.length} campaign(s) successfully!`);
    }
  };

  // Toggle Theme with forced 1-second delay
  const toggleTheme = () => {
    setIsChangingTheme(true);
    setTimeout(() => {
      const targetTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(targetTheme);
      setIsChangingTheme(false);
      triggerToast(`Switched theme to ${targetTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}`);
    }, 1000);
  };

  // Toggle Settings panel with forced 1-second delay
  const handleToggleSettings = () => {
    setIsTogglingSettings(true);
    setTimeout(() => {
      setShowSettings(prev => !prev);
      setIsTogglingSettings(false);
    }, 1000);
  };

  // Save Report snapshot handler
  const handleSaveReport = (campaignName, stats, postMortemText) => {
    if (!postMortemText) {
      triggerToast("AI post-mortem report is still loading, please wait.");
      return;
    }
    const updated = saveReportSnapshot(campaignName, stats, postMortemText);
    setSavedReports(updated);
    triggerToast(`Snapshot of "${campaignName}" saved to archive!`);
  };

  // Delete Report snapshot handler with forced 1-second delay
  const handleDeleteReport = (reportId, e) => {
    e.stopPropagation();
    setDeletingId(reportId);
    setTimeout(() => {
      const updated = deleteSavedReport(reportId);
      setSavedReports(updated);
      setDeletingId(null);
      triggerToast("Snapshot deleted from history archive.");
    }, 1000);
  };

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId) || campaigns[0];

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw' }}>
      
      {/* Top Header Navigation */}
      <header className="header" style={{
        position: 'sticky',
        top: 0,
        zIndex: 500,
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '1rem 2rem',
        margin: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="sidebar-logo-icon" style={{ width: '28px', height: '28px', borderRadius: '8px' }}>
            <Sparkles size={14} fill="white" />
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--text-primary) 40%, var(--accent-purple) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            OmniPulse
          </span>
          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: '600', marginLeft: '0.5rem' }}>
            v2.2
          </span>
        </div>

        {/* Catalog Selector and theme toggles in Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {campaigns.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Active Campaign:</span>
              <select
                value={activeCampaignId}
                onChange={(e) => {
                  setActiveCampaignId(e.target.value);
                  triggerToast("Swapped active campaign workspace");
                }}
                className="form-select"
                style={{
                  padding: '0.4rem 2rem 0.4rem 0.8rem',
                  fontSize: '0.85rem',
                  width: '240px',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  fontWeight: '600'
                }}
              >
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.channel?.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Theme Switcher Button with spinner delay */}
          <button
            onClick={toggleTheme}
            disabled={isChangingTheme}
            className="btn btn-secondary"
            style={{
              padding: '0.45rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-tertiary)',
              cursor: 'pointer'
            }}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isChangingTheme ? (
              <RefreshCw size={15} className="spin" />
            ) : theme === 'dark' ? (
              <Sun size={15} style={{ color: 'var(--warning)' }} />
            ) : (
              <Moon size={15} style={{ color: 'var(--accent-primary)' }} />
            )}
          </button>

          {/* API Mode Indicator */}
          <div className={`api-badge ${apiKey ? 'connected' : 'simulated'}`} style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}>
            <span className="indicator"></span>
            <span>{apiKey ? 'Live API Mode' : 'Sandbox Demo Mode'}</span>
          </div>

          {/* Toggle Settings Button with spinner delay */}
          <button
            onClick={handleToggleSettings}
            disabled={isTogglingSettings}
            className={`btn ${showSettings ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              borderRadius: '6px',
              fontWeight: '600'
            }}
          >
            {isTogglingSettings ? (
              <RefreshCw size={14} className="spin" />
            ) : (
              <SettingsIcon size={14} className={showSettings ? 'spin' : ''} />
            )}
            {isTogglingSettings ? 'Syncing...' : showSettings ? 'Close' : 'Settings'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content" style={{
        flex: 1,
        margin: '0 auto',
        padding: '2rem',
        maxWidth: '1360px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>

        {/* Collapsible Settings Panel */}
        {showSettings && (
          <div className="fade-in" style={{ 
            borderBottom: '1px dashed var(--border-color)', 
            paddingBottom: '2rem', 
            marginBottom: '1rem' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Workspace Settings & Integrations</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Configure API keys, upload campaign performance logs, or fetch live Braze analytics.</p>
              </div>
            </div>
            <Settings 
              apiKey={apiKey} 
              setApiKey={setApiKey} 
              onImportCampaigns={handleImportCampaigns} 
            />
          </div>
        )}

        {/* Active campaign post-deployment report card */}
        {activeCampaign ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* The One-Dash Report */}
            <Overview campaign={activeCampaign} apiKey={apiKey} onSaveReport={handleSaveReport} />
            
            {/* Separator Section Header for AI query tools */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              marginTop: '1.5rem',
              borderTop: '1px solid var(--border-color)', 
              paddingTop: '2.5rem' 
            }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={18} style={{ color: 'var(--accent-primary)' }} />
                Natural Language Metrics Query Auditor
              </h3>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            </div>

            {/* AI Explorer panel */}
            <AiExplorer campaign={activeCampaign} apiKey={apiKey} />

            {/* Saved Reports Snapshot Library Section */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              marginTop: '1.5rem',
              borderTop: '1px solid var(--border-color)', 
              paddingTop: '2.5rem' 
            }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} style={{ color: 'var(--accent-secondary)' }} />
                Saved Reports History Archive
              </h3>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            </div>

            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Browse past saved post-deployment report snapshots. Click "View" to open archived AI summaries and conversion statistics.
              </p>
              
              {savedReports.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '0.5rem' }}>
                  {savedReports.map((report) => (
                    <div 
                      key={report.id}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--border-radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{report.campaignName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                          <Calendar size={12} />
                          {report.dateSaved}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <div>Sent: <strong style={{ color: 'var(--text-primary)' }}>{report.stats?.sent?.toLocaleString() || '0'}</strong></div>
                        <div>Clicks: <strong style={{ color: 'var(--accent-primary)' }}>{report.stats?.clicks?.toLocaleString() || '0'}</strong></div>
                        <div>Conversions: <strong style={{ color: 'var(--success)' }}>{report.stats?.conversions?.toLocaleString() || '0'}</strong></div>
                        <div>Bounces: <strong style={{ color: report.stats?.bounces > 0 ? 'var(--error)' : 'var(--text-muted)' }}>{report.stats?.bounces?.toLocaleString() || '0'}</strong></div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          onClick={() => setActiveReportModal(report)}
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderRadius: '4px' }}
                        >
                          <Eye size={12} />
                          View Snapshot
                        </button>
                        <button
                          onClick={(e) => handleDeleteReport(report.id, e)}
                          className="btn btn-secondary"
                          disabled={deletingId === report.id}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderRadius: '4px', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)', width: '38px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Delete snapshot from storage"
                        >
                          {deletingId === report.id ? <RefreshCw size={12} className="spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--border-radius-md)', fontSize: '0.85rem' }}>
                  No saved report snapshots found in the archive library. Click "Save Snapshot" at the top of the summary report to archive campaign metrics.
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No campaigns loaded. Click "Settings & Imports" above to upload performance CSV logs or connect your Braze campaign.
          </div>
        )}

      </main>

      {/* Historical Report Snapshot Modal Overlay */}
      {activeReportModal && (
        <div 
          onClick={() => setActiveReportModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="panel"
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Archived Campaign Report</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saved on: {activeReportModal.dateSaved}</span>
              </div>
              <button 
                onClick={() => setActiveReportModal(null)}
                className="btn btn-secondary"
                style={{ padding: '0.35rem', borderRadius: '50%' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Campaign Target</div>
                <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>{activeReportModal.campaignName}</div>
              </div>

              {/* Stats Block */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.85rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>VOLUME SENT</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>{activeReportModal.stats?.sent?.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>UNIQUE CLICKS</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-primary)' }}>{activeReportModal.stats?.clicks?.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>CONVERSIONS</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--success)' }}>{activeReportModal.stats?.conversions?.toLocaleString()}</div>
                </div>
              </div>

              {/* AI Post-Mortem Output */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.5rem' }}>AI Post-Mortem Summary</div>
                <div 
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    maxHeight: '220px',
                    overflowY: 'auto'
                  }}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(activeReportModal.postMortem) }}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
              <button
                onClick={() => window.print()}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Printer size={12} />
                Print Snapshot
              </button>
              <button
                onClick={() => setActiveReportModal(null)}
                className="btn btn-primary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '1.5rem 2rem',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <span>&copy; 2026 OmniPulse Campaign Analytics Dashboard. Built using React + Google Gemini Flash.</span>
      </footer>

      {/* Global Toast Alerts */}
      {toast && (
        <div className="toast">
          <Check size={16} />
          <span>{toast}</span>
        </div>
      )}
      
    </div>
  );
}
