import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { sanitizeTemplateHtml } from '../utils/safeHtml';

export default function VisualAttribution({ campaign }) {
  const [hoveredHotspot, setHoveredHotspot] = useState(null);

  const renderSimulatedFrame = () => {
    switch (campaign.channel) {
      case 'email':
        return (
          <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', backgroundColor: '#fff' }}>
            <div className="hotspot-container" style={{ position: 'relative', height: '520px', width: '100%' }}>
              <iframe
                title="Email Campaign Visual Preview"
                sandbox=""
                srcDoc={sanitizeTemplateHtml(campaign.templateHtml)}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
              {/* Hotspots Overlay */}
              {campaign.hotspots?.map(spot => (
                <div
                  key={spot.id}
                  className="hotspot-trigger"
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  onMouseEnter={() => setHoveredHotspot(spot)}
                  onMouseLeave={() => setHoveredHotspot(null)}
                >
                  {hoveredHotspot && hoveredHotspot.id === spot.id && (
                    <div className="hotspot-tooltip">
                      <div style={{ fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.2rem', marginBottom: '0.2rem', color: '#fff' }}>
                        {spot.label}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.2rem 0' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Clicks:</span>
                        <span style={{ fontWeight: '600', color: 'var(--accent-cyan)' }}>{spot.clicks.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>CTR:</span>
                        <span style={{ fontWeight: '600', color: 'var(--accent-purple)' }}>{spot.ctr}%</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'push':
        return (
          <div className="phone-wrapper fade-in">
            <div className="phone-mockup" style={{ width: '300px', height: '500px', borderRadius: '32px' }}>
              <div className="phone-notch" style={{ width: '110px', height: '18px' }} />
              <div style={{
                flex: 1,
                backgroundImage: 'url("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&width=600&auto=format&fit=crop")',
                backgroundSize: 'cover',
                padding: '3rem 1rem 1rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                position: 'relative'
              }}>
                {/* Simulated Push Notification Card */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '0.85rem',
                  color: '#fff',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nimbus Retail</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>now</span>
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{campaign.subjectLine}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '0.1rem', lineHeight: '1.3' }}>{campaign.pushBody}</div>
                  
                  {/* Push click hotspot */}
                  {campaign.hotspots?.map(spot => (
                    <div
                      key={spot.id}
                      className="hotspot-trigger"
                      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                      onMouseEnter={() => setHoveredHotspot(spot)}
                      onMouseLeave={() => setHoveredHotspot(null)}
                    >
                      {hoveredHotspot && hoveredHotspot.id === spot.id && (
                        <div className="hotspot-tooltip" style={{ width: '130px' }}>
                          <div style={{ fontWeight: '700', marginBottom: '0.2rem', color: '#fff' }}>{spot.label}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Clicks:</span>
                            <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>{spot.clicks.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Open Rate:</span>
                            <span style={{ color: 'var(--accent-purple)', fontWeight: '600' }}>{spot.ctr}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'sms':
        return (
          <div className="phone-wrapper fade-in">
            <div className="phone-mockup" style={{ width: '300px', height: '500px', borderRadius: '32px' }}>
              <div className="phone-notch" style={{ width: '110px', height: '18px' }} />
              <div style={{
                flex: 1,
                backgroundColor: '#000',
                paddingTop: '2rem',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ padding: '0.6rem', borderBottom: '1px solid #1f2937', textAlign: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: '600' }}>
                  Nimbus Retail Support
                </div>
                <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'flex-start' }}>
                  <div style={{
                    alignSelf: 'flex-start',
                    backgroundColor: '#1f2937',
                    color: '#fff',
                    borderRadius: '16px',
                    padding: '0.75rem 0.85rem',
                    fontSize: '0.78rem',
                    maxWidth: '85%',
                    lineHeight: '1.4',
                    position: 'relative'
                  }}>
                    {campaign.smsBody || campaign.subjectLine}
                    
                    {/* SMS Link Hotspot */}
                    <div
                      className="hotspot-trigger"
                      style={{ left: '85%', top: '85%' }}
                      onMouseEnter={() => setHoveredHotspot({ id: 'sms-link', label: 'SMS Coupon Link', clicks: campaign.clicks, ctr: parseFloat(((campaign.clicks / campaign.sent) * 100).toFixed(1)) })}
                      onMouseLeave={() => setHoveredHotspot(null)}
                    >
                      {hoveredHotspot && (
                        <div className="hotspot-tooltip" style={{ width: '130px', transform: 'translate(-50%, calc(-100% - 15px))' }}>
                          <div style={{ fontWeight: '700', marginBottom: '0.2rem', color: '#fff' }}>{hoveredHotspot.label}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Clicks:</span>
                            <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>{hoveredHotspot.clicks.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>CTR:</span>
                            <span style={{ color: 'var(--accent-purple)', fontWeight: '600' }}>{hoveredHotspot.ctr}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'iam':
        return (
          <div className="phone-wrapper fade-in">
            <div className="phone-mockup" style={{ width: '300px', height: '500px', borderRadius: '32px' }}>
              <div className="phone-notch" style={{ width: '110px', height: '18px' }} />
              <div style={{
                flex: 1,
                backgroundColor: '#111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                position: 'relative'
              }}>
                {/* Simulated App Screen background blur */}
                <div style={{ opacity: 0.15, width: '100%', fontSize: '0.5rem', color: '#fff', userSelect: 'none' }}>
                  {Array(25).fill("Lorem ipsum dolor sit amet, consectetur adipiscing elit.").join(" ")}
                </div>
                
                {/* In App Message Modal Card Overlay */}
                <div style={{
                  position: 'absolute',
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '16px',
                  width: '85%',
                  padding: '1.25rem',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                  textAlign: 'center',
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{campaign.iamHeader}</div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af', lineHeight: '1.4' }}>{campaign.iamBody}</div>
                  <div style={{
                    display: 'inline-block',
                    backgroundColor: '#f43f5e',
                    color: '#fff',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    marginTop: '0.25rem',
                    position: 'relative'
                  }}>
                    {campaign.iamButtonText}

                    {/* Button hotspot */}
                    {campaign.hotspots?.filter(s => s.id === 'h1').map(spot => (
                      <div
                        key={spot.id}
                        className="hotspot-trigger"
                        style={{ left: `${spot.x}%`, top: '50%' }}
                        onMouseEnter={() => setHoveredHotspot(spot)}
                        onMouseLeave={() => setHoveredHotspot(null)}
                      >
                        {hoveredHotspot && hoveredHotspot.id === spot.id && (
                          <div className="hotspot-tooltip" style={{ width: '130px', transform: 'translate(-50%, calc(-100% - 15px))' }}>
                            <div style={{ fontWeight: '700', marginBottom: '0.2rem', color: '#fff' }}>{spot.label}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Clicks:</span>
                              <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>{spot.clicks.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>CTR:</span>
                              <span style={{ color: 'var(--accent-purple)', fontWeight: '600' }}>{spot.ctr}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="split-view fade-in">
      {/* Left panel: Simulated viewports and overlay */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Visual Attribution clickmap</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Hover over neon hotspots to view performance metrics directly attributed to specific template elements.
          </p>
        </div>

        {renderSimulatedFrame()}
      </div>

      {/* Right panel: Tabular breakdown of hotspots data */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Hotspot Performance Ledger</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="audit-table">
            <thead>
              <tr>
                <th>Element ID</th>
                <th>Target Element</th>
                <th style={{ textAlign: 'right' }}>Unique Clicks</th>
                <th style={{ textAlign: 'right' }}>Performance CTR</th>
              </tr>
            </thead>
            <tbody>
              {campaign.hotspots && campaign.hotspots.length > 0 ? (
                campaign.hotspots.map(spot => (
                  <tr key={spot.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{spot.id}</td>
                    <td style={{ fontWeight: '600' }}>{spot.label}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>{spot.clicks.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--accent-purple)' }}>{spot.ctr}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No coordinate hotspots mapped for this campaign type.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', marginTop: 'auto' }}>
          <Info size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            <strong>How are click hotspots calculated?</strong> Coordinate points are generated by mapping click metrics from your CRM’s raw event payloads against absolute grid widths in the template HTML structure.
          </p>
        </div>
      </div>
    </div>
  );
}
