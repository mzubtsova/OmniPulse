// Gemini API integrations for OmniPulse

const SYSTEM_INSTRUCTION = "You are a senior MarTech growth analyst. Your goal is to write highly concise, actionable, and executive-ready post-mortem summaries for CRM campaign managers based on performance metrics. DO NOT write any introductory or concluding conversational filler (e.g., do not say 'Here is the report' or write campaign header titles). Start your response directly with the section headers: '### 🏆 Key Findings', '### ⚠️ Performance Red Flags', and '### 🎯 Recommended Adjustments'.";

// Live Gemini API request
async function callGeminiApi(prompt, apiKey) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${prompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1000
        }
      })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Gemini API Error');
    }
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

// Generate campaign post-mortems
export const generateCampaignPostMortem = async (campaign, apiKey) => {
  if (!apiKey) {
    // Keyless Mock mode fallback summaries
    return getMockSummary(campaign.id, campaign.channel);
  }

  const prompt = `
Write a Campaign Performance Post-Mortem and Optimization report for:
Campaign Name: "${campaign.name}"
Channel: "${campaign.channel}"
Metrics Summary:
- Total Sent: ${campaign.sent}
- Open Rate: ${campaign.opens ? ((campaign.opens / campaign.sent) * 100).toFixed(2) : 0}% (${campaign.opens || 0} opens)
- Click-Through Rate: ${campaign.clicks ? ((campaign.clicks / campaign.sent) * 100).toFixed(2) : 0}% (${campaign.clicks || 0} clicks)
- Conversion Rate: ${campaign.conversions ? ((campaign.conversions / campaign.sent) * 100).toFixed(2) : 0}% (${campaign.conversions || 0} conversions)
- Unsubscribe Rate: ${campaign.unsubscribes ? ((campaign.unsubscribes / campaign.sent) * 100).toFixed(2) : 0}% (${campaign.unsubscribes || 0} unsubscribes)

A/B Test Variant Performance:
- Variant A (Baseline): ${campaign.variants?.a ? `${campaign.variants.a.subject} -> CTR: ${campaign.variants.a.ctr}%` : 'N/A'}
- Variant B (Challenger): ${campaign.variants?.b ? `${campaign.variants.b.subject} -> CTR: ${campaign.variants.b.ctr}%` : 'N/A'}

Liquid Personalization Branch Results:
${campaign.branches?.map(b => `- Branch Name: "${b.name}" -> Clicks: ${b.clicks}, Conversions: ${b.conversions}, CTR: ${b.ctr}%, Conv. Rate: ${b.cvr}%`).join('\n')}

Structure your response into 3 concise bulleted sections:
1. **🏆 Key Findings**: Who won the A/B test and what cohort drove the most conversions.
2. **⚠️ Performance Red Flags**: What failed (e.g. branch drop-offs, list fatigue, or unsubs).
3. **🎯 Recommended Adjustments**: Concrete code or segment changes for next deploy.
`;

  return callGeminiApi(prompt, apiKey);
};

// Explain deliverability anomalies
export const generateAnomalyExplanation = async (clientName, rate, overallRate, apiKey) => {
  if (!apiKey) {
    return `**AI Anomaly Insight**: The open rate for **${clientName}** (${rate}%) is significantly lower than your campaign's average open rate. This deviation indicates a high likelihood of ISP inbox sorting issues. Recommend checking that your email template uses correct HTML syntax, avoids empty links, and is fully responsive to prevent dark mode rendering problems or layout truncation that triggers automatic spam filtering.`;
  }

  const prompt = `
Analyze the following email campaign deliverability anomaly:
- Email Client: "${clientName}"
- Client Specific Open Rate: ${rate}%
- Overall Campaign Average Open Rate: ${overallRate}%

Write a short 2-sentence explanation of what could be causing this difference (e.g. dark mode CSS bug, link filtering, or spam folder placement) and a recommendation on how to debug it. Keep it brief.
`;

  return callGeminiApi(prompt, apiKey);
};

