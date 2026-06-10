import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, CheckCircle2, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { generateCampaignPostMortem } from '../services/gemini';

// Custom mini Markdown parser to render AI output beautifully
function parseMarkdown(text) {
  if (!text) return '';
  
  // Replace headers
  let html = text
    .replace(/^### (.*$)/gim, '<h4 style="font-size: 1rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #fff; display: flex; align-items: center; gap: 0.4rem;">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 style="font-size: 1.15rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #fff;">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 style="font-size: 1.3rem; font-weight: 700; margin-top: 1.75rem; margin-bottom: 1rem; color: #fff;">$1</h2>');
  
  // Replace bold tags
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace list items
  html = html.replace(/^\* (.*$)/gim, '<li style="margin-left: 1.25rem; margin-bottom: 0.4rem; list-style-type: square; color: var(--text-primary);">$1</li>');
  
  // Wrap li items in ul
  // A simple regex wrap for lists
  html = html.replace(/((?:<li.*?>.*?<\/li>\s*)+)/g, '<ul style="margin-bottom: 1rem;">$1</ul>');
  
  // Replace paragraphs
  html = html.split('\n\n').map(p => {
    if (p.trim().startsWith('<h') || p.trim().startsWith('<ul') || p.trim().startsWith('<li')) {
      return p;
    }
    return `<p style="margin-bottom: 0.85rem; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">${p}</p>`;
  }).join('\n');

  return html;
}

const ProgressRing = ({ percentage, label, color }) => {
  const radius = 60;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="progress-ring-container">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="rgba(255,255,255,0.03)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="progress-ring-circle"
          strokeLinecap="round"
        />
      </svg>
      <div className="progress-ring-text">
        <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>{percentage}%</span>
        <span className="progress-ring-label">{label}</span>
      </div>
    </div>
  );
};

export default function Overview({ campaign, apiKey }) {
  const [postMortem, setPostMortem] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchReport = async () => {
      setLoading(true);
      setPostMortem('');
      try {
        const report = await generateCampaignPostMortem(campaign, apiKey);
        if (active) {
          setPostMortem(report);
        }
      } catch (err) {
        if (active) {
          setPostMortem(`### ❌ Error Loading Post-Mortem\nWe could not connect to the AI analysis engine. If you are using Live API mode, check your Gemini API key in the settings panel.`);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    
    fetchReport();
    return () => {
      active = false;
    };
  }, [campaign.id, apiKey]);

  const openRate = campaign.sent > 0 ? ((campaign.opens / campaign.sent) * 100).toFixed(1) : 0;
  const clickRate = campaign.sent > 0 ? ((campaign.clicks / campaign.sent) * 100).toFixed(1) : 0;
  const convRate = campaign.sent > 0 ? ((campaign.conversions / campaign.sent) * 100).toFixed(1) : 0;
  const unsubRate = campaign.sent > 0 ? ((campaign.unsubscribes / campaign.sent) * 100).toFixed(2) : 0;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Visual Metric Gauges */}
      <div className="panel" style={{ padding: '2rem 1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          Campaign Engagement Pulse
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          {campaign.channel !== 'sms' && campaign.channel !== 'iam' && (
            <ProgressRing percentage={parseFloat(openRate)} label="Open Rate" color="var(--accent-cyan)" />
          )}
          <ProgressRing percentage={parseFloat(clickRate)} label="Click Rate" color="var(--accent-purple)" />
          <ProgressRing percentage={parseFloat(convRate)} label="Conv. Rate" color="var(--success)" />
          <ProgressRing percentage={parseFloat(unsubRate)} label="Unsub Rate" color="var(--error)" />
        </div>
      </div>

      {/* Grid splits: Stats grid & AI summary */}
      <div className="split-view">
        
        {/* Left column: Raw metrics & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="panel" style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1.25rem' }}>Campaign Performance Ledger</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Volume Sent</div>
                <div style={{ fontSize: '1.35rem', fontWeight: '700', marginTop: '0.25rem' }}>{campaign.sent.toLocaleString()}</div>
              </div>
              
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unique Opens</div>
                <div style={{ fontSize: '1.35rem', fontWeight: '700', marginTop: '0.25rem', color: 'var(--accent-cyan)' }}>
                  {campaign.channel === 'sms' || campaign.channel === 'iam' ? 'N/A' : campaign.opens.toLocaleString()}
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unique Clicks</div>
                <div style={{ fontSize: '1.35rem', fontWeight: '700', marginTop: '0.25rem', color: 'var(--accent-purple)' }}>{campaign.clicks.toLocaleString()}</div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Conversions</div>
                <div style={{ fontSize: '1.35rem', fontWeight: '700', marginTop: '0.25rem', color: 'var(--success)' }}>{campaign.conversions.toLocaleString()}</div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unsubscribed</div>
                <div style={{ fontSize: '1.35rem', fontWeight: '700', marginTop: '0.25rem', color: 'var(--error)' }}>{campaign.unsubscribes.toLocaleString()}</div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bounce/Failures</div>
                <div style={{ fontSize: '1.35rem', fontWeight: '700', marginTop: '0.25rem' }}>{campaign.bounces.toLocaleString()}</div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right column: AI Post-Mortem Report */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} style={{ color: 'var(--accent-purple)' }} />
              AI Campaign Post-Mortem
            </h3>
            <span style={{
              fontSize: '0.7rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(139, 92, 246, 0.12)',
              color: 'var(--accent-purple)',
              fontWeight: '600'
            }}>
              Powered by Gemini
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center', minHeight: '200px' }}>
              {/* Skeleton loading animation */}
              <div style={{ height: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px', width: '100%', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px', width: '90%', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px', width: '95%', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px', width: '60%', animation: 'pulse 1.5s infinite' }} />
            </div>
          ) : (
            <div 
              style={{ flex: 1, overflowY: 'auto', maxHeight: '350px', paddingRight: '0.5rem' }}
              dangerouslySetInnerHTML={{ __html: parseMarkdown(postMortem) }}
            />
          )}
        </div>

      </div>
    </div>
  );
}
