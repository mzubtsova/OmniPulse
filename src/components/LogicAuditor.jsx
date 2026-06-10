import React from 'react';
import { ShieldCheck, HelpCircle, Layers, AlertCircle } from 'lucide-react';

export default function LogicAuditor({ campaign }) {
  const getBadgeStyle = (ctr) => {
    if (ctr >= 15) return { bg: 'rgba(16, 185, 129, 0.12)', text: 'var(--success)', label: 'High Yield' };
    if (ctr >= 5) return { bg: 'rgba(6, 182, 212, 0.12)', text: 'var(--accent-cyan)', label: 'Stable Yield' };
    return { bg: 'rgba(244, 63, 94, 0.12)', text: 'var(--error)', label: 'Underperforming' };
  };

  return (
    <div className="panel fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Liquid Logic Branch Auditor</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Evaluate the conversion efficacy of dynamic logic tags and conditional code blocks.
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="audit-table">
          <thead>
            <tr>
              <th>Branch / Segment Condition</th>
              <th style={{ textAlign: 'right' }}>Trigger Volume</th>
              <th style={{ textAlign: 'right' }}>Unique Clicks (CTR)</th>
              <th style={{ textAlign: 'right' }}>Conversions (CVR)</th>
              <th style={{ textAlign: 'center' }}>Efficacy Status</th>
            </tr>
          </thead>
          <tbody>
            {campaign.branches && campaign.branches.length > 0 ? (
              campaign.branches.map((branch, idx) => {
                const badge = getBadgeStyle(branch.ctr);
                return (
                  <tr key={idx}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{branch.name}</div>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.2rem',
                        backgroundColor: 'rgba(255,255,255,0.01)',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        {branch.expression}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>
                      {branch.triggered.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700' }}>{branch.clicks.toLocaleString()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{branch.ctr}%</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700' }}>{branch.conversions.toLocaleString()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{branch.cvr}%</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: badge.bg,
                        color: badge.text,
                        textTransform: 'uppercase'
                      }}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                  No Liquid branches mapped for this campaign type.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.25rem',
        marginTop: '1rem',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
          <Layers size={16} style={{ color: 'var(--accent-purple)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff', marginBottom: '0.25rem' }}>AST-less Logical Attribution</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              OmniPulse monitors user clicks and links them directly to the active conditional parameters running inside their specific template render context.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff', marginBottom: '0.25rem' }}>Personalization Lift Detection</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Underperforming segments highlight opportunities to update dynamic fallback values or split cohorts into dedicated A/B testing tracks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