// Natural Language to SQL Analytics Query Engine
export const queryCampaignDataWithAi = async (userQuery, campaign, apiKey) => {
  if (!apiKey) {
    // Sandbox Mock Mode fallback parser
    return getMockQueryResults(userQuery, campaign);
  }

  const prompt = `
Translate this natural language marketing analysis question into a clean SQL query and calculate the corresponding results.

User Question: "${userQuery}"

Campaign Data Context:
- Name: "${campaign.name}"
- Channel: "${campaign.channel}"
- Overall metrics: Sent: ${campaign.sent}, Opens: ${campaign.opens}, Clicks: ${campaign.clicks}, Conversions: ${campaign.conversions}
- A/B Variants:
  * Variant A: Subject: "${campaign.variants?.a?.subject}", Sent: ${campaign.variants?.a?.sent}, Opens/Clicks: ${campaign.variants?.a?.opens || campaign.variants?.a?.clicks}, CTR: ${campaign.variants?.a?.ctr}%
  * Variant B: Subject: "${campaign.variants?.b?.subject}", Sent: ${campaign.variants?.b?.sent}, Opens/Clicks: ${campaign.variants?.b?.opens || campaign.variants?.b?.clicks}, CTR: ${campaign.variants?.b?.ctr}%
- Liquid logic branches:
  ${campaign.branches?.map(b => `* Name: "${b.name}", Condition: "${b.expression}", Triggered: ${b.triggered}, Clicks: ${b.clicks}, Conversions: ${b.conversions}, CTR: ${b.ctr}%, CVR: ${b.cvr}%`).join('\n')}
- Deliverability:
  ${campaign.deliverability ? Object.entries(campaign.deliverability).map(([k, v]) => `* Client: "${k}", Sent: ${v.total}, Opens: ${v.opens}, Rate: ${v.rate}%`).join('\n') : 'N/A'}

Assume a standard CRM analytics database schema:
- \`campaign_events\` table with columns: \`campaign_id\`, \`campaign_name\`, \`event_type\` ('sent', 'open', 'click', 'conversion'), \`user_id\`, \`inbox_provider\`, \`device_os\`, \`liquid_branch_expression\`, \`ab_variant\`.

Generate a JSON response. You MUST return ONLY a raw JSON block matching this structure:
{
  "sql": "SELECT ... FROM ...",
  "resultHeaders": ["Column 1", "Column 2", ...],
  "resultRows": [
    ["Row 1 Cell 1", "Row 1 Cell 2", ...],
    ["Row 2 Cell 1", "Row 2 Cell 2", ...]
  ],
  "insight": "A brief 2-sentence explanation of what these results mean."
}
`;

  try {
    const rawText = await callGeminiApi(prompt, apiKey);
    
    // Clean potential markdown wrap
    const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to parse Gemini SQL response:", error);
    // Fallback to local mockup parser if JSON parsing fails
    return getMockQueryResults(userQuery, campaign);
  }
};

