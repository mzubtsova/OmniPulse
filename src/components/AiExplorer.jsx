import React, { useState } from 'react';
import { Search, Sparkles, Terminal, Copy, Check, CornerDownRight, Database, RefreshCw } from 'lucide-react';
import { queryCampaignDataWithAi } from '../services/gemini';

export default function AiExplorer({ campaign, apiKey }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleQuerySubmit = async (e, customQuery) => {
    if (e) e.preventDefault();
    const activeQuery = customQuery || query;
    if (!activeQuery.trim()) return;

    setQuery(activeQuery);
    setLoading(true);
    setResults(null);

    try {
      const outcome = await queryCampaignDataWithAi(activeQuery.trim(), campaign, apiKey);
      setResults(outcome);
    } catch (err) {
      setResults({
        sql: "-- SQL Generation Error",
        resultHeaders: ["Status"],
        resultRows: [["Failed to execute NLP query. Check API configurations."]],
        insight: "We could not resolve this query. Please check your Gemini connection key status."
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!results?.sql) return;
    navigator.clipboard.writeText(results.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const PRESET_QUERIES = [
    { label: "Compare Variant open/click rates", text: "Compare click and open rates across my subject line variants." },
    { label: "Audit Liquid segment conversions", text: "Show triggered volume, clicks and conversion rates across my dynamic Liquid branches." },
    { label: "Deliverability by inbox client", text: "Check open rates and sent volume grouped by email client provider." }
  ];

  // Defensive array checks to prevent React render crashes (black screens)
  const headers = results && Array.isArray(results.resultHeaders) ? results.resultHeaders : [];
  const rows = results && Array.isArray(results.resultRows) ? results.resultRows : [];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Search Bar & presets */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>AI SQL Data Explorer</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Ask questions in plain English to automatically generate SQL database queries and run visual metrics audits on your campaigns.
          </p>
        </div>

        <form onSubmit={(e) => handleQuerySubmit(e)} className="nlp-form">
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question (e.g. 'Compare conversion rates across dynamic segments')"
              style={{ paddingLeft: '38px', fontSize: '0.9rem' }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
          >
            {loading ? (
              <RefreshCw size={14} className="spin" />
            ) : (
              <Sparkles size={14} />
            )}
            Run Query
          </button>
        </form>

        {/* Preset suggestions */}
        <div style={{ display: 'flex', gap: '0.50rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Quick Templates:</span>
          {PRESET_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={(e) => handleQuerySubmit(e, q.text)}
              className="btn btn-secondary"
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.65rem',
                cursor: 'pointer'
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '3rem', textAlign: 'center' }}>
          <RefreshCw size={32} className="spin" style={{ color: 'var(--accent-primary)', margin: '0 auto' }} />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>AI is scanning database schema and generating metrics ledger...</span>
        </div>
      )}

      {/* Query Results */}
      {results && !loading && (
        <div className="split-view">
          
          {/* Left Side: Generated SQL query */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Terminal size={14} style={{ color: 'var(--accent-secondary)' }} />
                AI Translated SQL Query
              </h4>
              <button
                onClick={copyToClipboard}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {copied ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy SQL"}
              </button>
            </div>

            <pre style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              padding: '1.25rem',
              color: 'var(--accent-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              lineHeight: '1.5',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap'
            }}>{results.sql || '-- No SQL query generated.'}</pre>
            
            <div style={{ display: 'flex', gap: '0.6rem', padding: '0.85rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', marginTop: 'auto' }}>
              <Database size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Query targeted against live event logs tracking schema (Snowflake/Currents events ledger).
              </p>
            </div>
          </div>

          {/* Right Side: Tabular results and insights */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CornerDownRight size={14} style={{ color: 'var(--success)' }} />
              Computed Ledger Results
            </h4>

            <div style={{ overflowX: 'auto' }}>
              <table className="audit-table">
                <thead>
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i}>{String(h)}</th>
                    ))}
                    {headers.length === 0 && <th>Results</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIdx) => {
                    // Safe parsing: if row is not an array, convert to array representation
                    const cells = Array.isArray(row)
                      ? row
                      : typeof row === 'object' && row !== null
                        ? Object.values(row)
                        : [row];

                    return (
                      <tr key={rowIdx}>
                        {cells.map((cell, cellIdx) => (
                          <td 
                            key={cellIdx} 
                            style={{ 
                              fontWeight: cellIdx === 0 ? '600' : '500', 
                              color: cellIdx === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' 
                            }}
                          >
                            {cell !== null && cell !== undefined ? String(cell) : ''}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
                        No records returned.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* AI Insight explanation */}
            {results.insight && (
              <div style={{
                marginTop: 'auto',
                padding: '0.85rem',
                backgroundColor: 'rgba(16, 185, 129, 0.03)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: 'var(--text-primary)',
                lineHeight: '1.4',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <Sparkles size={12} />
                  AI Analyst Insight:
                </div>
                <div>{results.insight}</div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
