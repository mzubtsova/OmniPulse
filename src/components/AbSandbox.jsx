import React, { useState, useEffect } from 'react';
import { calculateABStats } from '../utils/statsMath';
import { Scale, RefreshCw, Check, Info, AlertTriangle } from 'lucide-react';

export default function AbSandbox({ campaign }) {
  // Local input states initialized with active campaign variants
  const [sentA, setSentA] = useState(campaign.variants?.a?.sent || 50000);
  const [clicksA, setClicksA] = useState(campaign.variants?.a?.opens || campaign.variants?.a?.clicks || 5000);
  const [sentB, setSentB] = useState(campaign.variants?.b?.sent || 50000);
  const [clicksB, setClicksB] = useState(campaign.variants?.b?.opens || campaign.variants?.b?.clicks || 5500);

  // Sync state when campaign changes
  useEffect(() => {
    if (campaign.variants?.a && campaign.variants?.b) {
      setSentA(campaign.variants.a.sent);
      setClicksA(campaign.channel === 'email' ? campaign.variants.a.opens : campaign.variants.a.clicks);
      setSentB(campaign.variants.b.sent);
      setClicksB(campaign.channel === 'email' ? campaign.variants.b.opens : campaign.variants.b.clicks);
    }
  }, [campaign.id]);

  // Recalculate stats
  const stats = calculateABStats({
    a: { sent: sentA, clicks: clicksA },
    b: { sent: sentB, clicks: clicksB }
  });

  // Calculate coordinates for A/B normal distribution curves
  const generateCurvePaths = (width = 400, height = 150) => {
    const pA = sentA > 0 ? clicksA / sentA : 0;
    const pB = sentB > 0 ? clicksB / sentB : 0;

    const stdA = sentA > 0 ? Math.sqrt((pA * (1 - pA)) / sentA) : 0;
    const stdB = sentB > 0 ? Math.sqrt((pB * (1 - pB)) / sentB) : 0;

    if (stdA === 0 || stdB === 0) return { pathA: '', pathB: '' };

    const minX = Math.min(pA - 3.5 * stdA, pB - 3.5 * stdB);
    const maxX = Math.max(pA + 3.5 * stdA, pB + 3.5 * stdB);
    const rangeX = maxX - minX;

    const pointsA = [];
    const pointsB = [];

    // Calculate maximum density for scaling
    const maxDensityA = 1 / (stdA * Math.sqrt(2 * Math.PI));
    const maxDensityB = 1 / (stdB * Math.sqrt(2 * Math.PI));
    const maxDensity = Math.max(maxDensityA, maxDensityB);

    for (let i = 0; i <= 100; i++) {
      const pct = i / 100;
      const xVal = minX + pct * rangeX;

      // Density formulas
      const yValA = (1 / (stdA * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((xVal - pA) / stdA, 2));
      const yValB = (1 / (stdB * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((xVal - pB) / stdB, 2));

      const svgX = pct * width;
      const svgYA = height - (yValA / maxDensity) * (height - 30) - 10;
      const svgYB = height - (yValB / maxDensity) * (height - 30) - 10;

      pointsA.push(`${svgX.toFixed(1)},${svgYA.toFixed(1)}`);
      pointsB.push(`${svgX.toFixed(1)},${svgYB.toFixed(1)}`);
    }

    const pathA = `M ${pointsA[0]} ${pointsA.slice(1).map(p => `L ${p}`).join(' ')} L ${width},${height} L 0,${height} Z`;
    const pathB = `M ${pointsB[0]} ${pointsB.slice(1).map(p => `L ${p}`).join(' ')} L ${width},${height} L 0,${height} Z`;

    return { pathA, pathB, pA, pB };
  };

  const { pathA, pathB, pA, pB } = generateCurvePaths(460, 160);

  const handleReset = () => {
    if (campaign.variants?.a && campaign.variants?.b) {
      setSentA(campaign.variants.a.sent);
      setClicksA(campaign.channel === 'email' ? campaign.variants.a.opens : campaign.variants.a.clicks);
      setSentB(campaign.variants.b.sent);
      setClicksB(campaign.channel === 'email' ? campaign.variants.b.opens : campaign.variants.b.clicks);
    }
  };

  return (
    <div className="split-view fade-in">
      
      {/* Left Panel: Inputs sandbox */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Bayesian A/B Sandbox</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Modify values below to run custom simulation stress-tests on your variants.
            </p>
          </div>
          <button onClick={handleReset} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} title="Reset to campaign defaults">
            <RefreshCw size={12} />
          </button>
        </div>

        {/* Input sliders/forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-blue)', marginBottom: '0.75rem' }}>🔵 Variant A (Baseline)</h4>
            <div className="grid-compact-2col">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Volume Sent</label>
                <input type="number" className="form-input" value={sentA} onChange={(e) => setSentA(Math.max(1, parseInt(e.target.value) || 0))} style={{ fontSize: '0.85rem' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Conversions / Click actions</label>
                <input type="number" className="form-input" value={clicksA} onChange={(e) => setClicksA(Math.max(0, Math.min(sentA, parseInt(e.target.value) || 0)))} style={{ fontSize: '0.85rem' }} />
              </div>
            </div>
          </div>
 
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-purple)', marginBottom: '0.75rem' }}>🟣 Variant B (Challenger)</h4>
            <div className="grid-compact-2col">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Volume Sent</label>
                <input type="number" className="form-input" value={sentB} onChange={(e) => setSentB(Math.max(1, parseInt(e.target.value) || 0))} style={{ fontSize: '0.85rem' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Conversions / Click actions</label>
                <input type="number" className="form-input" value={clicksB} onChange={(e) => setClicksB(Math.max(0, Math.min(sentB, parseInt(e.target.value) || 0)))} style={{ fontSize: '0.85rem' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* Right Panel: Distribution charts & Stats results */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Confidence & Probability Curves</h3>
        
        {/* SVG Curve Plot */}
        <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          padding: '1rem',
          position: 'relative'
        }}>
          {pathA && pathB ? (
            <svg viewBox="0 0 460 160" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
              {/* Baseline Curve */}
              <path d={pathA} fill="rgba(59, 130, 246, 0.1)" stroke="var(--accent-blue)" strokeWidth="1.5" />
              {/* Challenger Curve */}
              <path d={pathB} fill="rgba(139, 92, 246, 0.15)" stroke="var(--accent-purple)" strokeWidth="1.5" />
              
              {/* Midpoint line */}
              <line x1="230" y1="0" x2="230" y2="160" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            </svg>
          ) : (
            <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Enter valid metrics to compute curves.
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-blue)', fontWeight: '600' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)' }} />
              Baseline Rate: {((pA || 0) * 100).toFixed(2)}%
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-purple)', fontWeight: '600' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-purple)' }} />
              Challenger Rate: {((pB || 0) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
 
        {/* Statistical calculations dashboard */}
        <div className="grid-compact-2col" style={{ marginTop: '0.5rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Statistical Confidence</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.2rem', color: stats.isSignificant ? 'var(--success)' : 'var(--warning)' }}>
              {stats.confidence}%
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              {stats.isSignificant ? '🟢 Statistically Significant' : '🟡 Insufficient Data'}
            </div>
          </div>

          <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Performance Lift</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.2rem', color: stats.lift >= 0 ? 'var(--success)' : 'var(--error)' }}>
              {stats.lift >= 0 ? `+${stats.lift}` : stats.lift}%
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              Difference: {stats.confidenceInterval ? `[${stats.confidenceInterval[0]}%, ${stats.confidenceInterval[1]}%]` : 'N/A'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
          <Info size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            Confidence interval of 95% indicates that if the campaign were repeated, the actual difference between variants B and A would fall within the listed bracket.
          </p>
        </div>

      </div>
    </div>
  );
}