// Local mockup query parser for sandbox simulation
function getMockQueryResults(userQuery, campaign) {
  const query = userQuery.toLowerCase();
  
  if (query.includes('variant') || query.includes('a/b') || query.includes('subject')) {
    const pA = campaign.variants?.a ? campaign.variants.a.ctr : 0;
    const pB = campaign.variants?.b ? campaign.variants.b.ctr : 0;
    return {
      sql: `SELECT ab_variant, \n       COUNT(CASE WHEN event_type = 'click' THEN 1 END) as unique_clicks, \n       ROUND(COUNT(CASE WHEN event_type = 'click' THEN 1 END) * 100.0 / COUNT(CASE WHEN event_type = 'sent' THEN 1 END), 2) as ctr_pct \nFROM campaign_events \nWHERE campaign_id = '${campaign.id}' \nGROUP BY 1 \nORDER BY 3 DESC;`,
      resultHeaders: ["Variant ID", "Subject Copy Line", "Unique Clicks", "CTR %"],
      resultRows: [
        ["Variant A (Baseline)", campaign.variants?.a?.subject || "Default Copy", (campaign.variants?.a?.clicks || Math.round(campaign.clicks * 0.5)).toLocaleString(), `${pA}%`],
        ["Variant B (Challenger)", campaign.variants?.b?.subject || "Challenger Copy", (campaign.variants?.b?.clicks || Math.round(campaign.clicks * 0.45)).toLocaleString(), `${pB}%`]
      ],
      insight: `The baseline Variant A outperformed Challenger Variant B by ${Math.abs(pA - pB).toFixed(1)}% click rate. This confirms that clearer, benefit-driven subject lines drive better activation metrics than urgency-focused copy.`
    };
  }

  if (query.includes('segment') || query.includes('branch') || query.includes('liquid') || query.includes('tier')) {
    const rows = (campaign.branches || []).map(b => [
      b.name,
      b.expression,
      b.triggered.toLocaleString(),
      b.clicks.toLocaleString(),
      `${b.ctr}%`,
      `${b.cvr}%`
    ]);
    return {
      sql: `SELECT liquid_branch_expression, \n       COUNT(CASE WHEN event_type = 'sent' THEN 1 END) as triggered,\n       COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks,\n       ROUND(COUNT(CASE WHEN event_type = 'click' THEN 1 END) * 100.0 / COUNT(CASE WHEN event_type = 'sent' THEN 1 END), 2) as ctr\nFROM campaign_events\nGROUP BY 1\nORDER BY 4 DESC;`,
      resultHeaders: ["Segment Block Name", "Expression Condition", "Triggered", "Clicks", "Branch CTR", "Conversion Rate"],
      resultRows: rows.length > 0 ? rows : [["Default Fallback", "default_fallback", "154,200", "16,962", "11.0%", "5.0%"]],
      insight: "Personalized Liquid blocks targeting the VIP Gold segment registered the highest conversions. Fallback default paths are heavily underperforming, indicating a need for localized dynamic copy."
    };
  }

  if (query.includes('inbox') || query.includes('gmail') || query.includes('client') || query.includes('deliverability')) {
    const rows = campaign.deliverability ? Object.entries(campaign.deliverability).map(([k, v]) => [
      k.toUpperCase(),
      v.total.toLocaleString(),
      v.opens.toLocaleString(),
      `${v.rate}%`
    ]) : [["GMAIL", "92,520", "27,756", "30%"], ["OUTLOOK", "46,260", "13,878", "30%"]];

    return {
      sql: `SELECT inbox_provider, \n       COUNT(CASE WHEN event_type = 'sent' THEN 1 END) as sent_volume,\n       COUNT(CASE WHEN event_type = 'open' THEN 1 END) as opens,\n       ROUND(COUNT(CASE WHEN event_type = 'open' THEN 1 END) * 100.0 / COUNT(CASE WHEN event_type = 'sent' THEN 1 END), 2) as open_rate\nFROM campaign_events\nGROUP BY 1\nORDER BY 4 DESC;`,
      resultHeaders: ["Inbox Provider", "Volume Sent", "Opens", "Open Rate %"],
      resultRows: rows,
      insight: "Inbox providers show healthy open rate balances. Any client falling below 25% open rate suggests potential spam filtering or content clipping issues."
    };
  }

  // Generic summary default response
  return {
    sql: `SELECT event_type, COUNT(*) as event_count \nFROM campaign_events \nWHERE campaign_id = '${campaign.id}' \nGROUP BY 1;`,
    resultHeaders: ["Event Type", "Event Count", "Conversion % of Sent"],
    resultRows: [
      ["sent", campaign.sent.toLocaleString(), "100.0%"],
      ["open", campaign.channel === 'sms' || campaign.channel === 'iam' ? 'N/A' : campaign.opens.toLocaleString(), campaign.channel === 'sms' || campaign.channel === 'iam' ? 'N/A' : `${((campaign.opens / campaign.sent) * 100).toFixed(1)}%`],
      ["click", campaign.clicks.toLocaleString(), `${((campaign.clicks / campaign.sent) * 100).toFixed(1)}%`],
      ["conversion", campaign.conversions.toLocaleString(), `${((campaign.conversions / campaign.sent) * 100).toFixed(1)}%`]
    ],
    insight: `Campaign statistics overview ledger for "${campaign.name}". CTR stands stable at ${((campaign.clicks / campaign.sent) * 100).toFixed(1)}% with standard bounces.`
  };
}

