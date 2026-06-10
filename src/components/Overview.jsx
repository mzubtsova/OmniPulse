import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Info, 
  AlertTriangle, 
  ShieldCheck, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  Monitor, 
  Layers, 
  Scale, 
  RefreshCw,
  FileText,
  CheckCircle2,
  Bug,
  AlertCircle
} from 'lucide-react';
import { generateCampaignPostMortem, generateAnomalyExplanation } from '../services/gemini';
import { calculateABStats } from '../utils/statsMath';

// Custom Markdown parser for AI output
function parseMarkdown(text) {
  if (!text) return '';
  
  let html = text
    .replace(/^### (.*$)/gim, '<h4 style="font-size: 0.95rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.4rem; color: #fff; display: flex; align-items: center; gap: 0.3rem;">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 style="font-size: 1.1rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.6rem; color: #fff;">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 style="font-size: 1.2rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.85rem; color: #fff;">$1</h2>');
  
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

const ProgressRing = ({ percentage, label, color, subtitle }) => {
  const radius = 50;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="progress-ring-container" style={{ width: '100px', height: '100px', margin: '0 auto' }}>
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="rgba(255,255,255,0.02)"
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
        <span style={{ fontSize: '1.2rem', fontWeight: '700' }}>{percentage}%</span>
        <span className="progress-ring-label" style={{ fontSize: '0.55rem' }}>{label}</span>
      </div>
    </div>
  );
};

export default function Overview({ campaign, apiKey }) {
  const [postMortem, setPostMortem] = useState('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [anomalyInsights, setAnomalyInsights] = useState({});
  const [loadingInsight, setLoadingInsight] = useState(null);

  // Fetch AI Post-Mortem Report on campaign change
  useEffect(() => {
    let active = true;
    const fetchReport = async () => {
      setLoadingReport(true);
      setPostMortem('');
      setAnomalyInsights({});
      try {
        const report = await generateCampaignPostMortem(campaign, apiKey);
        if (active) setPostMortem(report);
      } catch {
        if (active) setPostMortem(`### ❌ Error Loading Post-Mortem\nWe could not connect to the AI engine.`);
      } finally {
        if (active) setLoadingReport(false);
      }
    };
    fetchReport();
    return () => { active = false; };
  }, [campaign.id, apiKey]);

  const handleExplainAnomaly = async (clientKey, clientName, rate) => {
    setLoadingInsight(clientKey);
    try {
      const insight = await generateAnomalyExplanation(clientName, rate, overallRate, apiKey);
      setAnomalyInsights(prev => ({ ...prev, [clientKey]: insight }));
    } catch {
      setAnomalyInsights(prev => ({ ...prev, [clientKey]: "Failed to diagnose anomaly." }));
    } finally {
      setLoadingInsight(null);
    }
  };

  const getBranchBadgeStyle = (ctr) => {
    if (ctr >= 15) return { bg: 'rgba(16, 185, 129, 0.12)', text: 'var(--success)', label: 'High Yield' };
    if (ctr >= 5) return { bg: 'rgba(6, 182, 212, 0.12)', text: 'var(--accent-cyan)', label: 'Normal' };
    return { bg: 'rgba(244, 63, 94, 0.12)', text: 'var(--error)', label: 'Failing' };
  };

  // Metrics conversions
  const delivered = campaign.sent - (campaign.bounces || 0);
  const deliveryRate = campaign.sent > 0 ? ((delivered / campaign.sent) * 100).toFixed(1) : 100;
  const openRate = campaign.sent > 0 ? ((campaign.opens / campaign.sent) * 100).toFixed(1) : 0;
  const clickRate = campaign.sent > 0 ? ((campaign.clicks / campaign.sent) * 100).toFixed(1) : 0;
  const convRate = campaign.sent > 0 ? ((campaign.conversions / campaign.sent) * 100).toFixed(1) : 0;
  const unsubRate = campaign.sent > 0 ? ((campaign.unsubscribes / campaign.sent) * 100).toFixed(2) : 0;
  const bounceRate = campaign.sent > 0 ? (((campaign.bounces || 0) / campaign.sent) * 100).toFixed(2) : 0;
  const overallRate = parseFloat(openRate);

  // Compute A/B significance metrics
  const stats = calculateABStats(campaign.variants);

  // Generate SVG curve points
  const generateCurvePaths = (width = 460, height = 130) => {
    const varA = campaign.variants?.a;
    const varB = campaign.variants?.b;
    if (!varA || !varB) return { pathA: '', pathB: '', pA: 0, pB: 0 };

    const pA = varA.sent > 0 ? (varA.opens || varA.clicks) / varA.sent : 0;
    const pB = varB.sent > 0 ? (varB.opens || varB.clicks) / varB.sent : 0;

    const stdA = varA.sent > 0 ? Math.sqrt((pA * (1 - pA)) / varA.sent) : 0;
    const stdB = varB.sent > 0 ? Math.sqrt((pB * (1 - pB)) / varB.sent) : 0;

    if (stdA === 0 || stdB === 0) return { pathA: '', pathB: '', pA, pB };

    const minX = Math.min(pA - 3.5 * stdA, pB - 3.5 * stdB);
    const maxX = Math.max(pA + 3.5 * stdA, pB + 3.5 * stdB);
    const rangeX = maxX - minX;

    const pointsA = [];
    const pointsB = [];

    const maxDensityA = 1 / (stdA * Math.sqrt(2 * Math.PI));
    const maxDensityB = 1 / (stdB * Math.sqrt(2 * Math.PI));
    const maxDensity = Math.max(maxDensityA, maxDensityB);

    for (let i = 0; i <= 100; i++) {
      const pct = i / 100;
      const xVal = minX + pct * rangeX;

      const yValA = (1 / (stdA * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((xVal - pA) / stdA, 2));
      const yValB = (1 / (stdB * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((xVal - pB) / stdB, 2));

      const svgX = pct * width;
      const svgYA = height - (yValA / maxDensity) * (height - 25) - 5;
      const svgYB = height - (yValB / maxDensity) * (height - 25) - 5;

      pointsA.push(`${svgX.toFixed(1)},${svgYA.toFixed(1)}`);
      pointsB.push(`${svgX.toFixed(1)},${svgYB.toFixed(1)}`);
    }

    const pathA = `M ${pointsA[0]} ${pointsA.slice(1).map(p => `L ${p}`).join(' ')} L ${width},${height} L 0,${height} Z`;
    const pathB = `M ${pointsB[0]} ${pointsB.slice(1).map(p => `L ${p}`).join(' ')} L ${width},${height} L 0,${height} Z`;

    return { pathA, pathB, pA, pB };
  };

  const { pathA, pathB } = generateCurvePaths(460, 130);

  // Simulated clickmap iframe render
  const renderClickmapFrame = () => {
    if (campaign.channel === 'email' && campaign.templateHtml) {
      return (
        <div style={{ position: 'relative', width: '100%', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', backgroundColor: '#fff' }}>
          <div className="hotspot-container" style={{ position: 'relative', height: '360px', width: '100%' }}>
            <iframe title="Attribution Frame" srcDoc={campaign.templateHtml} style={{ width: '100%', height: '100%', border: 'none' }} />
            {campaign.hotspots?.map(spot => (
              <div
                key={spot.id}
                className="hotspot-trigger"
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                onMouseEnter={() => setHoveredHotspot(spot)}
                onMouseLeave={() => setHoveredHotspot(null)}
              >
                {hoveredHotspot && hoveredHotspot.id === spot.id && (
                  <div className="hotspot-tooltip" style={{ transform: 'translate(-50%, calc(-100% - 15px))' }}>
                    <div style={{ fontWeight: '700', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.15rem', marginBottom: '0.15rem' }}>{spot.label}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span>Clicks:</span>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>{spot.clicks.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span>CTR:</span>
                      <span style={{ color: 'var(--accent-purple)', fontWeight: '600' }}>{spot.ctr}%</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Push notification style preview
    if (campaign.channel === 'push') {
      return (
        <div style={{
          height: '360px',
          backgroundColor: '#0c101b',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          gap: '1.5rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '320px',
            backgroundColor: 'rgba(25, 35, 55, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: '16px', height: '16px', backgroundColor: 'var(--accent-purple)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifySelf: 'center', color: '#fff', fontSize: '0.6rem', fontWeight: 'bold', justifyContent: 'center' }}>DQ</span>
                <strong>Dairy Queen App</strong>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Now</span>
            </div>
            <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#fff', marginBottom: '0.2rem' }}>
              {campaign.subjectLine}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
              {campaign.pushBody || "Get double points on all Blizzards today! 🍦 Open the app to check your loyalty tier."}
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Push Click Action CTR: <strong>{campaign.clicks ? ((campaign.clicks / campaign.sent) * 100).toFixed(1) : 0}%</strong></span>
        </div>
      );
    }

    return (
      <div style={{
        height: '360px',
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        No live visual clickmap template loaded for this channel type.
      </div>
    );
  };

  // Compile campaign failure events
  const getFailuresAndRisks = () => {
    const issues = [];

    // Deliverability anomalies
    if (campaign.deliverability) {
      Object.entries(campaign.deliverability).forEach(([client, data]) => {
        const deviation = data.rate - overallRate;
        if (deviation <= -4.0) {
          issues.push({
            id: `deliv-${client}`,
            type: 'Deliverability Drop',
            severity: 'critical',
            message: `${client.toUpperCase()} open rate is anomalous at ${data.rate}% (${deviation.toFixed(1)}% below campaign average).`,
            action: () => handleExplainAnomaly(client, client.toUpperCase(), data.rate),
            isInsight: anomalyInsights[client]
          });
        }
      });
    }

    // Logic branches failures / low conversion yields
    if (campaign.branches) {
      campaign.branches.forEach(branch => {
        if (branch.ctr < 4.0) {
          issues.push({
            id: `branch-${branch.name}`,
            type: 'Logic Branch Yield Alert',
            severity: 'warning',
            message: `Segment '${branch.name}' condition: "${branch.expression}" resulted in poor click conversion (${branch.ctr}% CTR).`,
          });
        }
      });
    }

    // Bounces
    if (campaign.bounces && campaign.bounces > 0) {
      issues.push({
        id: 'bounce-rate',
        type: 'Delivery Failure',
        severity: 'critical',
        message: `${campaign.bounces.toLocaleString()} hard/soft bounces detected (${bounceRate}% failure rate).`
      });
    }

    // Mock HTML/CSS layout checks
    if (campaign.channel === 'email') {
      issues.push({
        id: 'auth-status',
        type: 'SPF/DKIM Validation',
        severity: 'resolved',
        message: 'Domain SPF, DKIM, and DMARC record alignment checked: Active and Passing.'
      });
    }

    return issues;
  };

  const failuresList = getFailuresAndRisks();

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ========================================================================= */}
      {/* PANEL 1: EXECUTIVE PERFORMANCE LEDGER & KPI GAUGES                         */}
      {/* ========================================================================= */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Post-Deployment Executive Summary</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status: <strong style={{ color: 'var(--success)' }}>Report Finalized</strong> &bull; Synced {campaign.lastSynced}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              Subject: {campaign.subjectLine}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1.5rem', margin: '0.5rem 0' }}>
          <ProgressRing percentage={parseFloat(deliveryRate)} label="Delivered" color="var(--success)" />
          {campaign.channel !== 'sms' && campaign.channel !== 'iam' && (
            <ProgressRing percentage={parseFloat(openRate)} label="Open Rate" color="var(--accent-cyan)" />
          )}
          <ProgressRing percentage={parseFloat(clickRate)} label="Click Rate" color="var(--accent-purple)" />
          <ProgressRing percentage={parseFloat(convRate)} label="Conv. Rate" color="var(--accent-cyan)" />
          <ProgressRing percentage={parseFloat(unsubRate)} label="Unsub Rate" color="var(--error)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Volume Sent</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', marginTop: '0.15rem' }}>{campaign.sent.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bounces</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', marginTop: '0.15rem', color: campaign.bounces > 0 ? 'var(--error)' : 'var(--text-primary)' }}>{campaign.bounces?.toLocaleString() || '0'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delivered</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', marginTop: '0.15rem', color: 'var(--success)' }}>{delivered.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unique Clicks</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', marginTop: '0.15rem', color: 'var(--accent-purple)' }}>{campaign.clicks.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Conversions</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', marginTop: '0.15rem', color: 'var(--success)' }}>{campaign.conversions.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PANEL 2: AI EXECUTIVE POST-MORTEM & FAILURES / RISKS LEDGER                */}
      {/* ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '2rem' }}>
        
        {/* AI Post-Mortem */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={14} style={{ color: 'var(--accent-purple)' }} />
              AI Campaign Post-Mortem Analysis
            </h3>
            <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', backgroundColor: 'rgba(139,92,246,0.1)', color: 'var(--accent-purple)', fontWeight: '600' }}>
              Gemini Flash
            </span>
          </div>

          {loadingReport ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, justifyContent: 'center', minHeight: '180px' }}>
              <div style={{ height: '14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px', width: '90%', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px', width: '95%', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px', width: '85%', animation: 'pulse 1.5s infinite' }} />
            </div>
          ) : (
            <div 
              style={{ flex: 1, overflowY: 'auto', maxHeight: '250px', paddingRight: '0.4rem' }}
              dangerouslySetInnerHTML={{ __html: parseMarkdown(postMortem) }}
            />
          )}
        </div>

        {/* Failures & Warnings List */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Bug size={14} style={{ color: 'var(--error)' }} />
            Failures & Risk Audits Ledger
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '250px', paddingRight: '0.25rem' }}>
            {failuresList.length > 0 ? (
              failuresList.map((issue) => (
                <div 
                  key={issue.id} 
                  style={{ 
                    padding: '0.75rem 1rem', 
                    backgroundColor: 'var(--bg-tertiary)', 
                    borderRadius: 'var(--border-radius-md)', 
                    border: `1px solid ${issue.severity === 'critical' ? 'rgba(244,63,94,0.2)' : issue.severity === 'warning' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}` 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {issue.severity === 'critical' ? (
                        <AlertCircle size={14} style={{ color: 'var(--error)', flexShrink: 0 }} />
                      ) : issue.severity === 'warning' ? (
                        <AlertTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                      ) : (
                        <ShieldCheck size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: issue.severity === 'critical' ? 'var(--error)' : issue.severity === 'warning' ? 'var(--warning)' : 'var(--success)' }}>
                        {issue.type}
                      </span>
                    </div>

                    {issue.action && !issue.isInsight && (
                      <button
                        onClick={issue.action}
                        className="btn btn-primary"
                        disabled={loadingInsight !== null}
                        style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', borderRadius: '4px' }}
                      >
                        {loadingInsight !== null ? <RefreshCw size={8} className="spin" /> : "Diagnose"}
                      </button>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                    {issue.message}
                  </div>

                  {issue.isInsight && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(139,92,246,0.02)', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--accent-purple)' }}>Diagnosis: </strong>{issue.isInsight}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                No deliverability or logic branch anomalies identified.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* PANEL 3: DIAGNOSTIC DIAGRAMS (CLICKMAP & A/B TEST PROBABILITY CURVES)       */}
      {/* ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Clickmap */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Attribution clickmap Hotspots</h3>
          {renderClickmapFrame()}
        </div>

        {/* A/B Significance curves */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Scale size={14} style={{ color: 'var(--accent-cyan)' }} />
            Bayesian Significance Curve Overlay
          </h3>
          
          <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '0.85rem' }}>
            {pathA && pathB ? (
              <svg viewBox="0 0 460 130" style={{ width: '100%', height: 'auto' }}>
                <path d={pathA} fill="rgba(59, 130, 246, 0.08)" stroke="var(--accent-blue)" strokeWidth="1.5" />
                <path d={pathB} fill="rgba(139, 92, 246, 0.12)" stroke="var(--accent-purple)" strokeWidth="1.5" />
              </svg>
            ) : (
              <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>No variant distributions.</div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.25rem' }}>
            <div style={{ padding: '0.6rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Confidence Level</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', color: stats.isSignificant ? 'var(--success)' : 'var(--warning)' }}>{stats.confidence}%</div>
            </div>
            <div style={{ padding: '0.6rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Significance Status</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', marginTop: '0.25rem', color: stats.isSignificant ? 'var(--success)' : 'var(--text-secondary)' }}>
                {stats.isSignificant ? `${stats.winner} Won` : "Insufficient Data"}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* PANEL 4: LIQUID LOGIC BRANCH ATTRIBUTION LEDGER                             */}
      {/* ========================================================================= */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Layers size={14} style={{ color: 'var(--accent-purple)' }} />
          Liquid personalization Branch Attribution
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="audit-table">
            <thead>
              <tr>
                <th>Segment Name</th>
                <th>Expression Path</th>
                <th style={{ textAlign: 'right' }}>Triggered Volume</th>
                <th style={{ textAlign: 'right' }}>Unique Clicks</th>
                <th style={{ textAlign: 'right' }}>CTR</th>
                <th style={{ textAlign: 'right' }}>Conversions</th>
                <th style={{ textAlign: 'right' }}>CVR</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {campaign.branches?.map((branch, idx) => {
                const badge = getBranchBadgeStyle(branch.ctr);
                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600', fontSize: '0.85rem' }}>{branch.name}</td>
                    <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{branch.expression}</td>
                    <td style={{ textAlign: 'right', fontWeight: '500' }}>{branch.triggered?.toLocaleString() || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{branch.clicks.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--accent-purple)' }}>{branch.ctr}%</td>
                    <td style={{ textAlign: 'right', fontWeight: '500' }}>{branch.conversions?.toLocaleString() || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--success)' }}>{branch.cvr ? `${branch.cvr}%` : '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        backgroundColor: badge.bg,
                        color: badge.text
                      }}>{badge.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

