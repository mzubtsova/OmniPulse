import React, { useState, useEffect } from 'react';
import { Mail, AlertTriangle, ShieldCheck, RefreshCw, Sparkles } from 'lucide-react';
import { generateAnomalyExplanation } from '../services/gemini';

export default function Deliverability({ campaign, apiKey }) {
  const [anomalyInsights, setAnomalyInsights] = useState({});
  const [loadingInsight, setLoadingInsight] = useState(null);

  // Clear anomaly insights when campaign changes
  useEffect(() => {
    setAnomalyInsights({});
    setLoadingInsight(null);
  }, [campaign.id]);

  const overallRate = campaign.sent > 0 ? parseFloat(((campaign.opens / campaign.sent) * 100).toFixed(1)) : 0;

  const handleExplainAnomaly = async (clientKey, clientName, rate) => {
    setLoadingInsight(clientKey);
    try {
      const insight = await generateAnomalyExplanation(clientName, rate, overallRate, apiKey);
      setAnomalyInsights(prev => ({ ...prev, [clientKey]: insight }));
    } catch {
      setAnomalyInsights(prev => ({
        ...prev,
        [clientKey]: "Could not generate anomaly report. Check settings API key status."
      }));
    } finally {
      setLoadingInsight(null);
    }
  };

  return (
    <div className="panel fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Deliverability Anomalies Radar</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Monitor inbox placement rates across email clients and device environments.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {campaign.deliverability ? (
          Object.entries(campaign.deliverability).map(([key, client]) => {
            const dev = parseFloat((client.rate - overallRate).toFixed(1));
            const isAnomaly = dev <= -4.0; // flag if open rate is 4%+ lower than average
            const hasInsight = anomalyInsights[key];
            
            return (
              <div
                key={key}
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--border-radius-md)',
                  border: `1px solid ${isAnomaly ? 'rgba(244,63,94,0.2)' : 'var(--border-color)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isAnomaly ? 'var(--error)' : 'var(--accent-cyan)'
                    }}>
                      <Mail size={14} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                        {key === 'ios' ? 'iOS Mail app' : key === 'android' ? 'Android Mail Client' : `${key} Client`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Volume: {client.total.toLocaleString()} sent ({client.opens.toLocaleString()} opens)
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Open Rate</div>
                      <div style={{ fontWeight: '700', fontSize: '1rem', color: isAnomaly ? 'var(--error)' : '#fff' }}>
                        {client.rate}%
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Deviation</div>
                      <div style={{ fontWeight: '700', fontSize: '1rem', color: dev < 0 ? 'var(--error)' : 'var(--success)' }}>
                        {dev > 0 ? `+${dev}` : dev}%
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isAnomaly ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          backgroundColor: 'rgba(244, 63, 94, 0.12)',
                          color: 'var(--error)'
                        }}>
                          <AlertTriangle size={12} /> Anomaly
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          color: 'var(--success)'
                        }}>
                          <ShieldCheck size={12} /> Normal
                        </span>
                      )}

                      {isAnomaly && !hasInsight && (
                        <button
                          onClick={() => handleExplainAnomaly(key, key.toUpperCase(), client.rate)}
                          className="btn btn-primary"
                          disabled={loadingInsight === key}
                          style={{
                            padding: '0.3rem 0.75rem',
                            fontSize: '0.75rem',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          {loadingInsight === key ? (
                            <RefreshCw size={12} className="spin" />
                          ) : (
                            <Sparkles size={12} />
                          )}
                          Explain Anomaly
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Explanation Text */}
                {hasInsight && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.85rem',
                    backgroundColor: 'rgba(139, 92, 246, 0.03)',
                    border: '1px solid rgba(139, 92, 246, 0.15)',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)',
                    lineHeight: '1.4',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-purple)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <Sparkles size={12} />
                      AI Diagnosis Insight:
                    </div>
                    <div>{hasInsight}</div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
            No deliverability metrics available for this campaign type.
          </div>
        )}
      </div>
    </div>
  );
}
