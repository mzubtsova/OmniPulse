import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Check, 
  Settings as SettingsIcon,
  ChevronDown,
  Terminal,
  FileText,
  HelpCircle,
  Database
} from 'lucide-react';

import { loadCampaigns, saveCampaigns } from './services/dataStore';
import Overview from './components/Overview';
import Settings from './components/Settings';
import AiExplorer from './components/AiExplorer';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaignId, setActiveCampaignId] = useState('dq-welcome-email');
  const [toast, setToast] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Load API credentials and seed campaigns on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    setApiKey(savedKey);

    const loaded = loadCampaigns();
    setCampaigns(loaded);
    
    if (loaded.length > 0) {
      setActiveCampaignId(loaded[0].id);
    }
  }, []);

  const triggerToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  };

  const handleImportCampaigns = (imported) => {
    setCampaigns(prev => {
      // Prevent duplicates by checking ids
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
            v2.1
          </span>
        </div>

        {/* Catalog Selector in the Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {campaigns.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Active Campaign:</span>
              <div style={{ position: 'relative', display: 'inline-block' }}>
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
                    width: '260px',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#fff',
                    fontWeight: '600'
                  }}
                >
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id} style={{ backgroundColor: 'var(--bg-secondary)', color: '#fff' }}>
                      {c.name} ({c.channel?.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* API Mode Indicator */}
          <div className={`api-badge ${apiKey ? 'connected' : 'simulated'}`} style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}>
            <span className="indicator"></span>
            <span>{apiKey ? 'Live API Mode' : 'Sandbox Demo Mode'}</span>
          </div>

          {/* Toggle Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
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
            <SettingsIcon size={14} className={showSettings ? 'spin' : ''} />
            {showSettings ? 'Close Settings' : 'Settings & Imports'}
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
            <Overview campaign={activeCampaign} apiKey={apiKey} />
            
            {/* Separator Section Header for AI query tools */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              marginTop: '1rem',
              borderTop: '1px solid var(--border-color)', 
              paddingTop: '2.5rem' 
            }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={18} style={{ color: 'var(--accent-purple)' }} />
                Natural Language Metrics Query Auditor
              </h3>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            </div>

            {/* AI Explorer panel */}
            <AiExplorer campaign={activeCampaign} apiKey={apiKey} />

          </div>
        ) : (
          <div className="panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No campaigns loaded. Click "Settings & Imports" above to upload performance CSV logs or connect your Braze campaign.
          </div>
        )}

      </main>

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
