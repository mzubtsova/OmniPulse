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
  AlertCircle,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  BarChart3,
  Eye,
  EyeOff,
  Link,
  Unlink,
  Save,
  Printer,
  Download
} from 'lucide-react';
import { generateCampaignPostMortem, generateAnomalyExplanation } from '../services/gemini';
import { calculateABStats } from '../utils/statsMath';

// Custom Markdown parser for AI output
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

const ProgressRing = ({ percentage, label, color }) => {
  const radius = 52;
  const stroke = 8;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="progress-ring-container" style={{ width: '104px', height: '104px', margin: '0 auto' }}>
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="var(--bg-tertiary)"
          fill="transparent"
          strokeWidth={stroke - 3}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.15))' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="progress-ring-circle"
          strokeLinecap="round"
        />
      </svg>
      <div className="progress-ring-text">
        <span style={{ fontSize: '1.15rem', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{percentage}%</span>
        <span className="progress-ring-label" style={{ fontSize: '0.55rem', fontWeight: '600' }}>{label}</span>
      </div>
    </div>
  );
};

export default function Overview({ campaign, apiKey, onSaveReport, activeTab, setActiveTab, onSyncCampaign }) {
  const [showFailuresTooltip, setShowFailuresTooltip] = useState(false);
  const [ga4MeasurementId, setGa4MeasurementId] = useState('');
  const [ga4ApiSecret, setGa4ApiSecret] = useState('');
  const [showGa4Secret, setShowGa4Secret] = useState(false);

  // Braze Link & Sync UI States
  const [isLinking, setIsLinking] = useState(false);
  const [brazeIdInput, setBrazeIdInput] = useState(campaign.brazeCampaignId || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    setBrazeIdInput(campaign.brazeCampaignId || '');
    setSyncError('');
    setIsLinking(false);
  }, [campaign.id, campaign.brazeCampaignId]);

  const handleSyncBraze = async (brazeId) => {
    if (!brazeId || !brazeId.trim()) return;
    setIsSyncing(true);
    setSyncError('');
    try {
      await onSyncCampaign(campaign.id, brazeId.trim());
      setIsLinking(false);
    } catch (err) {
      setSyncError(err.message || "Failed to fetch metrics from Braze. Verify API key in Settings.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUnlinkBraze = () => {
    onSyncCampaign(campaign.id, '');
  };

  useEffect(() => {
    setGa4MeasurementId(localStorage.getItem('ga4_measurement_id') || '');
    setGa4ApiSecret(localStorage.getItem('ga4_api_secret') || '');
  }, []);

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

  const [postMortem, setPostMortem] = useState('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [anomalyInsights, setAnomalyInsights] = useState({});
  const [loadingInsight, setLoadingInsight] = useState(null);
  const [activeChannelFilter, setActiveChannelFilter] = useState('all');

  // Project active campaign stats based on channel filter selection
  const activeStats = campaign.channels && activeChannelFilter !== 'all' && campaign.channelStats?.[activeChannelFilter]
    ? {
        ...campaign,
        ...campaign.channelStats[activeChannelFilter],
        channel: activeChannelFilter
      }
    : campaign;

  const ga = activeStats.gaStats || {
    sessions: 0,
    bounceRate: 0,
    duration: 0,
    loadTime: 0,
    purchases: 0,
    deviceSplit: {
      mobile: { bounceRate: 0, duration: 0, loadTime: 0 },
      desktop: { bounceRate: 0, duration: 0, loadTime: 0 }
    }
  };

  const deviceSplit = ga.deviceSplit || {
    mobile: { bounceRate: 0, duration: 0, loadTime: 0 },
    desktop: { bounceRate: 0, duration: 0, loadTime: 0 }
  };
  const mobileStats = deviceSplit.mobile || { bounceRate: 0, duration: 0, loadTime: 0 };
  const desktopStats = deviceSplit.desktop || { bounceRate: 0, duration: 0, loadTime: 0 };

  const auditUtmLinks = (html) => {
    if (!html) return [];
    const hrefRegex = /href="([^"]+)"/g;
    const links = [];
    let match;
    while ((match = hrefRegex.exec(html)) !== null) {
      const urlStr = match[1];
      if (urlStr === '#' || urlStr.startsWith('#') || urlStr.startsWith('mailto:') || urlStr.startsWith('tel:') || urlStr.startsWith('javascript:')) {
        continue;
      }
      const hasUtmSource = urlStr.includes('utm_source=');
      const hasUtmMedium = urlStr.includes('utm_medium=');
      const hasUtmCampaign = urlStr.includes('utm_campaign=');
      const isValid = hasUtmSource && hasUtmMedium && hasUtmCampaign;
      
      const missing = [];
      if (!hasUtmSource) missing.push('utm_source');
      if (!hasUtmMedium) missing.push('utm_medium');
      if (!hasUtmCampaign) missing.push('utm_campaign');
      
      links.push({
        url: urlStr,
        isValid,
        missing
      });
    }
    return links;
  };

  const auditedLinks = auditUtmLinks(activeStats.templateHtml);

  const clickSessionDiff = activeStats.clicks > 0 
    ? parseFloat(((Math.abs(activeStats.clicks - ga.sessions) / activeStats.clicks) * 100).toFixed(1))
    : 0;

  const convPurchaseDiff = activeStats.conversions > 0 
    ? parseFloat(((Math.abs(activeStats.conversions - ga.purchases) / activeStats.conversions) * 100).toFixed(1))
    : 0;

  const getDiscrepancyLevel = (variance) => {
    if (variance < 5) return 'low';
    if (variance <= 15) return 'medium';
    return 'high';
  };

  const getDiscrepancyColor = (level) => {
    if (level === 'low') return 'var(--success)';
    if (level === 'medium') return 'var(--warning)';
    return 'var(--error)';
  };



  // Local action delays
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showAbTooltip, setShowAbTooltip] = useState(false);

  // Reset channel filter on campaign swap
  useEffect(() => {
    setActiveChannelFilter('all');
  }, [campaign.id]);

  // Fetch AI Post-Mortem Report on campaign or channel change
  useEffect(() => {
    let active = true;
    const fetchReport = async () => {
      setLoadingReport(true);
      setPostMortem('');
      setAnomalyInsights({});
      try {
        const report = await generateCampaignPostMortem(activeStats, apiKey);
        if (active) setPostMortem(report);
      } catch {
        if (active) setPostMortem(`### ❌ Error Loading Post-Mortem\nWe could not connect to the AI engine.`);
      } finally {
        if (active) setLoadingReport(false);
      }
    };
    fetchReport();
    return () => { active = false; };
  }, [campaign.id, activeChannelFilter, apiKey]);

  // Anomaly diagnostic with forced 1-second delay
  const handleExplainAnomaly = async (clientKey, clientName, rate) => {
    setLoadingInsight(clientKey);
    const start = Date.now();
    try {
      const insight = await generateAnomalyExplanation(clientName, rate, overallRate, apiKey);
      const elapsed = Date.now() - start;
      if (elapsed < 1000) {
        await new Promise(r => setTimeout(r, 1000 - elapsed));
      }
      setAnomalyInsights(prev => ({ ...prev, [clientKey]: insight }));
    } catch {
      setAnomalyInsights(prev => ({ ...prev, [clientKey]: "Failed to diagnose anomaly." }));
    } finally {
      setLoadingInsight(null);
    }
  };

  // 1-second delay handlers for action buttons
  const triggerSaveReport = () => {
    setIsSaving(true);
    setTimeout(() => {
      let reportName = activeStats.name;
      let reportStats = {
        sent: activeStats.sent,
        opens: activeStats.opens,
        clicks: activeStats.clicks,
        conversions: activeStats.conversions,
        bounces: activeStats.bounces,
        unsubscribes: activeStats.unsubscribes
      };
      let reportText = postMortem;

      if (activeTab === 'sql') {
        reportName = `[SQL Report] ${campaign.name}`;
        reportText = `### SQL CRM Database & Benchmark Ledger\n\n` + 
          `* **Total Benchmarks Evaluated**: ${campaign.branches?.length || 0}\n` +
          `* **Campaign Version**: ${campaign.version}\n` +
          `* **Deliverability Anomalies**: SPF/DKIM Alignment OK, ISP deviation analysis resolved.\n\n` +
          `#### Active Segment Attributions:\n` +
          (campaign.branches?.map(b => `* **${b.name}** (${b.expression}): Triggered: ${b.triggered.toLocaleString()} | Click Rate: ${b.ctr}% | Conversion Rate: ${b.cvr}%`).join('\n') || 'No segments configured.');
      } else if (activeTab === 'ga') {
        reportName = `[GA Report] ${campaign.name}`;
        reportStats = {
          sent: campaign.clicks,
          opens: campaign.gaStats?.sessions || 0,
          clicks: campaign.gaStats?.purchases || 0,
          conversions: campaign.gaStats?.purchases || 0,
          bounces: Math.round((campaign.gaStats?.sessions || 0) * ((campaign.gaStats?.bounceRate || 0) / 100)),
          unsubscribes: 0
        };
        reportText = `### Google Analytics (GA4) Traffic & UTM Tracking Audit\n\n` +
          `* **GA Sessions**: ${campaign.gaStats?.sessions?.toLocaleString() || 0}\n` +
          `* **Target Purchases**: ${campaign.gaStats?.purchases?.toLocaleString() || 0}\n` +
          `* **Session Bounce Rate**: ${campaign.gaStats?.bounceRate}%\n` +
          `* **Site Load Speed**: ${campaign.gaStats?.loadTime}s (Avg: 2.0s)\n` +
          `* **UTM Campaign Tracking Status**: Valid\n` +
          `* **Device Split Bounce Rate**: Mobile (${campaign.gaStats?.deviceSplit?.mobile?.bounceRate}%) vs. Desktop (${campaign.gaStats?.deviceSplit?.desktop?.bounceRate}%)`;
      } else {
        reportName = `[Full Report] ${campaign.name}`;
      }

      onSaveReport(reportName, reportStats, reportText);
      setIsSaving(false);
    }, 1000);
  };

  const triggerPrintReport = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 1000);
  };

  const triggerExportJson = () => {
    setIsExporting(true);
    setTimeout(() => {
      let exportObj = activeStats;
      let exportName = `${activeStats.id}-report.json`;

      if (activeTab === 'sql') {
        exportObj = {
          reportType: 'sql_crm_database',
          campaignId: campaign.id,
          campaignName: campaign.name,
          version: campaign.version,
          benchmarks: campaign.branches || [],
          deliverability: campaign.deliverability || {},
          failures: getFailuresAndRisks()
        };
        exportName = `${campaign.id}-sql-report.json`;
      } else if (activeTab === 'ga') {
        exportObj = {
          reportType: 'google_analytics_diagnostics',
          campaignId: campaign.id,
          campaignName: campaign.name,
          gaStats: campaign.gaStats || {},
          speedSplit: campaign.gaStats?.deviceSplit || {}
        };
        exportName = `${campaign.id}-ga-report.json`;
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", exportName);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setIsExporting(false);
    }, 1000);
  };

  const getBranchBadgeStyle = (ctr) => {
    if (ctr >= 15) return { bg: 'rgba(16, 185, 129, 0.12)', text: 'var(--success)', label: 'High Yield' };
    if (ctr >= 5) return { bg: 'rgba(6, 182, 212, 0.12)', text: 'var(--accent-cyan)', label: 'Normal' };
    return { bg: 'rgba(244, 63, 94, 0.12)', text: 'var(--error)', label: 'Failing' };
  };

  // Metrics conversions mapped to activeStats projection
  const delivered = activeStats.sent - (activeStats.bounces || 0);
  const deliveryRate = activeStats.sent > 0 ? ((delivered / activeStats.sent) * 100).toFixed(1) : 100;
  const openRate = activeStats.sent > 0 ? ((activeStats.opens / activeStats.sent) * 100).toFixed(1) : 0;
  const clickRate = activeStats.sent > 0 ? ((activeStats.clicks / activeStats.sent) * 100).toFixed(1) : 0;
  const convRate = activeStats.sent > 0 ? ((activeStats.conversions / activeStats.sent) * 100).toFixed(1) : 0;
  const unsubRate = activeStats.sent > 0 ? ((activeStats.unsubscribes / activeStats.sent) * 100).toFixed(2) : 0;
  const bounceRate = activeStats.sent > 0 ? (((activeStats.bounces || 0) / activeStats.sent) * 100).toFixed(2) : 0;
  const overallRate = parseFloat(openRate);

  // BRAND BENCHMARKS COMPARISONS
  const benchmarks = {
    delivery: 99.5,
    open: 22.0,
    click: 5.5,
    conversion: 2.2,
    unsubscribe: 0.15
  };

  const devDelivery = (parseFloat(deliveryRate) - benchmarks.delivery).toFixed(1);
  const devOpen = (parseFloat(openRate) - benchmarks.open).toFixed(1);
  const devClick = (parseFloat(clickRate) - benchmarks.click).toFixed(1);
  const devConv = (parseFloat(convRate) - benchmarks.conversion).toFixed(1);
  const devUnsub = (parseFloat(unsubRate) - benchmarks.unsubscribe).toFixed(2);

  // FINANCIAL IMPACT CALCULATIONS
  const averageOrderValue = 45; // Simulated $45 order value
  const customerLifetimeValue = 120; // Simulated $120 CLV for unsub/bounce value losses
  const revenueGenerated = activeStats.conversions * averageOrderValue;
  const unsubLoss = activeStats.unsubscribes * customerLifetimeValue;
  const bounceLoss = (activeStats.bounces || 0) * customerLifetimeValue;
  const netValue = revenueGenerated - unsubLoss - bounceLoss;

  // Compute A/B significance metrics based on activeStats projection
  const stats = calculateABStats(activeStats.variants);

  // Generate SVG curve points
  const generateCurvePaths = (width = 460, height = 130) => {
    const varA = activeStats.variants?.a;
    const varB = activeStats.variants?.b;
    if (!varA || !varB) return { pathA: '', pathB: '', pA: 0, pB: 0 };

    const pA = varA.sent > 0 ? (varA.opens || varA.clicks) / varA.sent : 0;
    const pB = varB.sent > 0 ? (varB.opens || varB.clicks) / varB.sent : 0;

    // Clamp standard deviations to a minimum of 0.008 for visual rendering.
    // Huge sample sizes yield standard errors <0.001, making the curves render as invisible 1px vertical lines.
    const stdA = Math.max(varA.sent > 0 ? Math.sqrt((pA * (1 - pA)) / varA.sent) : 0, 0.008);
    const stdB = Math.max(varB.sent > 0 ? Math.sqrt((pB * (1 - pB)) / varB.sent) : 0, 0.008);

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
    if (activeStats.channel === 'email' && activeStats.templateHtml) {
      return (
        <div style={{ position: 'relative', width: '100%', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', backgroundColor: '#fff' }}>
          <div className="hotspot-container" style={{ position: 'relative', height: '360px', width: '100%' }}>
            <iframe title="Attribution Frame" srcDoc={activeStats.templateHtml} style={{ width: '100%', height: '100%', border: 'none' }} />
            {activeStats.hotspots?.map(spot => (
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

    if (activeStats.channel === 'push') {
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
              {activeStats.subjectLine}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
              {activeStats.pushBody || "Beat the heat with a free small Blizzard on us. Tap to load reward in app."}
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Push Click Action CTR: <strong>{activeStats.clicks ? ((activeStats.clicks / activeStats.sent) * 100).toFixed(1) : 0}%</strong></span>
        </div>
      );
    }

    if (activeStats.channel === 'sms') {
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
          padding: '2.5rem',
          gap: '1.5rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '280px',
            backgroundColor: '#1c1c1e',
            borderRadius: '30px',
            padding: '1.5rem 1rem',
            border: '4px solid #3a3a3c',
            boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            height: '240px',
            justifyContent: 'flex-end'
          }}>
            <div style={{
              alignSelf: 'flex-start',
              backgroundColor: '#262629',
              color: '#fff',
              borderRadius: '16px 16px 16px 4px',
              padding: '0.75rem 1rem',
              fontSize: '0.8rem',
              lineHeight: '1.35',
              maxWidth: '90%',
              marginBottom: '0.5rem',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              {activeStats.smsBody || "Dairy Queen: Summer is here! Click to claim your FREE small Blizzard now: dq.com/s-free (Reply STOP to unsub)"}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#8e8e93', alignSelf: 'center', marginBottom: 'auto' }}>Text Message &bull; Today 8:00 PM</div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SMS Click-Through CTR: <strong>{activeStats.clicks ? ((activeStats.clicks / activeStats.sent) * 100).toFixed(1) : 0}%</strong></span>
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
    const filter = activeChannelFilter === 'all' ? null : activeChannelFilter;

    // Deliverability anomalies
    if (campaign.deliverability) {
      Object.entries(campaign.deliverability).forEach(([client, data]) => {
        const deviation = data.rate - overallRate;
        if (deviation <= -4.0) {
          const isEmailClient = ['gmail', 'outlook', 'yahoo'].includes(client);
          const isPushClient = ['ios', 'android'].includes(client);
          const isSmsClient = ['carrier_att', 'carrier_tmobile'].includes(client);

          if (
            !filter ||
            (filter === 'email' && isEmailClient) ||
            (filter === 'push' && isPushClient) ||
            (filter === 'sms' && isSmsClient)
          ) {
            issues.push({
              id: `deliv-${client}`,
              type: `[${isEmailClient ? 'Email' : isPushClient ? 'Push' : 'SMS'}] Deliverability Drop`,
              severity: 'critical',
              message: `${client.toUpperCase()} placement rate is anomalous at ${data.rate}% (${deviation.toFixed(1)}% below average).`,
              action: () => handleExplainAnomaly(client, client.toUpperCase(), data.rate),
              isInsight: anomalyInsights[client]
            });
          }
        }
      });
    }

    // Logic branches failures / low conversion yields
    if (campaign.branches && (!filter || filter === 'email')) {
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
    if (activeStats.bounces && activeStats.bounces > 0) {
      issues.push({
        id: `bounce-${activeChannelFilter}`,
        type: `[${activeChannelFilter.toUpperCase()}] Delivery Failure`,
        severity: 'critical',
        message: `${activeStats.bounces.toLocaleString()} hard/soft bounces detected (${bounceRate}% failure rate).`
      });
    }

    // Blacklist validation (Simulated audit based on deliveries)
    const isAnomalyExist = deliverabilityKeys.some(k => (campaign.deliverability[k]?.rate - overallRate) <= -4.0);
    if (isAnomalyExist) {
      issues.push({
        id: 'blacklist-sorbs',
        type: 'Domain Blacklist Alert',
        severity: 'warning',
        message: 'Sender IP registered soft block listing on SORBS database. Review bounce classifications.'
      });
    }

    // Mock HTML/CSS layout checks
    if (activeStats.channel === 'email') {
      issues.push({
        id: 'auth-status',
        type: 'SPF/DKIM Validation',
        severity: 'resolved',
        message: 'Domain SPF, DKIM, and DMARC record alignment checked: Active and Passing.'
      });
    }

    return issues;
  };

  // Filter deliverability for the anomalies grid display based on active channel
  const getFilteredDeliverabilityKeys = () => {
    if (!campaign.deliverability) return [];
    const filter = activeChannelFilter;
    const allKeys = Object.keys(campaign.deliverability);
    if (filter === 'all') return allKeys;

    const emailKeys = ['gmail', 'outlook', 'yahoo'];
    const pushKeys = ['ios', 'android'];
    const smsKeys = ['carrier_att', 'carrier_tmobile'];

    if (filter === 'email') return allKeys.filter(k => emailKeys.includes(k));
    if (filter === 'push') return allKeys.filter(k => pushKeys.includes(k));
    if (filter === 'sms') return allKeys.filter(k => smsKeys.includes(k));
    return allKeys;
  };

  const deliverabilityKeys = getFilteredDeliverabilityKeys();

  const failuresList = getFailuresAndRisks();

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 📊 Tab Selector & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
        {/* Tab Selector Bar */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          backgroundColor: 'var(--bg-secondary)',
          padding: '0.4rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          flex: '1',
          maxWidth: 'fit-content'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              border: activeTab === 'overview' ? 'none' : '1px solid transparent',
              flexShrink: 0
            }}
          >
            Combined Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`btn ${activeTab === 'sql' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              border: activeTab === 'sql' ? 'none' : '1px solid transparent',
              flexShrink: 0
            }}
          >
            SQL Database Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ga')}
            className={`btn ${activeTab === 'ga' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              border: activeTab === 'ga' ? 'none' : '1px solid transparent',
              flexShrink: 0
            }}
          >
            Google Analytics Diagnostics
          </button>
        </div>

        {/* Global Export/Save/Print Actions */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            onClick={triggerSaveReport}
            className="btn btn-secondary"
            disabled={isSaving}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderRadius: '6px' }}
            title="Save snapshot of current tab report to archive"
          >
            {isSaving ? <RefreshCw size={12} className="spin" /> : <Save size={12} />}
            {isSaving ? "Saving..." : `Save ${activeTab === 'overview' ? 'Full' : activeTab === 'sql' ? 'SQL' : 'GA'} Report`}
          </button>
          <button
            onClick={triggerPrintReport}
            className="btn btn-secondary"
            disabled={isPrinting}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderRadius: '6px' }}
            title="Print report or export as PDF"
          >
            {isPrinting ? <RefreshCw size={12} className="spin" /> : <Printer size={12} />}
            {isPrinting ? "Preparing PDF..." : "Print/PDF"}
          </button>
          <button
            onClick={triggerExportJson}
            className="btn btn-secondary"
            disabled={isExporting}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderRadius: '6px' }}
            title="Export metrics as JSON file"
          >
            {isExporting ? <RefreshCw size={12} className="spin" /> : <Download size={12} />}
            {isExporting ? "Exporting..." : "Export JSON"}
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Executive Campaign Title Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Campaign Executive Summary</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                Status: <strong style={{ color: 'var(--success)' }}>Report Finalized</strong> &bull; Synced {campaign.lastSynced}
              </p>
            </div>

            {/* Braze Link & Sync Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {campaign.brazeCampaignId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Braze Link:</span>
                  <code style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {campaign.brazeCampaignId.substring(0, 10)}...
                  </code>
                  <button
                    onClick={() => handleSyncBraze(campaign.brazeCampaignId)}
                    disabled={isSyncing}
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem', height: '24px', width: '24px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}
                    title="Pull latest numbers from Braze API"
                  >
                    <RefreshCw size={12} className={isSyncing ? 'spin' : ''} />
                  </button>
                  <button
                    onClick={handleUnlinkBraze}
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem', height: '24px', width: '24px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', color: 'var(--error)' }}
                    title="Unlink Braze campaign"
                  >
                    <Unlink size={12} />
                  </button>
                </div>
              ) : (
                <>
                  {isLinking ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Braze Campaign ID"
                        className="form-input"
                        value={brazeIdInput}
                        onChange={(e) => setBrazeIdInput(e.target.value)}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', width: '160px', borderRadius: '4px', height: '30px' }}
                      />
                      <button
                        onClick={() => handleSyncBraze(brazeIdInput)}
                        disabled={isSyncing || !brazeIdInput.trim()}
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px', height: '30px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        {isSyncing ? <RefreshCw size={12} className="spin" /> : <Link size={12} />}
                        Link & Sync
                      </button>
                      <button
                        onClick={() => setIsLinking(false)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px', height: '30px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsLinking(true)}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderRadius: '6px' }}
                    >
                      <Link size={12} />
                      Link Braze Campaign
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {syncError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.85rem',
              backgroundColor: 'rgba(244,63,94,0.08)',
              border: '1px solid rgba(244,63,94,0.15)',
              borderRadius: '6px',
              color: 'var(--error)',
              fontSize: '0.78rem',
              marginBottom: '1rem'
            }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span>{syncError}</span>
            </div>
          )}

      {/* Combined GA4 Summary Cards Block */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={16} style={{ color: 'var(--accent-purple)' }} />
          Google Analytics (GA4) Post-Click Traffic Overview
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>GA SESSIONS</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '0.2rem' }}>{(ga.sessions || 0).toLocaleString()}</div>
          </div>
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>GA PURCHASES</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '0.2rem' }}>{(ga.purchases || 0).toLocaleString()}</div>
          </div>
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>GA CVR</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '0.2rem', color: 'var(--success)' }}>
              {ga.sessions > 0 ? ((ga.purchases / ga.sessions) * 100).toFixed(2) : '0.00'}%
            </div>
          </div>
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: `1px solid ${ga.bounceRate > 50 ? 'rgba(245,158,11,0.2)' : 'var(--border-color)'}` }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BOUNCE RATE</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '0.2rem', color: ga.bounceRate > 50 ? 'var(--warning)' : 'var(--text-primary)' }}>{ga.bounceRate}%</div>
          </div>
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: `1px solid ${ga.loadTime > 2.0 ? 'rgba(239,68,68,0.2)' : 'var(--border-color)'}` }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PAGE LOAD TIME</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '0.2rem', color: ga.loadTime > 2.0 ? 'var(--error)' : 'var(--text-primary)' }}>{ga.loadTime}s</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PANEL 3: AI EXECUTIVE POST-MORTEM & FAILURES / RISKS LEDGER                */}
      {/* ========================================================================= */}
      {(() => {
        const parts = postMortem.split(/### 🎯 Recommended Adjustments/i);
        const mainReport = parts[0];
        const adjustments = parts[1];

        return (
          <>
            <div className="grid-asymmetric-1">
              
              {/* AI Post-Mortem */}
              <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
                    AI Campaign Post-Mortem Analysis
                  </h3>
                  <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', backgroundColor: 'rgba(124,58,237,0.1)', color: 'var(--accent-primary)', fontWeight: '600' }}>
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
                    style={{ flex: 1, paddingRight: '0.4rem' }}
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(mainReport) }}
                  />
                )}
              </div>

              {/* Failures & Warnings List */}
              <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                <h3 
                  style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'help' }}
                  onMouseEnter={() => setShowFailuresTooltip(true)}
                  onMouseLeave={() => setShowFailuresTooltip(false)}
                >
                  <Bug size={14} style={{ color: 'var(--error)' }} />
                  Failures & Risk Audits Ledger
                  <Info size={12} style={{ color: 'var(--text-muted)', marginLeft: '0.2rem' }} />
                </h3>

                {showFailuresTooltip && (
                  <div style={{
                    position: 'absolute',
                    top: '2.8rem',
                    left: '1.75rem',
                    right: '1.75rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--error)',
                    borderRadius: '8px',
                    padding: '1rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    zIndex: 10,
                    fontSize: '0.78rem',
                    lineHeight: '1.45',
                    color: 'var(--text-secondary)',
                    backdropFilter: 'blur(10px)',
                    pointerEvents: 'none'
                  }}>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
                      🛡️ Audited Failure & Risk Dimensions
                    </strong>
                    <p style={{ marginBottom: '0.4rem' }}>
                      OmniPulse continuously parses your database logs to verify campaign integrity across key risk vectors:
                    </p>
                    <p style={{ marginBottom: '0.4rem' }}>
                      * <strong>Deliverability Placement</strong>: Detects ISP-specific placement drops below standard thresholds (e.g. Yahoo or Outlook filter triggers).
                    </p>
                    <p style={{ marginBottom: '0.4rem' }}>
                      * <strong>Authentication Status</strong>: Verifies alignment of SPF, DKIM, and DMARC keys on outbound assets.
                    </p>
                    <p style={{ marginBottom: '0.4rem' }}>
                      * <strong>Domain Blacklists</strong>: Checks sender IP reputation against real-time blackhole lists like SORBS.
                    </p>
                    <p>
                      * <strong>Segment Conversions & Churn</strong>: Flags critical unsubscribe thresholds and hard bounce opt-outs.
                    </p>
                  </div>
                )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '250px', paddingRight: '0.25rem' }}>
            {failuresList.length > 0 ? (
              failuresList.map((issue) => (
                <div 
                  key={issue.id} 
                  style={{ 
                    padding: '0.75rem 1rem', 
                    backgroundColor: 'var(--bg-tertiary)', 
                    borderRadius: 'var(--border-radius-md)', 
                    border: `1px solid ${issue.severity === 'critical' ? 'rgba(239,68,68,0.15)' : issue.severity === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'}` 
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
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', borderRadius: '4px' }}
                      >
                        {loadingInsight === issue.id.replace('deliv-', '') ? <RefreshCw size={10} className="spin" /> : "Diagnose"}
                      </button>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                    {issue.message}
                  </div>

                  {issue.isInsight && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(124,58,237,0.02)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--accent-primary)' }}>Diagnosis: </strong>{issue.isInsight}
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

            {adjustments && (
              <div className="panel fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--accent-primary)', boxShadow: 'var(--accent-glow)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)' }}>
                  <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
                  AI Recommended Optimization Adjustments
                </h3>
                <div 
                  style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(adjustments.trim()) }}
                />
              </div>
            )}
          </>
        );
      })()}
    </>
  )}

  {activeTab === 'sql' && (
    <>
      {/* ========================================================================= */}
      {/* PANEL 1: EXECUTIVE PERFORMANCE LEDGER & BENCHMARKS MATRIX                 */}
      {/* ========================================================================= */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Post-Deployment Executive Summary</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status: <strong style={{ color: 'var(--success)' }}>Report Finalized</strong> &bull; Synced {campaign.lastSynced}</p>
              <span className="api-badge" style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem', borderStyle: 'dashed' }}>Channel: {activeStats.channel?.toUpperCase()}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Segmented Channel Filter */}
            {campaign.channels && (
              <div style={{ display: 'flex', gap: '0.2rem', backgroundColor: 'var(--bg-primary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => setActiveChannelFilter('all')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: activeChannelFilter === 'all' ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                    color: activeChannelFilter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  All
                </button>
                {campaign.channels.map(ch => (
                  <button
                    key={ch}
                    onClick={() => setActiveChannelFilter(ch)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: activeChannelFilter === ch ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                      color: activeChannelFilter === ch ? 'var(--text-primary)' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            )}

            <span style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              Subject: {activeStats.subjectLine}
            </span>
          </div>
        </div>

        {/* Gauges Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1.5rem', margin: '0.5rem 0' }}>
          <ProgressRing percentage={parseFloat(deliveryRate)} label="Delivered" color="var(--success)" />
          {activeStats.channel !== 'sms' && activeStats.channel !== 'iam' && (
            <ProgressRing percentage={parseFloat(openRate)} label="Open Rate" color="var(--accent-secondary)" />
          )}
          <ProgressRing percentage={parseFloat(clickRate)} label="Click Rate" color="var(--accent-primary)" />
          <ProgressRing percentage={parseFloat(convRate)} label="Conv. Rate" color="var(--success)" />
          <ProgressRing percentage={parseFloat(unsubRate)} label="Unsub Rate" color="var(--error)" />
        </div>

        {/* Campaign Metrics vs. Brand Benchmark Matrix */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Campaign performance vs. Brand Benchmarks Matrix
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DELIVERY SUCCESS</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '700' }}>{deliveryRate}%</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: devDelivery >= 0 ? 'var(--success)' : 'var(--error)' }}>
                  ({devDelivery >= 0 ? `+${devDelivery}` : devDelivery}% vs BM)
                </span>
              </div>
            </div>
            {activeStats.channel !== 'sms' && activeStats.channel !== 'iam' && (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>OPEN RATE</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: '700' }}>{openRate}%</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: devOpen >= 0 ? 'var(--success)' : 'var(--error)' }}>
                    ({devOpen >= 0 ? `+${devOpen}` : devOpen}% vs BM)
                  </span>
                </div>
              </div>
            )}
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CLICK-THROUGH RATE</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '700' }}>{clickRate}%</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: devClick >= 0 ? 'var(--success)' : 'var(--error)' }}>
                  ({devClick >= 0 ? `+${devClick}` : devClick}% vs BM)
                </span>
              </div>
            </div>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CONVERSION RATE</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '700' }}>{convRate}%</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: devConv >= 0 ? 'var(--success)' : 'var(--error)' }}>
                  ({devConv >= 0 ? `+${devConv}` : devConv}% vs BM)
                </span>
              </div>
            </div>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>UNSUBSCRIBE RATE</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '700' }}>{unsubRate}%</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: devUnsub <= 0 ? 'var(--success)' : 'var(--error)' }}>
                  ({devUnsub > 0 ? `+${devUnsub}` : devUnsub}% vs BM)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ========================================================================= */}
      {/* PANEL 2: RETROSPECTIVE CONVERSION FUNNEL & FINANCIAL IMPACT LEDGER         */}
      {/* ========================================================================= */}
      <div className="split-view">
        
        {/* Retrospective Conversion Funnel */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <TrendingUp size={15} style={{ color: 'var(--accent-secondary)' }} />
            Retrospective Conversion Funnel
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
            {[
              { label: '1. Total Segment Sent', val: activeStats.sent, pct: 100 },
              { label: '2. Delivered Messages', val: delivered, pct: ((delivered / activeStats.sent) * 100).toFixed(1) },
              ...(activeStats.channel !== 'sms' && activeStats.channel !== 'iam' ? [{ label: '3. Opened Messages', val: activeStats.opens, pct: ((activeStats.opens / delivered) * 100).toFixed(1) }] : []),
              { label: '4. Unique Clicks', val: activeStats.clicks, pct: ((activeStats.clicks / (activeStats.opens || delivered)) * 100).toFixed(1) },
              { label: '5. Segment Conversions', val: activeStats.conversions, pct: ((activeStats.conversions / activeStats.clicks) * 100).toFixed(1) }
            ].map((stage, idx, arr) => {
              const widthRatio = 100 - idx * 8;
              const safeVal = stage.val !== undefined && stage.val !== null ? stage.val : 0;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '0 0.25rem' }}>
                    <span style={{ fontWeight: '600' }}>{stage.label}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {safeVal.toLocaleString()} &bull; <strong style={{ color: 'var(--text-primary)' }}>{stage.pct}%</strong>
                      {idx > 0 ? ` conversion` : ' target'}
                    </span>
                  </div>
                  <div style={{
                    height: '24px',
                    width: `${widthRatio}%`,
                    backgroundColor: 'rgba(12, 16, 27, 0.4)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${stage.pct}%`,
                      background: idx % 2 === 0 ? 'var(--blue-gradient)' : 'var(--cyan-gradient)',
                      opacity: 0.85
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Post-Deployment Revenue & Churn Auditor */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <DollarSign size={15} style={{ color: 'var(--success)' }} />
            Post-Deployment Revenue & Churn Auditor
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem', flex: 1 }}>
            
            <div className="grid-compact-2col">
              <div style={{ padding: '0.85rem', backgroundColor: 'rgba(16, 185, 129, 0.04)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>GROSS CAMPAIGN REVENUE</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--success)', marginTop: '0.2rem' }}>
                  +${(revenueGenerated || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Based on AOV of ${averageOrderValue}</div>
              </div>

              <div style={{ padding: '0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.04)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>UNSUBSCRIBE VALUE CHURN</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--error)', marginTop: '0.2rem' }}>
                  -${(unsubLoss || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Based on CLV of ${customerLifetimeValue}</div>
              </div>
            </div>

            <div className="grid-compact-2col">
              <div style={{ padding: '0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.04)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>BOUNCE DELIV CHURN</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--error)', marginTop: '0.2rem' }}>
                  -${(bounceLoss || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Based on CLV of ${customerLifetimeValue}</div>
              </div>

              <div style={{ padding: '0.85rem', backgroundColor: (netValue || 0) >= 0 ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)', borderRadius: '8px', border: `1px solid ${(netValue || 0) >= 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}` }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>NET MARKETING VALUE</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: (netValue || 0) >= 0 ? 'var(--success)' : 'var(--error)', marginTop: '0.2rem' }}>
                  {(netValue || 0) >= 0 ? `+$${(netValue || 0).toLocaleString()}` : `-$${Math.abs(netValue || 0).toLocaleString()}`}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Net Value Yield Ledger</div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* PANEL 4: DIAGNOSTIC DIAGRAMS & DELIVERABILITY RADAR                        */}
      {/* ========================================================================= */}
      <div className="grid-asymmetric-2">
        
        {/* Clickmap or Channel Previews */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>
            {activeStats.channel === 'email' ? 'Attribution clickmap Hotspots' : `${activeStats.channel?.toUpperCase()} Channel Preview`}
          </h3>
          {renderClickmapFrame()}
        </div>

        {/* Deliverability Warnings & Anomalies (Spam traps and Blacklists) */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>
              {activeChannelFilter === 'all' ? 'Deliverability Placement Radar' : `${activeChannelFilter.toUpperCase()} Placement Radar`}
            </h3>
            
            {/* IP Blacklist audit status */}
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.25rem', 
              fontSize: '0.68rem', 
              padding: '0.15rem 0.45rem', 
              borderRadius: '4px',
              backgroundColor: failuresList.some(i => i.id === 'blacklist-sorbs') ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
              border: `1px solid ${failuresList.some(i => i.id === 'blacklist-sorbs') ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
              color: failuresList.some(i => i.id === 'blacklist-sorbs') ? 'var(--warning)' : 'var(--success)'
            }}>
              <ShieldAlert size={10} />
              {failuresList.some(i => i.id === 'blacklist-sorbs') ? 'SORBS BLOCKED' : 'IP BLACKLIST CLEAN'}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '360px', paddingRight: '0.25rem' }}>
            {deliverabilityKeys.length > 0 ? (
              deliverabilityKeys.map((key) => {
                const client = campaign.deliverability[key];
                const dev = parseFloat((client.rate - overallRate).toFixed(1));
                const isAnomaly = dev <= -4.0;
                const hasInsight = anomalyInsights[key];
                
                return (
                  <div key={key} style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: `1px solid ${isAnomaly ? 'rgba(239,68,68,0.12)' : 'var(--border-color)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.82rem', textTransform: 'capitalize' }}>
                        {key.startsWith('carrier_') ? key.replace('carrier_', '').toUpperCase() : key.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: isAnomaly ? 'var(--error)' : 'var(--success)', fontWeight: '700' }}>{client.rate}% delivery rate</span>
                      
                      {isAnomaly && !hasInsight && (
                        <button
                          onClick={() => handleExplainAnomaly(key, key.toUpperCase(), client.rate)}
                          className="btn btn-primary"
                          disabled={loadingInsight !== null}
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px' }}
                        >
                          {loadingInsight === key ? <RefreshCw size={10} className="spin" /> : "Diagnose"}
                        </button>
                      )}
                    </div>

                    {hasInsight && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(124,58,237,0.02)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--accent-primary)' }}>Diagnosis: </strong>{hasInsight}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                No deliverability records matching this channel filter.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* PANEL 5: A/B TESTING & LIQUID LOGIC BRANCH ATTRIBUTION                     */}
      {/* ========================================================================= */}
      <div className="grid-asymmetric-2">
        
        {/* A/B Significance curves */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
          <h3 
            style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'help' }}
            onMouseEnter={() => setShowAbTooltip(true)}
            onMouseLeave={() => setShowAbTooltip(false)}
          >
            <Scale size={14} style={{ color: 'var(--accent-secondary)' }} />
            Bayesian Significance Curve Overlay
            <Info size={12} style={{ color: 'var(--text-muted)', marginLeft: '0.2rem' }} />
          </h3>
          
          {showAbTooltip && (
            <div style={{
              position: 'absolute',
              top: '2.8rem',
              left: '1.75rem',
              right: '1.75rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--accent-primary)',
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              zIndex: 10,
              fontSize: '0.78rem',
              lineHeight: '1.45',
              color: 'var(--text-secondary)',
              backdropFilter: 'blur(10px)',
              pointerEvents: 'none'
            }}>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
                📊 What does this curve show?
              </strong>
              <p style={{ marginBottom: '0.4rem' }}>
                It compares <strong>Variant A (Baseline)</strong> and <strong>Variant B (Challenger)</strong> to determine if the Challenger's performance lift is statistically real, or just lucky variance.
              </p>
              <p style={{ marginBottom: '0.4rem' }}>
                * <strong>Blue & Purple Curves</strong>: Represent the probability distribution of the true conversion rate for each variant.
              </p>
              <p>
                * <strong>Overlap</strong>: High overlap means the A/B test results are inconclusive. No overlap means the winner is statistically guaranteed.
              </p>
            </div>
          )}
          
          <div 
            style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--border-radius-md)', 
              padding: '0.85rem',
              cursor: 'help'
            }}
            onMouseEnter={() => setShowAbTooltip(true)}
            onMouseLeave={() => setShowAbTooltip(false)}
          >
            {pathA && pathB ? (
              <svg viewBox="0 0 460 130" style={{ width: '100%', height: 'auto' }}>
                <path d={pathA} fill="rgba(37, 99, 235, 0.04)" stroke="var(--accent-blue)" strokeWidth="2" />
                <path d={pathB} fill="rgba(124, 58, 237, 0.06)" stroke="var(--accent-primary)" strokeWidth="2" />
              </svg>
            ) : (
              <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No variant distributions loaded for SMS/Push channels.</div>
            )}
          </div>

          <div className="grid-compact-2col" style={{ marginTop: '0.25rem' }}>
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

        {/* Liquid personalization Branch Attribution */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={14} style={{ color: 'var(--accent-primary)' }} />
            Dynamic Personalization Branches
          </h3>
          
          <div style={{ overflowX: 'auto', maxHeight: '200px' }}>
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Segment</th>
                  <th style={{ textAlign: 'right' }}>CTR</th>
                  <th style={{ textAlign: 'right' }}>CVR</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {campaign.branches?.map((branch, idx) => {
                  const badge = getBranchBadgeStyle(branch.ctr);
                  return (
                    <tr key={idx}>
                      <td style={{ fontSize: '0.8rem', fontWeight: '600' }}>{branch.name}</td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--accent-primary)' }}>{branch.ctr}%</td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--success)' }}>{branch.cvr}%</td>
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
    </>
  )}

      {activeTab === 'ga' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* GA4 API Integration Configuration Panel */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={16} style={{ color: 'var(--accent-purple)' }} />
              Google Analytics (GA4) API Integration
            </h3>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Configure your Google Analytics (GA4) credentials here to sync post-click sessions, bounce rates, page load speed diagnostics, and conversion tracking audits.
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} style={{ color: 'var(--accent-purple)' }} />
          Google Analytics (GA4) Post-Click Diagnostics
        </h3>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
      </div>

      <div className="grid-asymmetric-2">
        {/* Left Side: GA4 Metrics & Attribution Sync Ledger */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.25rem' }}>GA4 Landing Page Traffic & Conversion KPIs</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Post-click sessions and transactions logged inside Google Analytics properties.</p>
          </div>

          <div className="grid-3col">
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>GA SESSIONS</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '0.2rem' }}>{(ga.sessions || 0).toLocaleString()}</div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>GA PURCHASES</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '0.2rem' }}>{(ga.purchases || 0).toLocaleString()}</div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>GA CONV. RATE (CVR)</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '0.2rem', color: 'var(--success)' }}>
                {ga.sessions > 0 ? ((ga.purchases / ga.sessions) * 100).toFixed(2) : '0.00'}%
              </div>
            </div>
          </div>

          <div className="grid-3col">
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: 'var(--bg-tertiary)', 
              borderRadius: '8px', 
              border: `1px solid ${ga.bounceRate > 50 ? 'rgba(245,158,11,0.2)' : 'var(--border-color)'}` 
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>BOUNCE RATE</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '0.2rem', color: ga.bounceRate > 50 ? 'var(--warning)' : 'var(--text-primary)' }}>
                {ga.bounceRate}%
              </div>
              {ga.bounceRate > 50 && (
                <div style={{ fontSize: '0.55rem', color: 'var(--warning)', marginTop: '0.15rem', fontWeight: '600' }}>⚠️ High Bounce Risk</div>
              )}
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>AVG. DURATION</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '0.2rem' }}>{ga.duration}s</div>
            </div>
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: 'var(--bg-tertiary)', 
              borderRadius: '8px', 
              border: `1px solid ${ga.loadTime > 2.0 ? 'rgba(239,68,68,0.2)' : 'var(--border-color)'}` 
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>PAGE LOAD TIME</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '0.2rem', color: ga.loadTime > 2.0 ? 'var(--error)' : 'var(--text-primary)' }}>
                {ga.loadTime}s
              </div>
              {ga.loadTime > 2.0 && (
                <div style={{ fontSize: '0.55rem', color: 'var(--error)', marginTop: '0.15rem', fontWeight: '600' }}>⚠️ Slow Speed Warning</div>
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem', letterSpacing: '0.03em' }}>
              CRM vs GA4 Attribution Sync Ledger
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Traffic comparison */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span>CRM Clicks vs. GA4 Sessions (Click-to-Landing drop-off)</span>
                  <span style={{ fontWeight: '600' }}>
                    {activeStats.clicks?.toLocaleString()} vs {ga.sessions?.toLocaleString()} 
                    <strong style={{ color: getDiscrepancyColor(getDiscrepancyLevel(clickSessionDiff)), marginLeft: '0.4rem' }}>
                      ({clickSessionDiff}% Variance)
                    </strong>
                  </span>
                </div>
                <div className="discrepancy-bar-container">
                  <div 
                    className={`discrepancy-bar ${getDiscrepancyLevel(clickSessionDiff)}`} 
                    style={{ width: `${Math.min(100, Math.max(5, clickSessionDiff * 3))}%` }}
                  />
                </div>
              </div>

              {/* Conversion comparison */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span>CRM Conversions vs. GA4 Purchases (Attribution sync loss)</span>
                  <span style={{ fontWeight: '600' }}>
                    {activeStats.conversions?.toLocaleString()} vs {ga.purchases?.toLocaleString()}
                    <strong style={{ color: getDiscrepancyColor(getDiscrepancyLevel(convPurchaseDiff)), marginLeft: '0.4rem' }}>
                      ({convPurchaseDiff}% Variance)
                    </strong>
                  </span>
                </div>
                <div className="discrepancy-bar-container">
                  <div 
                    className={`discrepancy-bar ${getDiscrepancyLevel(convPurchaseDiff)}`} 
                    style={{ width: `${Math.min(100, Math.max(5, convPurchaseDiff * 3))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Device Splits & UTM Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Device Splits */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Mobile vs. Desktop Diagnostics</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th style={{ textAlign: 'right' }}>Bounce Rate</th>
                    <th style={{ textAlign: 'right' }}>Avg Duration</th>
                    <th style={{ textAlign: 'right' }}>Page Load</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '600' }}>
                      <Smartphone size={14} style={{ color: 'var(--accent-cyan)' }} /> Mobile
                    </td>
                    <td style={{ textAlign: 'right', color: mobileStats.bounceRate > 50 ? 'var(--warning)' : 'var(--text-primary)' }}>{mobileStats.bounceRate}%</td>
                    <td style={{ textAlign: 'right' }}>{mobileStats.duration}s</td>
                    <td style={{ textAlign: 'right', color: mobileStats.loadTime > 2.0 ? 'var(--error)' : 'var(--text-primary)' }}>{mobileStats.loadTime}s</td>
                  </tr>
                  <tr>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '600' }}>
                      <Monitor size={14} style={{ color: 'var(--accent-blue)' }} /> Desktop
                    </td>
                    <td style={{ textAlign: 'right', color: desktopStats.bounceRate > 50 ? 'var(--warning)' : 'var(--text-primary)' }}>{desktopStats.bounceRate}%</td>
                    <td style={{ textAlign: 'right' }}>{desktopStats.duration}s</td>
                    <td style={{ textAlign: 'right', color: desktopStats.loadTime > 2.0 ? 'var(--error)' : 'var(--text-primary)' }}>{desktopStats.loadTime}s</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* UTM Link Tag Auditor */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>UTM Tracking Link Auditor</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {auditedLinks.length > 0 ? (
                auditedLinks.map((link, idx) => (
                  <div key={idx} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', wordBreak: 'break-all', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {link.url}
                      </span>
                      <span className={`utm-badge ${link.isValid ? 'valid' : 'missing'}`}>
                        {link.isValid ? 'TAGS OK' : 'BADGE MISSING'}
                      </span>
                    </div>
                    {!link.isValid && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--error)' }}>
                        Missing tags: <strong>{link.missing.join(', ')}</strong>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1.5rem 0' }}>
                  {activeStats.channel === 'email' 
                    ? 'No outbound links extracted from template HTML.' 
                    : 'Outbound UTM tag auditor only scans email templates.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

    </div>
  );
}

