import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldAlert, 
  Key, 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  CloudLightning, 
  Link as LinkIcon, 
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { parseCsvCampaignLog, fetchBrazeCampaignStats } from '../services/dataStore';

export default function Settings({ apiKey, setApiKey, onImportCampaigns, onResetCampaigns }) {
  const [showKey, setShowKey] = useState(false);
  const [showBrazeKey, setShowBrazeKey] = useState(false);
  const [showGa4Secret, setShowGa4Secret] = useState(false);
  
  // Braze API configuration states
  const [brazeEndpoint, setBrazeEndpoint] = useState('');
  const [brazeApiKey, setBrazeApiKey] = useState('');
  const [brazeCampaignId, setBrazeCampaignId] = useState('');
  
  // GA4 API configuration states
  const [ga4MeasurementId, setGa4MeasurementId] = useState('');
  const [ga4ApiSecret, setGa4ApiSecret] = useState('');
  
  // Status states
  const [dragActive, setDragActive] = useState(false);
  const [csvError, setCsvError] = useState('');
  const [csvSuccess, setCsvSuccess] = useState('');
  const [brazeError, setBrazeError] = useState('');
  const [brazeSuccess, setBrazeSuccess] = useState('');
  const [loadingBraze, setLoadingBraze] = useState(false);

  const fileInputRef = useRef(null);

  // Load configs on mount
  useEffect(() => {
    setBrazeEndpoint(localStorage.getItem('braze_endpoint') || 'https://rest.iad-01.braze.com');
    setBrazeApiKey(localStorage.getItem('braze_api_key') || '');
    setGa4MeasurementId(localStorage.getItem('ga4_measurement_id') || '');
    setGa4ApiSecret(localStorage.getItem('ga4_api_secret') || '');
  }, []);


  const handleKeySave = (e) => {
    const value = e.target.value.trim();
    setApiKey(value);
    localStorage.setItem('gemini_api_key', value);
  };

  const handleBrazeEndpointSave = (e) => {
    const value = e.target.value.trim();
    setBrazeEndpoint(value);
    localStorage.setItem('braze_endpoint', value);
  };

  const handleBrazeApiKeySave = (e) => {
    const value = e.target.value.trim();
    setBrazeApiKey(value);
    localStorage.setItem('braze_api_key', value);
  };

  const handleGa4MeasurementIdSave = (e) => {
    const value = e.target.value.trim();
    setGa4MeasurementId(value);
    localStorage.setItem('ga4_measurement_id', value);
  };

  const handleGa4ApiSecretSave = (e) => {
    const value = e.target.value.trim();
    setGa4ApiSecret(value);
    localStorage.setItem('ga4_api_secret', value);
  };


  // Connect & fetch deployed Braze stats
  const handleConnectCampaign = async (e) => {
    e.preventDefault();
    if (!brazeCampaignId.trim()) {
      setBrazeError("Please enter a valid Campaign ID.");
      return;
    }

    setBrazeError('');
    setBrazeSuccess('');
    setLoadingBraze(true);

    try {
      const campaignRecord = await fetchBrazeCampaignStats(
        brazeCampaignId.trim(),
        brazeEndpoint,
        brazeApiKey
      );
      
      // Import into shared campaigns catalog
      onImportCampaigns([campaignRecord]);
      setBrazeSuccess(`Successfully connected and imported metrics for Campaign ID: ${brazeCampaignId}`);
      setBrazeCampaignId('');
    } catch (err) {
      setBrazeError(err.message || "Failed to fetch campaign stats from Braze REST endpoint.");
    } finally {
      setLoadingBraze(false);
    }
  };

  // Drag-and-drop CSV functions
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;
    setCsvError('');
    setCsvSuccess('');

    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      setCsvError("Invalid file type. Please upload a standard CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      try {
        const parsed = parseCsvCampaignLog(text);
        onImportCampaigns(parsed);
        setCsvSuccess(`Successfully imported ${parsed.length} campaign(s) into your catalog workspace!`);
      } catch (err) {
        setCsvError(err.message || "Could not parse campaign log. Check CSV column formatting.");
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. API Credentials Panel */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={16} style={{ color: 'var(--accent-purple)' }} />
          Gemini API Configuration
        </h3>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Configure your Google AI Studio API key to run active campaign performance audits, segment affinity reports, and deliverability diagnostic post-mortems.
        </p>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Gemini API Key</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type={showKey ? 'text' : 'password'}
              className="form-input"
              value={apiKey}
              onChange={handleKeySave}
              placeholder="Paste your API key here (AI Studio)"
              style={{ paddingRight: '45px', fontSize: '0.9rem' }}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Braze Live Connector Panel */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CloudLightning size={16} style={{ color: 'var(--accent-cyan)' }} />
          Connect Live Deployed Braze Campaigns
        </h3>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Link your Braze REST API credentials and enter a Campaign ID to pull live post-deployment open, click, and conversion statistics.
        </p>

        <div className="grid-compact-2col">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Braze REST Endpoint</label>
            <input
              type="text"
              className="form-input"
              value={brazeEndpoint}
              onChange={handleSimulatedWarning => {
                handleBrazeEndpointSave(handleSimulatedWarning);
                setBrazeError('');
              }}
              placeholder="e.g. https://rest.iad-01.braze.com"
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Braze REST API Key</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showBrazeKey ? 'text' : 'password'}
                className="form-input"
                value={brazeApiKey}
                onChange={handleBrazeApiKeySave}
                placeholder="Paste REST API Key"
                style={{ paddingRight: '45px', fontSize: '0.85rem' }}
              />
              <button
                onClick={() => setShowBrazeKey(!showBrazeKey)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showBrazeKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleConnectCampaign} style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <input
              type="text"
              className="form-input"
              value={brazeCampaignId}
              onChange={(e) => setBrazeCampaignId(e.target.value)}
              placeholder="Enter Braze Campaign ID (e.g., 65a2d8f9b1...)"
              style={{ fontSize: '0.85rem' }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loadingBraze}
            style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {loadingBraze ? (
              <RefreshCw size={14} className="spin" />
            ) : (
              <LinkIcon size={14} />
            )}
            Connect Campaign
          </button>
        </form>

        {/* Feedback logs */}
        {brazeError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem',
            backgroundColor: 'rgba(244,63,94,0.08)',
            border: '1px solid rgba(244,63,94,0.15)',
            borderRadius: '8px',
            color: 'var(--error)',
            fontSize: '0.8rem'
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span>{brazeError}</span>
          </div>
        )}

        {brazeSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem',
            backgroundColor: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.15)',
            borderRadius: '8px',
            color: 'var(--success)',
            fontSize: '0.8rem'
          }}>
            <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
            <span>{brazeSuccess}</span>
          </div>
        )}
      </div>

      {/* Google Analytics (GA4) API Integration Panel */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={16} style={{ color: 'var(--accent-primary)' }} />
          Google Analytics (GA4) API Integration
        </h3>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Configure your Google Analytics (GA4) credentials to sync post-click sessions, bounce rates, page load speed diagnostics, and conversion tracking audits.
        </p>

        <div className="grid-compact-2col">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>GA4 Measurement ID</label>
            <input
              type="text"
              className="form-input"
              value={ga4MeasurementId}
              onChange={handleGa4MeasurementIdSave}
              placeholder="e.g. G-XXXXXXXXXX"
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>GA4 API Secret Key</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showGa4Secret ? 'text' : 'password'}
                className="form-input"
                value={ga4ApiSecret}
                onChange={handleGa4ApiSecretSave}
                placeholder="Paste Measurement Protocol Secret"
                style={{ paddingRight: '45px', fontSize: '0.85rem' }}
              />
              <button
                type="button"
                onClick={() => setShowGa4Secret(!showGa4Secret)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showGa4Secret ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Drag & Drop CSV Uploader Panel */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileSpreadsheet size={16} style={{ color: 'var(--success)' }} />
          Import Performance Logs (CSV)
        </h3>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Alternatively, upload standard campaign analytics exports (CSVs) to parse data and populate the clickmaps and dashboard reports.
        </p>

        {/* Drag Drop Area */}
        <div
          className={`drag-uploader ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".csv"
          />
          <Upload size={32} style={{ color: 'var(--accent-purple)', margin: '0 auto 1rem auto' }} />
          <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#fff', marginBottom: '0.25rem' }}>
            Drag and drop your campaign CSV log here
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            or click to browse local files
          </div>
        </div>

        {/* Feedback Messages */}
        {csvError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem',
            backgroundColor: 'rgba(244,63,94,0.08)',
            border: '1px solid rgba(244,63,94,0.15)',
            borderRadius: '8px',
            color: 'var(--error)',
            fontSize: '0.8rem'
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span>{csvError}</span>
          </div>
        )}

        {csvSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem',
            backgroundColor: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.15)',
            borderRadius: '8px',
            color: 'var(--success)',
            fontSize: '0.8rem'
          }}>
            <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
            <span>{csvSuccess}</span>
          </div>
        )}
      </div>

      {/* 4. Danger Zone / Reset Workspace Panel */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)' }}>
          <ShieldAlert size={16} />
          Danger Zone
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Reset your workspace campaigns list back to the default campaign seeds. This will reload the new campaign data structured with Google Analytics stats and clear any imported custom performance logs.
        </p>
        <div>
          <button
            type="button"
            onClick={onResetCampaigns}
            className="btn btn-secondary"
            style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.03)' }}
          >
            Reset Workspace Campaigns
          </button>
        </div>
      </div>

    </div>
  );
}
