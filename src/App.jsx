import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Smartphone, 
  Code, 
  Scale, 
  Database, 
  Settings as SettingsIcon, 
  Sparkles, 
  Check, 
  Mail, 
  Layers,
  Terminal
} from 'lucide-react';

import { loadCampaigns, saveCampaigns } from './services/dataStore';
import Overview from './components/Overview';
import VisualAttribution from './components/VisualAttribution';
import LogicAuditor from './components/LogicAuditor';
import AbSandbox from './components/AbSandbox';
import Deliverability from './components/Deliverability';
import Catalog from './components/Catalog';
import Settings from './components/Settings';
import AiExplorer from './components/AiExplorer';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [apiKey, setApiKey] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaignId, setActiveCampaignId] = useState('dq-welcome-email');
  const [toast, setToast] = useState('');

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
      const merged = [...imported, ...prev];
      saveCampaigns(merged);
      return merged;
    });
    if (imported.length > 0) {
      setActiveCampaignId(imported[0].id);
      setActiveTab('overview');
      triggerToast(`Imported ${imported.length} campaign(s) successfully!`);
    }
  };

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId) || campaigns[0];

  const renderActiveView = () => {
    if (!activeCampaign) {
      return (
        <div className="panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No campaigns loaded in catalog. Go to Settings to import performance logs.
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return <Overview campaign={activeCampaign} apiKey={apiKey} />;
      case 'attribution':
        return <VisualAttribution campaign={activeCampaign} />;
      case 'logic':
        return <LogicAuditor campaign={activeCampaign} />;
      case 'ab_test':
        return <AbSandbox campaign={activeCampaign} />;
      case 'deliverability':
        return <Deliverability campaign={activeCampaign} apiKey={apiKey} />;
      case 'explorer':
        return <AiExplorer campaign={activeCampaign} apiKey={apiKey} />;
      case 'catalog':
        return (
          <Catalog 
            campaigns={campaigns} 
            activeCampaignId={activeCampaignId} 
            setActiveCampaignId={(id) => {
              setActiveCampaignId(id);
              triggerToast("Swapped active campaign workspace");
            }} 
          />
        );
      case 'settings':
        return (
          <Settings 
            apiKey={apiKey} 
            setApiKey={setApiKey} 
            onImportCampaigns={handleImportCampaigns} 
          />
        );
      default:
        return <Overview campaign={activeCampaign} apiKey={apiKey} />;
    }
  };

  const getHeaderDetails = () => {
    switch (activeTab) {
      case 'overview':
        return { title: 'Master Performance Overview', desc: 'Aggregate metrics, conversion cohorts, and AI campaign post-mortem analysis reports' };
      case 'attribution':
        return { title: 'Visual clickmap Overlay', desc: 'Pulsing neon attribution hotspots layered directly on top of template creatives' };
      case 'logic':
        return { title: 'Liquid Logic Branch Auditor', desc: 'Conversion analysis comparing dynamic segments and variable placeholder options' };
      case 'ab_test':
        return { title: 'A/B Test Significance Sandbox', desc: 'Bayesian statistical confidence calculator and SVG probability curve plotter' };
      case 'deliverability':
        return { title: 'Deliverability Anomalies Radar', desc: 'Identify client-specific inbox placement degradation and open rate deviations' };
      case 'explorer':
        return { title: 'AI SQL Data Explorer', desc: 'Query and audit campaign statistics automatically using natural language' };
      case 'catalog':
        return { title: 'Campaign Workspace Catalog', desc: 'Select or filter campaigns from historical records and imported logs' };
      case 'settings':
        return { title: 'Settings & Log Imports', desc: 'Configure credentials and upload custom CSV campaign performance sheets' };
      default:
        return { title: 'OmniPulse', desc: 'Visual Post-Deployment Campaign Analytics' };
    }
  };

  const { title, desc } = getHeaderDetails();

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Sparkles size={16} fill="white" />
          </div>
          <span className="sidebar-logo-text">OmniPulse</span>
        </div>

        <div className="sidebar-menu">
          <button
            onClick={() => setActiveTab('overview')}
            className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <BarChart2 size={18} />
            Overview Dashboard
          </button>
          
          <button
            onClick={() => setActiveTab('attribution')}
            className={`sidebar-item ${activeTab === 'attribution' ? 'active' : ''}`}
          >
            <Smartphone size={18} />
            Visual clickmap
          </button>

          <button
            onClick={() => setActiveTab('logic')}
            className={`sidebar-item ${activeTab === 'logic' ? 'active' : ''}`}
          >
            <Code size={18} />
            Logic Auditor
          </button>

          <button
            onClick={() => setActiveTab('ab_test')}
            className={`sidebar-item ${activeTab === 'ab_test' ? 'active' : ''}`}
          >
            <Scale size={18} />
            A/B Sandbox
          </button>

          <button
            onClick={() => setActiveTab('deliverability')}
            className={`sidebar-item ${activeTab === 'deliverability' ? 'active' : ''}`}
          >
            <Mail size={18} />
            Anomalies Radar
          </button>

          <button
            onClick={() => setActiveTab('explorer')}
            className={`sidebar-item ${activeTab === 'explorer' ? 'active' : ''}`}
          >
            <Terminal size={18} />
            AI SQL Explorer
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`sidebar-item ${activeTab === 'catalog' ? 'active' : ''}`}
          >
            <Database size={18} />
            Campaign Catalog
          </button>
        </div>

        <div className="sidebar-footer">
          <button
            onClick={() => setActiveTab('settings')}
            className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
            style={{ width: '100%' }}
          >
            <SettingsIcon size={18} />
            Settings & Imports
          </button>
        </div>
      </nav>

      {/* Main Workspace Area */}
      <main className="main-content">
        <header className="header">
          <div>
            <h1>{title}</h1>
            <p className="header-title-desc">{desc}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {activeCampaign && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Active Campaign: <strong style={{ color: 'var(--text-primary)' }}>{activeCampaign.name}</strong>
              </span>
            )}
            
            <div className={`api-badge ${apiKey ? 'connected' : 'simulated'}`}>
              <span className="indicator"></span>
              <span>{apiKey ? 'Live API Mode' : 'Sandbox Demo Mode'}</span>
            </div>
          </div>
        </header>

        {/* Content View Render */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {renderActiveView()}
        </div>
      </main>

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
