import React, { useState } from 'react';
import { Mail, MessageSquare, Smartphone, Monitor, Search, Layers } from 'lucide-react';

export default function Catalog({ campaigns, activeCampaignId, setActiveCampaignId }) {
  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState('all');

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email': return <Mail size={16} />;
      case 'sms': return <MessageSquare size={16} />;
      case 'push': return <Smartphone size={16} />;
      case 'iam': return <Monitor size={16} />;
      default: return <Layers size={16} />;
    }
  };

  const getChannelColor = (channel) => {
    switch (channel) {
      case 'email': return '#3b82f6';
      case 'sms': return '#10b981';
      case 'push': return '#8b5cf6';
      case 'iam': return '#06b6d4';
      default: return '#64748b';
    }
  };

  const filtered = campaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.subjectLine?.toLowerCase().includes(search.toLowerCase());
    const matchesChannel = filterChannel === 'all' || c.channel === filterChannel;
    return matchesSearch && matchesChannel;
  });

  return (
    <div className="panel fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Campaign Workspace Catalog</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Select an active or completed campaign to analyze post-deployment performance metrics.
          </p>
        </div>
        
        {/* Search & Channel Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '32px', width: '220px', fontSize: '0.85rem' }}
            />
          </div>
          
          <select
            className="form-select"
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            style={{ width: '130px', fontSize: '0.85rem' }}
          >
            <option value="all">All Channels</option>
            <option value="email">Email</option>
            <option value="push">Push Notification</option>
            <option value="sms">SMS Chat</option>
            <option value="iam">In-App Message</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
            No campaigns matched your active filters.
          </div>
        ) : (
          filtered.map(campaign => {
            const isActive = campaign.id === activeCampaignId;
            const openRate = ((campaign.opens / campaign.sent) * 100).toFixed(1);
            const ctr = ((campaign.clicks / campaign.sent) * 100).toFixed(1);
            const cvr = ((campaign.conversions / campaign.sent) * 100).toFixed(1);
            
            return (
              <div
                key={campaign.id}
                onClick={() => setActiveCampaignId(campaign.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem',
                  backgroundColor: isActive ? 'rgba(139, 92, 246, 0.05)' : 'var(--bg-tertiary)',
                  border: `1px solid ${isActive ? 'rgba(139, 92, 246, 0.3)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--border-radius-md)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: getChannelColor(campaign.channel)
                  }}>
                    {getChannelIcon(campaign.channel)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: isActive ? '#fff' : 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {campaign.name}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', alignItems: 'center' }}>
                      <span>Version: <strong>{campaign.version}</strong></span>
                      <span>•</span>
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        backgroundColor: campaign.status === 'Active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.04)',
                        color: campaign.status === 'Active' ? 'var(--success)' : 'var(--text-secondary)'
                      }}>{campaign.status}</span>
                      <span>•</span>
                      <span>Synced: {campaign.lastSynced}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Volume Sent</div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{campaign.sent.toLocaleString()}</div>
                  </div>
                  {campaign.channel !== 'sms' && campaign.channel !== 'iam' && (
                    <div style={{ textAlign: 'right', minWidth: '70px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open Rate</div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--accent-cyan)' }}>{openRate}%</div>
                    </div>
                  )}
                  <div style={{ textAlign: 'right', minWidth: '70px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CTR</div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--accent-purple)' }}>{ctr}%</div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '70px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Conv. Rate</div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--success)' }}>{cvr}%</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