// Seeds for mock fallback mode
function getMockSummary(id, channel) {
  const lookupKey = id === 'dq-summer-multichannel' ? `${id}-${channel}` : id;
  const summaries = {
    'dq-summer-multichannel-multi': `### 🏆 Key Findings
* **Email Leads Conversions**: Multi-channel kickoff analysis shows **Email** delivered **16,000 conversions** ($720,000 revenue), accounting for 71.4% of total sales.
* **Push High CTR**: Mobile App push notifications yielded the highest engagement rate with a **15.0% direct click rate**.

### ⚠️ Performance Red Flags
* **SMS Fatigue**: The SMS channel recorded an alarming **0.8% unsubscribe rate** (640 opt-outs), indicating that SMS broadcast sends have high fatigue risks.
* **Bounce Rate in Push**: Push bounces reached **1,200 failed notifications**, signaling token delivery issues.

### 🎯 Recommended Adjustments
* **Cap SMS Sends**: Throttle SMS messages to high-intent cohorts only.
* **Email Template Sync**: Migrate successful email template styles to the main lifecycle flow.`,

    'dq-summer-multichannel-email': `### 🏆 Key Findings
* **Variant A Won**: Subject line **"Summer is HERE: Free Blizzard Day! 🍦"** outperformed Variant B by an 11% CTR lift.
* **Hero Button Leads**: The clickmap shows the **Claim Blizzard CTA** button generated 76% of total link clicks.

### ⚠️ Performance Red Flags
* **Fallback Rate Drops**: Users who fell into the **Standard Fallback segment** converted at only **0.92%**, indicating that unpersonalized templates have low yield.
* **Spam Trap Alerts**: Soft listings on Gmail were noted due to volume spikes.

### 🎯 Recommended Adjustments
* **Insert Dynamic Liquid**: Replace default copy fallbacks with personalized location tokens.
* **Warm Sender IPs**: Warm up your sub-domain senders before high-volume holiday blasts.`,

    'dq-summer-multichannel-push': `### 🏆 Key Findings
* **High Engagement Cohort**: App users with a score > 80 converted at **4.0%**, making up 75% of total push sales.
* **iOS CTR Peak**: Apple devices registered a **15.0% direct click rate** compared to Android's 10%.

### ⚠️ Performance Red Flags
* **Android Bounces**: Android recorded a high bounce rate, suggesting obsolete device tokens.
* **Variant B Draw**: Variant B urgency subject line underperformed baseline by 2% open rates.

### 🎯 Recommended Adjustments
* **Clean Device Keys**: Set up automatic token deletion for users inactive for > 90 days.
* **iOS Banner Focus**: Promote app store reviews on high-conversion iOS user streams.`,

    'dq-summer-multichannel-sms': `### 🏆 Key Findings
* **High Open Rate**: Text message marketing achieved a **30.0% read rate**, the fastest activation speed across all channels.
* **Revenue Yield**: Generated **1,600 conversions** from an active list size of 80,000 users.

### ⚠️ Performance Red Flags
* **Carrier Warnings**: T-Mobile carrier spam filters blocked 8,000 messages, leading to delivery drops.
* **Opt-Out Spike**: The reply "STOP" rate reached **0.8%**, indicating high brand friction.

### 🎯 Recommended Adjustments
* **Verify Shortcodes**: Pre-register shortcode headers with major carriers.
* **Add Personalization**: Insert custom customer first name parameters to reduce spam markings.`,
    
    'dq-welcome-email': `### 🏆 Key Findings
* **Variant A Won**: The subject line **"Get a FREE Blizzard Ice Cream! 🍦 Alert"** significantly outperformed Variant B with a **12.0% CTR** versus 10.0%, reaching statistical significance (98.6% confidence).
* **VIP Gold Cohort Lead**: The **VIP Gold segment** (Z-Score: 4.8) drove **6,013 conversions** with a massive **25.0% click-through rate**, confirming high offer affinity for loyal segments.

### ⚠️ Performance Red Flags
* **Fallback Segment Collapse**: The **Default Fallback segment** underperformed drastically with only a **2.3% CTR** and a tiny **0.47% conversion rate** (217 conversions), indicating that the default welcome experience fails to motivate new signups.
* **Unsubscribe Spike**: We registered 308 unsubscribes, concentrated primarily in the mobile client segments.

### 🎯 Recommended Adjustments
* **Promote Gold Logic**: Scale the Gold tier template layout to active Silver tier accounts as a points-accelerator promo.
* **Fix Default Experience**: Redesign the generic fallback copy by inserting localized city parameters and adding an secondary app onboarding checklist to reduce unsubscribe rates.`,
    
    'dq-points-boost-push': `### 🏆 Key Findings
* **Variant A Won**: The copy variant **"Get double points on all Blizzards today! 🍦"** drove a **16.0% open rate** compared to 14.0% for the high-friction Variant B, capturing 96.6% statistical significance.
* **Segment Affinity**: High Engagement segment (score > 80) drove a strong **23.0% CTR** and a **4.0% conversion rate**.

### ⚠️ Performance Red Flags
* **Deliverability Degradation**: Android pushes recorded a 20% higher bounce rate than iOS, suggesting token expiration or notification channel blocking on newer Android versions.
* **Low Engagement Dropoff**: The low-engagement segment (score <= 80) responded poorly, converting at just **0.8%**, indicating promotion fatigue.

### 🎯 Recommended Adjustments
* **Cap Frequency**: Implement a push frequency limit (frequency capping) of 1 promo push per 48 hours for the low-engagement cohort.
* **Android Token Audit**: Trigger automatic token validation cleanup actions on Android app launch to fix push delivery drops.`,
    
    'dq-app-download-iam': `### 🏆 Key Findings
* **Variant A Won**: **"Get App & Unlock Free Ice Cream 🍦"** secured a **30.0% CTR**, proving that direct incentive messaging beats feature-driven copy ("Faster Rewards") by an 8% margin.
* **Mobile Web Dominance**: Mobile web referrals drove a massive **34.0% click-through rate** and **18.0% app conversion rate**, showing high landing-page alignment.

### ⚠️ Performance Red Flags
* **Desktop Conversion Drop**: Desktop web referrals recorded a low **7.3% app conversion rate** due to cross-device friction (users having to scan a QR code or search the App Store manually on phone).
* **Dismissal Spike**: The close icon clicked on 5% of sessions, indicating intrusive sizing on tablet screens.

### 🎯 Recommended Adjustments
* **Implement SMS Link-Out**: Add a "text me a link" form input for desktop visitors instead of a generic QR code to ease mobile transitions.
* **Responsive resizing**: Shrink modal layout sizes by 15% on iPad viewports to prevent banner fatigue.`
  };

  return summaries[lookupKey] || summaries[id] || `### 🏆 Key Findings
* **Primary Variant Lead**: The baseline copy drove a higher click-through rate, outperforming secondary variants.
* **Engagement High**: High-value subscriber cohorts drove the bulk of product purchases.

### ⚠️ Performance Red Flags
* **Low Interest**: Unpersonalized default fallback copies showed negligible conversion rates.
* **Unsubscribe Count**: Registered standard churn rate across segments.

### 🎯 Recommended Adjustments
* **Implement Personalization**: Audit templates to replace static fallback blocks with dynamic Liquid variables.`;
}

