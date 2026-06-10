import React, { useState, useRef } from 'react';
import { Settings as SettingsIcon, ShieldAlert, Key, FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { parseCsvCampaignLog } from '../services/dataStore';

export default function Settings({ apiKey, setApiKey, onImportCampaigns }) {
  const [showKey, setShowKey] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [csvError, setCsvError] = useState('');
  const [csvSuccess, setCsvSuccess] = useState('');
  
  const fileInputRef = useRef(null);

  const handleKeySave = (e) => {
    const value = e.target.value.trim();
    setApiKey(value);
    localStorage.setItem('gemini_api_key', value);
  };

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

        <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
          <ShieldAlert size={16} style={{ color: 'var(--accent-purple)', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            <strong>Local & Secure:</strong> Your API key is stored locally inside your browser's private `localStorage` cache. It never leaves your machine or passes through third-party servers.
          </p>
        </div>
      </div>

      {/* 2. Drag & Drop CSV Uploader Panel */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileSpreadsheet size={16} style={{ color: 'var(--success)' }} />
          Import Performance Logs
        </h3>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Upload standard campaign analytics exports (CSVs) to parse data and populate the clickmaps, branches, and anomalies dashboards.
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

        {/* Sample File Reference Card */}
        <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '0.82rem', fontWeight: '600', color: '#fff', marginBottom: '0.5rem' }}>Expected CSV Columns:</h4>
          <code style={{
            display: 'block',
            backgroundColor: 'rgba(0,0,0,0.2)',
            padding: '0.5rem',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--accent-cyan)',
            wordBreak: 'break-all'
          }}>
            name,channel,sent,opens,clicks,conversions,subject[,unsubscribes,bounces]
          </code>
        </div>

      </div>
    </div>
  );
}
