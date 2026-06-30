// Initial pre-seeded campaign metrics databases
export const SEED_CAMPAIGNS = [
  {
    id: 'nr-welcome-email',
    name: 'Nimbus Retail Welcome Lifecycle',
    channel: 'email',
    version: 'v1.4',
    status: 'Active',
    lastSynced: '2 days ago',
    sent: 154200,
    opens: 46260, // 30% Open Rate
    clicks: 16962, // 11% CTR
    conversions: 7710, // 5% Conversion Rate
    unsubscribes: 308, // 0.2%
    bounces: 154, // 0.1%
    gaStats: {
      sessions: 16450,
      bounceRate: 38.4,
      duration: 132,
      loadTime: 1.9,
      purchases: 7520,
      deviceSplit: {
        mobile: { bounceRate: 42.1, duration: 118, loadTime: 2.4 },
        desktop: { bounceRate: 32.5, duration: 156, loadTime: 1.1 }
      }
    },
    subjectLine: 'Your Welcome Reward Is Ready',
    templateHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nimbus Retail Welcome</title>
  <style>
    body { font-family: Helvetica, Arial, sans-serif; background-color: #f3f4f6; padding: 20px; margin: 0; }
    .card { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background-color: #002d62; padding: 30px; text-align: center; color: #ffffff; }
    .content { padding: 30px; color: #333333; line-height: 1.6; font-size: 14px; }
    .btn { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; background-color: #f43f5e; color: #ffffff !important; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 11px; color: #666666; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px; color: #ffffff;">Nimbus Retail Rewards</h1>
    </div>
    <div class="content">
      <h2>Welcome, {{ user.first_name | default: 'Valued Customer' }}!</h2>
      <p>We loaded a special reward into your account to say thanks for being an app member.</p>
      
      <!-- Branch logic -->
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <strong style="color: #b45309;">🌟 VIP GOLD MEMBERS-ONLY PERK:</strong><br>
        Exclusive welcome reward valid for Gold members only. Enjoy your double points day!
      </div>

      <p style="text-align: center; margin: 30px 0;">
        <a href="http://example.com/redeem" class="btn">Claim Welcome Reward</a>
      </p>
      <p>This offer is valid for 7 days at participating locations.</p>
    </div>
    <div class="footer">
      <p>© 2026 Nimbus Retail. If you wish to unsubscribe, click <a href="#" style="color: #94a3b8;">here</a>.</p>
    </div>
  </div>
</body>
</html>`,
    hotspots: [
      { id: 'h1', label: 'Header Banner', x: 50, y: 15, clicks: 1240, ctr: 0.8 },
      { id: 'h2', label: 'Claim CTA Button', x: 50, y: 62, clicks: 13878, ctr: 9.0 },
      { id: 'h3', label: 'Unsubscribe Link', x: 50, y: 88, clicks: 308, ctr: 0.2 }
    ],
    branches: [
      { name: 'VIP Gold Segment', expression: "tier == 'Gold'", triggered: 46260, clicks: 11565, conversions: 6013, ctr: 25.0, cvr: 13.0 },
      { name: 'Silver Tier Segment', expression: "tier == 'Silver'", triggered: 61680, clicks: 4317, conversions: 1480, ctr: 7.0, cvr: 2.4 },
      { name: 'Default Fallback Segment', expression: "default_fallback", triggered: 46260, clicks: 1080, conversions: 217, ctr: 2.3, cvr: 0.47 }
    ],
    deliverability: {
      gmail: { opens: 27756, total: 92520, rate: 30.0, status: 'Normal' },
      outlook: { opens: 13878, total: 46260, rate: 30.0, status: 'Normal' },
      yahoo: { opens: 4626, total: 15420, rate: 30.0, status: 'Normal' }
    },
    variants: {
      a: { subject: 'Your Welcome Reward Is Ready', sent: 77100, opens: 24672, clicks: 9252, ctr: 12.0 },
      b: { subject: 'A welcome offer is waiting for you', sent: 77100, opens: 21588, clicks: 7710, ctr: 10.0 }
    }
  },
  {
    id: 'nr-points-boost-push',
    name: 'Rewards Summer Points Boost',
    channel: 'push',
    version: 'v2.1',
    status: 'Completed',
    lastSynced: '1 week ago',
    sent: 320000,
    opens: 48000, // 15% Open/Direct click rate
    clicks: 16000, // 5% CTR
    conversions: 6400, // 2%
    unsubscribes: 1280, // 0.4% opt-outs
    bounces: 640, // 0.2% failed pushes
    gaStats: {
      sessions: 15200,
      bounceRate: 52.8,
      duration: 88,
      loadTime: 1.6,
      purchases: 6250,
      deviceSplit: {
        mobile: { bounceRate: 54.1, duration: 82, loadTime: 1.7 },
        desktop: { bounceRate: 42.0, duration: 125, loadTime: 1.1 }
      }
    },
    subjectLine: 'Summer Points Boost',
    pushBody: 'Get double points on summer picks today. Open the app to check your loyalty tier.',
    templateHtml: '',
    hotspots: [
      { id: 'h1', label: 'Push Direct Click', x: 50, y: 50, clicks: 48000, ctr: 15.0 }
    ],
    branches: [
      { name: 'High Engagement Segment', expression: "score > 80", triggered: 120000, clicks: 27600, conversions: 4800, ctr: 23.0, cvr: 4.0 },
      { name: 'Low Engagement Segment', expression: "score <= 80", triggered: 200000, clicks: 20400, conversions: 1600, ctr: 10.2, cvr: 0.8 }
    ],
    deliverability: {
      ios: { opens: 33600, total: 224000, rate: 15.0, status: 'Normal' },
      android: { opens: 14400, total: 96000, rate: 15.0, status: 'Normal' }
    },
    variants: {
      a: { subject: 'Get double points on summer picks today', sent: 160000, opens: 25600, clicks: 9600, ctr: 16.0 },
      b: { subject: 'Double your points on seasonal favorites', sent: 160000, opens: 22400, clicks: 6400, ctr: 14.0 }
    }
  },
  {
    id: 'nr-app-download-iam',
    name: 'Retail App Download Campaign',
    channel: 'iam',
    version: 'v1.0',
    status: 'Active',
    lastSynced: '3 days ago',
    sent: 85000,
    opens: 85000, // 100% Display rate for active sessions
    clicks: 22100, // 26% CTA Click rate
    conversions: 11050, // 13% App conversion rate
    unsubscribes: 425, // 0.5% Dismissals / opt-outs
    bounces: 0,
    gaStats: {
      sessions: 21800,
      bounceRate: 26.5,
      duration: 210,
      loadTime: 1.3,
      purchases: 10880,
      deviceSplit: {
        mobile: { bounceRate: 28.2, duration: 195, loadTime: 1.4 },
        desktop: { bounceRate: 21.0, duration: 250, loadTime: 0.9 }
      }
    },
    subjectLine: 'Get rewards in the Nimbus Retail App',
    iamHeader: 'Get the App',
    iamBody: 'Receive rewards on your birthday, unlock point multipliers, and get quick ordering.',
    iamButtonText: 'Get App',
    templateHtml: '',
    hotspots: [
      { id: 'h1', label: 'Primary Get App CTA', x: 50, y: 78, clicks: 22100, ctr: 26.0 },
      { id: 'h2', label: 'Dismiss Circle icon', x: 88, y: 15, clicks: 4250, ctr: 5.0 }
    ],
    branches: [
      { name: 'Mobile Web Referrals', expression: "source == 'web_referral'", triggered: 45000, clicks: 15300, conversions: 8100, ctr: 34.0, cvr: 18.0 },
      { name: 'Desktop Web Referrals', expression: "source == 'desktop'", triggered: 40000, clicks: 6800, conversions: 2950, ctr: 17.0, cvr: 7.3 }
    ],
    deliverability: {
      safari: { opens: 51000, total: 51000, rate: 100.0, status: 'Normal' },
      chrome: { opens: 34000, total: 34000, rate: 100.0, status: 'Normal' }
    },
    variants: {
      a: { subject: 'Get the app and unlock a welcome reward', sent: 42500, opens: 42500, clicks: 12750, ctr: 30.0 },
      b: { subject: 'Download the app for faster rewards', sent: 42500, opens: 42500, clicks: 9350, ctr: 22.0 }
    }
  },
  {
    id: 'nr-summer-multichannel',
    name: 'Nimbus Retail Summer Kickoff Blast',
    channels: ['email', 'push', 'sms'],
    channel: 'multi',
    version: 'v1.0',
    status: 'Completed',
    lastSynced: '1 day ago',
    sent: 680000,
    opens: 174000,
    clicks: 54400,
    conversions: 22400,
    unsubscribes: 1840,
    bounces: 1920,
    gaStats: {
      sessions: 52500,
      bounceRate: 44.2,
      duration: 120,
      loadTime: 1.8,
      purchases: 21850,
      deviceSplit: {
        mobile: { bounceRate: 48.0, duration: 105, loadTime: 2.1 },
        desktop: { bounceRate: 36.5, duration: 150, loadTime: 1.2 }
      }
    },
    subjectLine: 'Summer is here: member reward day',
    channelStats: {
      email: {
        sent: 400000,
        opens: 120000,
        clicks: 44000,
        conversions: 16000,
        unsubscribes: 800,
        bounces: 400,
        gaStats: {
          sessions: 42800,
          bounceRate: 39.5,
          duration: 138,
          loadTime: 1.9,
          purchases: 15650,
          deviceSplit: {
            mobile: { bounceRate: 43.0, duration: 122, loadTime: 2.3 },
            desktop: { bounceRate: 33.5, duration: 165, loadTime: 1.2 }
          }
        },
        subjectLine: 'Summer is here: member reward day',
        templateHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nimbus Retail Member Reward Day</title>
  <style>
    body { font-family: Helvetica, Arial, sans-serif; background-color: #f3f4f6; padding: 20px; margin: 0; }
    .card { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background-color: #0284c7; padding: 30px; text-align: center; color: #ffffff; }
    .content { padding: 30px; color: #333333; line-height: 1.6; font-size: 14px; }
    .btn { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; background-color: #f43f5e; color: #ffffff !important; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 11px; color: #666666; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px; color: #ffffff;">MEMBER REWARD DAY</h1>
    </div>
    <div class="content">
      <h2>Hi {{ user.first_name | default: 'Friend' }}!</h2>
      <p>Summer is officially here, and we want to welcome members back with a limited-time reward valid at participating locations.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="http://example.com/member-reward" class="btn">Claim Member Reward</a>
      </p>
      <p>Enjoy your summer treat!</p>
    </div>
    <div class="footer">
      <p>© 2026 Nimbus Retail. If you wish to unsubscribe, click <a href="#" style="color: #94a3b8;">here</a>.</p>
    </div>
  </div>
</body>
</html>`,
        hotspots: [
          { id: 'h1', label: 'Hero Header Banner', x: 50, y: 15, clicks: 9800, ctr: 2.45 },
          { id: 'h2', label: 'Claim Reward CTA Button', x: 50, y: 62, clicks: 33400, ctr: 8.35 },
          { id: 'h3', label: 'Unsubscribe Footer Link', x: 50, y: 88, clicks: 800, ctr: 0.2 }
        ]
      },
      push: {
        sent: 200000,
        opens: 30000,
        clicks: 8000,
        conversions: 4800,
        unsubscribes: 400,
        bounces: 1200,
        gaStats: {
          sessions: 7500,
          bounceRate: 54.0,
          duration: 85,
          loadTime: 1.5,
          purchases: 4680,
          deviceSplit: {
            mobile: { bounceRate: 55.0, duration: 80, loadTime: 1.6 },
            desktop: { bounceRate: 44.5, duration: 120, loadTime: 1.0 }
          }
        },
        subjectLine: 'Get a member reward today only',
        pushBody: 'Tap to load today’s member reward in the app.'
      },
      sms: {
        sent: 80000,
        opens: 24000,
        clicks: 2400,
        conversions: 1600,
        unsubscribes: 640,
        bounces: 320,
        gaStats: {
          sessions: 2200,
          bounceRate: 62.0,
          duration: 60,
          loadTime: 2.1,
          purchases: 1520,
          deviceSplit: {
            mobile: { bounceRate: 63.0, duration: 55, loadTime: 2.2 },
            desktop: { bounceRate: 52.0, duration: 90, loadTime: 1.4 }
          }
        },
        smsBody: 'Nimbus Retail: Summer rewards are live. Tap to claim today’s member offer: example.com/reward (Reply STOP to unsub)'
      }
    },
    branches: [
      { name: 'VIP Gold Segment', expression: "tier == 'Gold'", triggered: 180000, clicks: 25200, conversions: 12600, ctr: 14.0, cvr: 7.0 },
      { name: 'Silver Tier Segment', expression: "tier == 'Silver'", triggered: 250000, clicks: 20000, conversions: 7500, ctr: 8.0, cvr: 3.0 },
      { name: 'Standard Fallback', expression: "default_fallback", triggered: 250000, clicks: 9200, conversions: 2300, ctr: 3.68, cvr: 0.92 }
    ],
    deliverability: {
      gmail: { opens: 72000, total: 240000, rate: 30.0, status: 'Normal' },
      outlook: { opens: 36000, total: 120000, rate: 30.0, status: 'Normal' },
      ios: { opens: 25500, total: 170000, rate: 15.0, status: 'Normal' },
      android: { opens: 7500, total: 50000, rate: 15.0, status: 'Normal' },
      carrier_att: { opens: 13000, total: 40000, rate: 32.5, status: 'Normal' },
      carrier_tmobile: { opens: 8000, total: 30000, rate: 26.6, status: 'Warning' }
    },
    variants: {
      a: { subject: 'Summer is here: member reward day', sent: 340000, opens: 91800, clicks: 28900, ctr: 8.5 },
      b: { subject: 'Claim your member reward today', sent: 340000, opens: 82200, clicks: 25500, ctr: 7.5 }
    }
  }
];

const normalizeCampaign = (campaign, sourceType = 'seed') => ({
  sourceType,
  confidenceNotes: [],
  ...campaign
});

const buildSimulatedBrazeRecord = (campaignId) => ({
  id: campaignId,
  sourceType: 'simulated',
  confidenceNotes: ['No server-side Braze credentials were available, so OmniPulse generated a demo-shaped response.'],
  name: `Braze Campaign (${campaignId.substring(0, 8)})`,
  channel: 'email',
  version: 'v2.0',
  status: 'Completed',
  lastSynced: 'Just Now (Simulated)',
  sent: 250000,
  opens: 62500,
  clicks: 18750,
  conversions: 8750,
  unsubscribes: 500,
  bounces: 250,
  gaStats: {
    sessions: 18200,
    bounceRate: 40.5,
    duration: 125,
    loadTime: 1.8,
    purchases: 8500,
    deviceSplit: {
      mobile: { bounceRate: 44.5, duration: 110, loadTime: 2.2 },
      desktop: { bounceRate: 34.0, duration: 145, loadTime: 1.2 }
    }
  },
  subjectLine: 'Exclusive App Rewards Await!',
  templateHtml: `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
  <h2>Active Campaign: ${campaignId}</h2>
  <p>This preview uses simulated metrics because live Braze credentials are not configured.</p>
  <p style="text-align:center;"><a href="https://example.com?utm_source=braze&utm_medium=email&utm_campaign=${campaignId}" style="background:#8b5cf6; color:#fff; padding:10px 20px; text-decoration:none; border-radius:4px;">Action Link</a></p>
</body>
</html>`,
  hotspots: [
    { id: 'h1', label: 'Action Link', x: 50, y: 55, clicks: 18750, ctr: 7.5 }
  ],
  branches: [
    { name: 'High-Value Segment', expression: "segment == 'high_value'", triggered: 125000, clicks: 12500, conversions: 6250, ctr: 10.0, cvr: 5.0 },
    { name: 'Standard Segment', expression: "default_fallback", triggered: 125000, clicks: 6250, conversions: 2500, ctr: 5.0, cvr: 2.0 }
  ],
  deliverability: {
    gmail: { opens: 37500, total: 150000, rate: 25.0, status: 'Normal' },
    outlook: { opens: 25000, total: 100000, rate: 25.0, status: 'Normal' }
  },
  variants: {
    a: { subject: 'Exclusive App Rewards Await!', sent: 125000, opens: 34375, clicks: 10625, ctr: 8.5 },
    b: { subject: 'Save Big on Your Next Order', sent: 125000, opens: 28125, clicks: 8125, ctr: 6.5 }
  }
});

const numberFrom = (...values) => {
  for (const value of values) {
    const parsed = Number(String(value ?? '').replace(/[$,%\s]/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const buildBrazeRecord = (campaignId, data = {}, sourceType = 'live') => {
  const sent = numberFrom(data.total_sent, data.sent, data.messages_sent, 100000);
  const opens = numberFrom(data.opens, data.unique_opens, Math.round(sent * 0.22));
  const clicks = numberFrom(data.clicks, data.unique_clicks, Math.round(sent * 0.06));
  const conversions = numberFrom(data.conversions, data.purchases, Math.round(sent * 0.02));
  const unsubscribes = numberFrom(data.unsubscribes, data.unsubscribed, Math.round(sent * 0.002));
  const bounces = numberFrom(data.bounces, data.hard_bounces, data.soft_bounces, Math.round(sent * 0.001));
  const ctr = sent > 0 ? parseFloat(((clicks / sent) * 100).toFixed(1)) : 0;
  const openRate = sent > 0 ? parseFloat(((opens / sent) * 100).toFixed(1)) : 0;
  const conversionRate = sent > 0 ? parseFloat(((conversions / sent) * 100).toFixed(1)) : 0;
  const name = data.name || `Braze Campaign (${campaignId.substring(0, 8)})`;

  return {
    id: campaignId,
    sourceType,
    confidenceNotes: [
      'Braze totals are mapped from the campaign details payload; GA and branch fields remain inferred until a warehouse or Currents connector is configured.'
    ],
    name,
    channel: 'email',
    version: data.updated_at ? `Updated ${data.updated_at}` : 'v1.0',
    status: data.archived ? 'Archived' : 'Active',
    lastSynced: 'Synced Live',
    sent,
    opens,
    clicks,
    conversions,
    unsubscribes,
    bounces,
    gaStats: {
      sessions: Math.round(clicks * 0.97),
      bounceRate: 39.2,
      duration: 130,
      loadTime: 1.9,
      purchases: Math.round(conversions * 0.98),
      deviceSplit: {
        mobile: { bounceRate: 43.1, duration: 115, loadTime: 2.3 },
        desktop: { bounceRate: 33.2, duration: 160, loadTime: 1.1 }
      }
    },
    subjectLine: data.message || data.subject || 'Synced Braze Email Subject',
    templateHtml: `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
  <h2>${name}</h2>
  <p>Campaign metrics were synced from Braze. Click attribution and GA fields are inferred until linked event exports are available.</p>
  <p style="text-align:center;"><a href="https://example.com?utm_source=braze&utm_medium=email&utm_campaign=${campaignId}" style="background:#2563eb; color:#fff; padding:10px 20px; text-decoration:none; border-radius:4px;">Main Action Link</a></p>
</body>
</html>`,
    hotspots: [
      { id: 'h1', label: 'Main Action Link', x: 50, y: 55, clicks, ctr }
    ],
    branches: [
      { name: 'Target Audience', expression: 'is_targeted == true', triggered: sent, clicks, conversions, ctr, cvr: conversionRate }
    ],
    deliverability: {
      gmail: { opens: Math.round(opens * 0.6), total: Math.round(sent * 0.6), rate: openRate, status: 'Inferred' },
      outlook: { opens: Math.round(opens * 0.4), total: Math.round(sent * 0.4), rate: openRate, status: 'Inferred' }
    },
    variants: {
      a: { subject: 'Synced Variant A', sent: Math.round(sent / 2), opens: Math.round(opens / 2), clicks: Math.round(clicks / 2), ctr },
      b: { subject: 'Synced Variant B', sent: Math.round(sent / 2), opens: Math.round(opens * 0.45), clicks: Math.round(clicks * 0.4), ctr: parseFloat((ctr * 0.8).toFixed(1)) }
    }
  };
};

export const loadCampaigns = () => {
  const custom = localStorage.getItem('omnipulse_campaigns');
  if (custom) {
    try {
      const parsed = JSON.parse(custom);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(c => c && typeof c === 'object' && c.id).map(c => normalizeCampaign(c, c.sourceType || 'imported'));
        return filtered.length > 0 ? filtered : SEED_CAMPAIGNS.map(c => normalizeCampaign(c, 'seed'));
      }
    } catch {
      return SEED_CAMPAIGNS.map(c => normalizeCampaign(c, 'seed'));
    }
  }
  return SEED_CAMPAIGNS.map(c => normalizeCampaign(c, 'seed'));
};

export const saveCampaigns = (campaigns) => {
  localStorage.setItem('omnipulse_campaigns', JSON.stringify(campaigns));
};

// Fetch metrics from Braze REST API campaign details endpoint
export const fetchBrazeCampaignStats = async (campaignId, endpoint, apiKey) => {
  if (!apiKey && !endpoint) {
    return buildSimulatedBrazeRecord(campaignId);
  }

  const serverResponse = await fetch('/api/brazeCampaign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId })
  });

  if (serverResponse.ok && serverResponse.headers.get('content-type')?.includes('application/json')) {
    return buildBrazeRecord(campaignId, await serverResponse.json(), 'live');
  }

  if (!apiKey || !endpoint) return buildSimulatedBrazeRecord(campaignId);

  const cleanEndpoint = endpoint.replace(/\/$/, '');
  const url = `${cleanEndpoint}/campaigns/details?campaign_id=${encodeURIComponent(campaignId)}`;
  const directResponse = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (!directResponse.ok) throw new Error(`Braze API returned status ${directResponse.status}`);
  return buildBrazeRecord(campaignId, await directResponse.json(), 'live');
};

// Parser to parse uploaded CSV logs
const parseCsvRows = (csvText) => {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell.trim());
      if (row.some(value => value !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(value => value !== '')) rows.push(row);
  if (inQuotes) throw new Error('CSV contains an unclosed quoted field.');
  return rows;
};

export const parseCsvCampaignLog = (csvText) => {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) throw new Error("CSV must contain headers and at least one row.");

  const headers = rows[0].map(header => header.toLowerCase().trim());
  
  // Required columns check
  const required = ['name', 'channel', 'sent', 'opens', 'clicks', 'conversions'];
  const missing = required.filter(col => !headers.includes(col));
  if (missing.length > 0) {
    throw new Error(`Missing required CSV columns: ${missing.join(', ')}`);
  }
  
  const getColIndex = (col) => headers.indexOf(col);
  const read = (cols, col, fallback = '') => {
    const idx = getColIndex(col);
    return idx >= 0 ? cols[idx] ?? fallback : fallback;
  };
  
  const parsed = rows.slice(1).map((cols, idx) => {
    if (cols.length !== headers.length) {
      throw new Error(`Row ${idx + 2} has ${cols.length} columns, expected ${headers.length}. Check quotes or commas.`);
    }

    const sent = numberFrom(read(cols, 'sent'));
    const opens = numberFrom(read(cols, 'opens'));
    const clicks = numberFrom(read(cols, 'clicks'));
    const conversions = numberFrom(read(cols, 'conversions'));
    const unsubscribes = getColIndex('unsubscribes') !== -1 ? numberFrom(read(cols, 'unsubscribes')) : Math.round(sent * 0.002);
    const bounces = getColIndex('bounces') !== -1 ? numberFrom(read(cols, 'bounces')) : Math.round(sent * 0.001);
    
    const gaSessions = Math.round(clicks * 0.96);
    const gaPurchases = Math.round(conversions * 0.97);
    
    const channel = (read(cols, 'channel', 'email') || 'email').toLowerCase().trim();
    const name = read(cols, 'name') || `Imported Campaign #${idx + 1}`;
    const clickRate = sent > 0 ? parseFloat(((clicks / sent) * 100).toFixed(1)) : 0;
    const conversionRate = sent > 0 ? parseFloat(((conversions / sent) * 100).toFixed(1)) : 0;
    
    return {
      id: `imported-${Date.now()}-${idx}`,
      sourceType: 'imported',
      confidenceNotes: [
        'CSV import provides campaign totals. Clickmap coordinates, GA detail, and branch attribution are inferred until richer event exports are connected.'
      ],
      name,
      channel,
      version: 'v1.0',
      status: 'Active',
      lastSynced: 'Just Imported',
      sent,
      opens,
      clicks,
      conversions,
      unsubscribes,
      bounces,
      gaStats: {
        sessions: gaSessions,
        bounceRate: 41.5,
        duration: 110,
        loadTime: 2.1,
        purchases: gaPurchases,
        deviceSplit: {
          mobile: { bounceRate: 46.2, duration: 95, loadTime: 2.5 },
          desktop: { bounceRate: 35.0, duration: 140, loadTime: 1.3 }
        }
      },
      subjectLine: read(cols, 'subject') || 'Imported Campaign',
      templateHtml: `<!DOCTYPE html>
<html>
<body>
  <div style="padding: 20px; font-family: sans-serif;">
    <h2>${name}</h2>
    <p>This campaign was imported from your CSV logs.</p>
    <p style="text-align:center; margin: 30px;"><a href="https://example.com?utm_source=csv&utm_medium=${channel}&utm_campaign=${encodeURIComponent(name)}" style="background-color: #2563eb; color:#fff; padding:10px 20px; text-decoration:none; border-radius:4px;">Action Link</a></p>
  </div>
</body>
</html>`,
      hotspots: [
        { id: 'h1', label: 'Action Link', x: 50, y: 52, clicks, ctr: clickRate }
      ],
      branches: [
        { name: 'Target Audience', expression: 'is_targeted == true', triggered: sent, clicks, conversions, ctr: clickRate, cvr: conversionRate }
      ],
      deliverability: {
        gmail: { opens: Math.round(opens * 0.6), total: Math.round(sent * 0.6), rate: sent > 0 ? parseFloat(((opens / sent) * 100).toFixed(1)) : 0, status: 'Inferred' },
        outlook: { opens: Math.round(opens * 0.4), total: Math.round(sent * 0.4), rate: sent > 0 ? parseFloat(((opens / sent) * 100).toFixed(1)) : 0, status: 'Inferred' }
      },
      variants: {
        a: { subject: read(cols, 'subject') || 'Variant A Subject', sent: Math.round(sent / 2), opens: Math.round(opens / 2), clicks: Math.round(clicks / 2), ctr: clickRate },
        b: { subject: 'Variant B Alternative Option', sent: Math.round(sent / 2), opens: Math.round(opens * 0.45), clicks: Math.round(clicks * 0.4), ctr: parseFloat((clickRate * 0.8).toFixed(1)) }
      }
    };
  });
  
  return parsed;
};

// Storage for saved reports archive snapshots
export const loadSavedReports = () => {
  const data = localStorage.getItem('omnipulse_saved_reports');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return [];
    }
  }
  return [];
};

export const saveReportSnapshot = (campaignName, statsSnapshot, postMortemText) => {
  const list = loadSavedReports();
  const now = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const existingIndex = list.findIndex(r => r.campaignName === campaignName);
  const report = {
    id: existingIndex >= 0 ? list[existingIndex].id : `snapshot-${Date.now()}`,
    campaignName,
    dateSaved: now,
    dateUpdated: existingIndex >= 0 ? now : null,
    stats: statsSnapshot,
    postMortem: postMortemText
  };
  const updated = existingIndex >= 0
    ? [report, ...list.filter((_, idx) => idx !== existingIndex)]
    : [report, ...list];
  localStorage.setItem('omnipulse_saved_reports', JSON.stringify(updated));
  return updated;
};

export const deleteSavedReport = (reportId) => {
  const list = loadSavedReports();
  const filtered = list.filter(r => r.id !== reportId);
  localStorage.setItem('omnipulse_saved_reports', JSON.stringify(filtered));
  return filtered;
};
